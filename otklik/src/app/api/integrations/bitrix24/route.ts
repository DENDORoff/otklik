import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, recordAudit } from "@/lib/security";
import {
  getBitrix24IntegrationSecret,
  isBitrix24Configured,
  sanitizeSecret,
} from "@/lib/bitrix24";

export const dynamic = "force-dynamic";

/**
 * Входящий вебхук от облачного портала Битрикс24.
 *
 * Маршрут выключен по умолчанию: без BITRIX24_INTEGRATION_SECRET он отвечает
 * 404 и ничего не меняет. Секрет проверяется заголовком x-otklik-secret или
 * полем secret в теле запроса; сравнение — постоянного времени.
 *
 * Поддерживаются события «задача выполнена» и «задача прокомментирована».
 * Обращение находится по полю Appeal.bitrixTaskId.
 */

type NormalizedEvent = {
  /** Нормализованное имя события: ON_TASK_COMPLETE → TASK_COMPLETE. */
  name: string;
  kind: "complete" | "comment" | "unknown";
  taskId: string | null;
  comment: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

/** Приводит имя события к виду TASK_COMPLETE / TASK_COMMENT_ADD. */
function normalizeEventName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/^ON_?/, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeEvent(body: Record<string, unknown>): NormalizedEvent {
  const data = asRecord(body.data);
  const task = asRecord(data.task);
  const bodyTask = asRecord(body.task);
  const commentNode = asRecord(body.comment);
  const dataComment = asRecord(data.comment);

  const rawName = pickString(
    body.event,
    body.eventName,
    body.event_name,
    body.eventType,
    body.type,
    data.event,
    task.event,
  ) ?? "";

  const name = normalizeEventName(rawName);

  let kind: NormalizedEvent["kind"] = "unknown";
  if (name.includes("TASK") && name.includes("COMPLETE")) kind = "complete";
  else if (name.includes("TASK") && name.includes("COMMENT")) kind = "comment";

  const rawTaskId = pickString(
    body.taskId,
    body.task_id,
    task.id,
    task.ID,
    bodyTask.id,
    bodyTask.ID,
    data.task_id,
    data.taskId,
    data.id,
    data.ID,
  );

  const comment = pickString(
    commentNode.text,
    commentNode.comment,
    body.comment,
    dataComment.text,
    dataComment.comment,
    data.comment,
    task.comment,
    bodyTask.comment,
    data.commentText,
    data.text,
    body.text,
  );

  return {
    name,
    kind,
    // Идентификаторы задач в портале числовые.
    taskId: rawTaskId && /^\d+$/.test(rawTaskId) ? rawTaskId : null,
    comment: comment ? comment.slice(0, 2000) : null,
  };
}

function secretsMatch(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (!raw) return {};
  try {
    return asRecord(JSON.parse(raw));
  } catch {
    try {
      const params = new URLSearchParams(raw);
      const result: Record<string, unknown> = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    } catch {
      return {};
    }
  }
}

/** Автор системного комментария: исполнитель, ответственный или администратор. */
async function resolveSystemAuthor(appeal: {
  assigneeId: string | null;
  responsibleId: string | null;
}): Promise<string | null> {
  if (appeal.assigneeId) return appeal.assigneeId;
  if (appeal.responsibleId) return appeal.responsibleId;
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return admin?.id ?? null;
}

/** Защита от повторной доставки одного и того же события. */
async function isDuplicateComment(appealId: string, text: string): Promise<boolean> {
  const since = new Date(Date.now() - 15 * 60 * 1000);
  const existing = await prisma.comment.findFirst({
    where: { appealId, text },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return Boolean(existing && existing.createdAt >= since);
}

export async function POST(request: Request) {
  // Модуль выключен — маршрута для портала не существует.
  if (!isBitrix24Configured()) {
    return NextResponse.json(
      { ok: false, error: "integration_disabled" },
      { status: 404 },
    );
  }

  const ip = (await getClientIp()).slice(0, 64);
  const limit = rateLimit(`bitrix24:webhook:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await readBody(request);
  const expectedSecret = getBitrix24IntegrationSecret();
  const providedSecret = pickString(
    request.headers.get("x-otklik-secret"),
    body.secret,
    body.token,
  );

  if (!expectedSecret || !providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    await recordAudit({
      action: "bitrix24.webhook_unauthorized",
      meta: { ip, hasSecret: Boolean(providedSecret) },
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const event = normalizeEvent(body);
  if (event.kind === "unknown" || !event.taskId) {
    await recordAudit({
      action: "bitrix24.webhook_ignored",
      meta: { ip, event: event.name || "unknown", reason: event.kind === "unknown" ? "unsupported_event" : "no_task_id" },
    });
    return NextResponse.json({ ok: true, ignored: true, event: event.name || null });
  }

  const appeal = await prisma.appeal.findFirst({
    where: { bitrixTaskId: event.taskId },
    select: {
      id: true,
      code: true,
      status: true,
      authorId: true,
      assigneeId: true,
      responsibleId: true,
      result: true,
    },
  });

  if (!appeal) {
    await recordAudit({
      action: "bitrix24.webhook_unmatched",
      meta: { ip, event: event.name, taskId: event.taskId },
    });
    return NextResponse.json({ ok: true, matched: false, taskId: event.taskId });
  }

  const authorId = await resolveSystemAuthor(appeal);
  const now = new Date();
  const text = event.comment?.trim() ?? "";

  try {
    // Комментарий из портала — в комментарии обращения.
    let commented = false;
    if (text && authorId && !(await isDuplicateComment(appeal.id, text))) {
      await prisma.$transaction([
        prisma.comment.create({
          data: {
            appealId: appeal.id,
            authorId,
            text,
            isClarification: false,
            createdAt: now,
          },
        }),
        prisma.appealHistory.create({
          data: {
            appealId: appeal.id,
            actorId: authorId,
            event: "commented",
            comment: text,
            createdAt: now,
          },
        }),
        prisma.notification.create({
          data: {
            userId: appeal.authorId,
            appealId: appeal.id,
            event: "commented",
            message: `По обращению ${appeal.code} новый комментарий из портала: ${text.slice(0, 100)}`,
          },
        }),
      ]);
      commented = true;
    }

    let applied = false;

    // Задача выполнена в портале — обращение переводится в «Реализовано».
    if (event.kind === "complete" && appeal.status === "in_work") {
      const result = text.length >= 5 ? text : "Выполнено в облачном портале";
      await prisma.$transaction([
        prisma.appeal.update({
          where: { id: appeal.id },
          data: { status: "implemented", result, resolvedAt: now },
        }),
        prisma.appealHistory.create({
          data: {
            appealId: appeal.id,
            actorId: authorId,
            event: "resolved",
            fromStatus: "in_work",
            toStatus: "implemented",
            comment: result,
            createdAt: now,
          },
        }),
        prisma.notification.create({
          data: {
            userId: appeal.authorId,
            appealId: appeal.id,
            event: "implemented",
            message: `Обращение ${appeal.code} выполнено в портале. Посмотрите итог и оцените результат.`,
          },
        }),
      ]);
      applied = true;
    }

    await recordAudit({
      action: "bitrix24.webhook_applied",
      meta: {
        ip,
        event: event.name,
        taskId: event.taskId,
        appealId: appeal.id,
        kind: event.kind,
        applied,
        commented,
      },
    });

    return NextResponse.json({
      ok: true,
      matched: true,
      applied,
      commented,
      appealCode: appeal.code,
    });
  } catch (error) {
    const message = sanitizeSecret(
      error instanceof Error ? error.message : "Не удалось применить событие портала.",
    );
    await recordAudit({
      action: "bitrix24.webhook_failed",
      meta: { ip, event: event.name, taskId: event.taskId, message },
    });
    console.error("[bitrix24] событие портала не обработано:", message);
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}

/** Остальные методы не поддерживаются. */
export async function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
