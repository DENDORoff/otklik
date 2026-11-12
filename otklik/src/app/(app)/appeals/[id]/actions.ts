"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SLA_DAYS, type PriorityKey } from "@/lib/constants";
import { canManageAppeal, isAssignee, isAuthor } from "@/lib/permissions";
import { recordAudit } from "@/lib/security";
import {
  addBitrixTaskComment,
  bitrix24TaskUrl,
  completeBitrixTask,
  createBitrixTask,
  describeBitrix24Error,
  findBitrixUserIdByEmail,
  isBitrix24Configured,
  updateBitrixTask,
} from "@/lib/bitrix24";

const DAY = 86_400_000;

async function loadAppeal(id: string) {
  const user = await requireUser();
  const appeal = await prisma.appeal.findUnique({
    where: { id },
    include: { department: true, category: true },
  });
  if (!appeal) notFound();
  return { user, appeal };
}

/* ------------------------------------------------------------------ *
 * Синхронизация с облачным порталом Битрикс24.
 *
 * Интеграция выключена по умолчанию: без BITRIX24_WEBHOOK_URL все вызовы
 * ниже не выполняются, сеть не трогается, поведение приложения не меняется.
 * Любая ошибка портала не должна ломать основной сценарий — она пишется
 * в журнал безопасности и в консоль без секретов.
 * ------------------------------------------------------------------ */

type SyncActor = { id: string; email: string };

const BITRIX_PRIORITY_LABEL: Record<string, string> = {
  low: "низкий",
  mid: "средний",
  high: "высокий",
};

function bitrixBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Заголовок задачи портала: код обращения и категория. */
function bitrixTaskTitle(appeal: { code: string; category?: { name: string } | null }): string {
  const category = appeal.category?.name ?? "обращение";
  return `Отклик ${appeal.code}: ${category}`.slice(0, 250);
}

/**
 * Описание задачи. Передаётся минимум данных, нужный исполнителю:
 * код, категория, приоритет, срок, текст обращения и ссылка обратно.
 * Персональные данные автора (имя, почта) в портал не передаются.
 */
function bitrixTaskDescription(appeal: {
  code: string;
  id: string;
  text: string;
  priority: string;
  category?: { name: string } | null;
  deadline?: Date | null;
}): string {
  const excerpt = appeal.text.replace(/\s+/g, " ").slice(0, 800);
  const lines = [
    `Обращение ${appeal.code} · категория «${appeal.category?.name ?? "—"}»`,
    `Приоритет: ${BITRIX_PRIORITY_LABEL[appeal.priority] ?? appeal.priority}`,
    appeal.deadline ? `Срок: ${appeal.deadline.toLocaleDateString("ru-RU")}` : "",
    "",
    excerpt,
    "",
    `Открыть в «Отклике»: ${bitrixBaseUrl()}/appeals/${appeal.id}`,
  ];
  return lines.filter((line) => line !== "").join("\n").slice(0, 4000);
}

async function logBitrixSync(
  action: string,
  appealId: string,
  actor: SyncActor | null,
  meta: Record<string, unknown>,
) {
  await recordAudit({
    action,
    userId: actor?.id ?? null,
    email: actor?.email ?? null,
    meta: { appealId, ...meta },
  });
}

/**
 * Создание (или обновление) задачи портала после назначения исполнителя.
 * Ошибка интеграции не влияет на результат назначения.
 */
async function syncBitrix24OnAssign(
  appeal: {
    id: string;
    code: string;
    text: string;
    priority: string;
    deadline?: Date | null;
    category?: { name: string } | null;
    bitrixTaskId?: string | null;
  },
  assignee: { id: string; name: string; email: string },
  deadline: Date,
  actor: SyncActor,
): Promise<void> {
  if (!isBitrix24Configured()) return;

  try {
    // Повторное назначение: задача уже есть — обновляем ответственного и срок.
    if (appeal.bitrixTaskId) {
      const responsibleId = (await findBitrixUserIdByEmail(assignee.email)) ?? undefined;
      await updateBitrixTask(appeal.bitrixTaskId, {
        responsibleId,
        deadline,
        status: 2,
      });
      await addBitrixTaskComment(
        appeal.bitrixTaskId,
        `Исполнитель обновлён: ${assignee.name}. Срок: ${deadline.toLocaleDateString("ru-RU")}.`,
      );
      await logBitrixSync("bitrix24.task_updated", appeal.id, actor, {
        taskId: appeal.bitrixTaskId,
        step: "assign",
      });
      return;
    }

    const responsibleId = await findBitrixUserIdByEmail(assignee.email);
    const task = await createBitrixTask({
      title: bitrixTaskTitle(appeal),
      comment: bitrixTaskDescription({ ...appeal, deadline }),
      responsibleId: responsibleId ?? undefined,
      deadline,
    });

    if (!task?.id) {
      await logBitrixSync("bitrix24.sync_failed", appeal.id, actor, {
        step: "assign",
        reason: "portal_returned_no_task_id",
      });
      return;
    }

    await prisma.appeal.update({
      where: { id: appeal.id },
      data: { bitrixTaskId: task.id, bitrixTaskUrl: bitrix24TaskUrl(task.id) },
    });
    await logBitrixSync("bitrix24.task_created", appeal.id, actor, {
      taskId: task.id,
      responsibleResolved: Boolean(responsibleId),
    });
  } catch (error) {
    const message = describeBitrix24Error(error);
    await logBitrixSync("bitrix24.sync_failed", appeal.id, actor, {
      step: "assign",
      message,
    });
    console.error("[bitrix24] задача не создана:", message);
  }
}

/**
 * Обновление состояния задачи портала при смене статуса обращения.
 * complete — закрыть задачу в порталу; update — оставить открытой.
 */
async function syncBitrix24TaskState(
  appeal: { id: string; bitrixTaskId?: string | null },
  action: "complete" | "update",
  note: string,
  actor: SyncActor,
): Promise<void> {
  if (!isBitrix24Configured()) return;
  if (!appeal.bitrixTaskId) return;

  try {
    if (action === "complete") {
      await completeBitrixTask(appeal.bitrixTaskId, note);
    } else {
      await updateBitrixTask(appeal.bitrixTaskId, { status: 2 });
      await addBitrixTaskComment(appeal.bitrixTaskId, note);
    }
    await logBitrixSync(
      action === "complete" ? "bitrix24.task_completed" : "bitrix24.task_updated",
      appeal.id,
      actor,
      { taskId: appeal.bitrixTaskId, action },
    );
  } catch (error) {
    const message = describeBitrix24Error(error);
    await logBitrixSync("bitrix24.sync_failed", appeal.id, actor, {
      step: action,
      message,
    });
    console.error("[bitrix24] состояние задачи не обновлено:", message);
  }
}

function refresh(id: string) {
  revalidatePath(`/appeals/${id}`);
  revalidatePath("/appeals");
  revalidatePath("/analytics");
  revalidatePath("/notifications");
}

export async function acceptAppeal(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || appeal.status !== "new") return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: { status: "review", firstResponseAt: appeal.firstResponseAt ?? now },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "status_changed",
        fromStatus: "new",
        toStatus: "review",
        comment: "Принято в рассмотрение",
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.authorId,
        appealId: id,
        event: "review",
        message: `Обращение ${appeal.code} принято в рассмотрение`,
      },
    }),
  ]);

  refresh(id);
}

export async function assignAppeal(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || appeal.status !== "review" || !assigneeId) return;

  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, departmentId: appeal.departmentId ?? undefined },
  });
  if (!assignee) return;

  const slaDays = SLA_DAYS[appeal.priority as PriorityKey] ?? 7;
  const deadline = deadlineRaw
    ? new Date(`${deadlineRaw}T18:00:00`)
    : new Date(Date.now() + slaDays * DAY);

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: {
        status: "in_work",
        assigneeId,
        deadline,
        firstResponseAt: appeal.firstResponseAt ?? now,
      },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "assigned",
        fromStatus: "review",
        toStatus: "in_work",
        comment: `Исполнитель: ${assignee.name}. Срок: ${deadline.toLocaleDateString("ru-RU")}`,
        createdAt: now,
      },
    }),
    prisma.notification.createMany({
      data: [
        {
          userId: assignee.id,
          appealId: id,
          event: "assigned",
          message: `Вам назначено обращение ${appeal.code}: ${appeal.text.slice(0, 80)}`,
        },
        {
          userId: appeal.authorId,
          appealId: id,
          event: "in_work",
          message: `Обращение ${appeal.code} взято в работу`,
        },
      ],
    }),
  ]);

  refresh(id);

  // Синхронизация с порталом Битрикс24: создаём задачу исполнителю.
  // Ошибка интеграции не ломает назначение.
  await syncBitrix24OnAssign(appeal, assignee, deadline, { id: user.id, email: user.email });
}

export async function requestClarification(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const text = String(formData.get("comment") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || appeal.status !== "review" || text.length < 5) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: { status: "clarification", firstResponseAt: appeal.firstResponseAt ?? now },
    }),
    prisma.comment.create({
      data: { appealId: id, authorId: user.id, text, isClarification: true, createdAt: now },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "clarification",
        fromStatus: "review",
        toStatus: "clarification",
        comment: text,
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.authorId,
        appealId: id,
        event: "clarification",
        message: `По обращению ${appeal.code} требуется уточнение`,
      },
    }),
  ]);

  refresh(id);
}

export async function rejectAppeal(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || !["new", "review"].includes(appeal.status) || reason.length < 5) {
    return;
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: {
        status: "rejected",
        rejectReason: reason,
        firstResponseAt: appeal.firstResponseAt ?? now,
      },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "rejected",
        fromStatus: appeal.status,
        toStatus: "rejected",
        comment: reason,
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.authorId,
        appealId: id,
        event: "rejected",
        message: `Обращение ${appeal.code} отклонено. Причина в карточке обращения.`,
      },
    }),
  ]);

  refresh(id);

  // Отказ — закрываем задачу в портале с причиной.
  await syncBitrix24TaskState(
    appeal,
    "complete",
    `Обращение ${appeal.code} отклонено. Причина: ${reason}`,
    { id: user.id, email: user.email },
  );
}

export async function resolveAppeal(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const result = String(formData.get("result") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  const allowed = isAssignee(user, appeal) || user.role === "admin";
  if (!allowed || appeal.status !== "in_work" || result.length < 5) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: { status: "implemented", result, resolvedAt: now },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
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
        appealId: id,
        event: "implemented",
        message: `Обращение ${appeal.code} реализовано. Посмотрите итог и оцените результат.`,
      },
    }),
  ]);

  refresh(id);

  // Задача в портале закрывается вместе с обращением.
  await syncBitrix24TaskState(
    appeal,
    "complete",
    `Обращение ${appeal.code} реализовано. Итог: ${result}`,
    { id: user.id, email: user.email },
  );
}

export async function returnToHead(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  if (!isAssignee(user, appeal) || appeal.status !== "in_work" || comment.length < 5) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: { status: "review", assigneeId: null, deadline: null },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "status_changed",
        fromStatus: "in_work",
        toStatus: "review",
        comment: `Возврат начальнику: ${comment}`,
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.responsibleId ?? appeal.authorId,
        appealId: id,
        event: "returned",
        message: `Исполнитель вернул обращение ${appeal.code}: ${comment.slice(0, 100)}`,
      },
    }),
  ]);

  refresh(id);

  // Задача в портале остаётся открытой: ждём нового исполнителя.
  await syncBitrix24TaskState(
    appeal,
    "update",
    `Обращение ${appeal.code} возвращено начальнику: ${comment}`,
    { id: user.id, email: user.email },
  );
}

export async function replyClarification(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const text = String(formData.get("reply") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  if (!isAuthor(user, appeal) || appeal.status !== "clarification" || text.length < 3) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: { status: "review" },
    }),
    prisma.comment.create({
      data: { appealId: id, authorId: user.id, text, isClarification: false, createdAt: now },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "status_changed",
        fromStatus: "clarification",
        toStatus: "review",
        comment: text,
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.responsibleId ?? appeal.authorId,
        appealId: id,
        event: "clarified",
        message: `Автор ответил на уточнение по обращению ${appeal.code}`,
      },
    }),
  ]);

  refresh(id);
}

export async function redirectDepartment(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || appeal.status !== "review" || !departmentId) return;

  const target = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { head: true },
  });
  if (!target || target.id === appeal.departmentId) return;

  const now = new Date();
  const nextCount = appeal.redirectCount + 1;
  const limitReached = nextCount > 3;

  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: {
        departmentId: limitReached ? null : target.id,
        responsibleId: limitReached ? null : target.head?.id ?? null,
        assigneeId: null,
        deadline: null,
        redirectCount: nextCount,
        status: "review",
      },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "redirect",
        fromStatus: appeal.status,
        toStatus: "review",
        fromDepartmentId: appeal.departmentId,
        toDepartmentId: limitReached ? null : target.id,
        comment: limitReached
          ? "Превышен лимит перенаправлений (3) — обращение эскалировано администратору"
          : `Передано в подразделение «${target.name}»${comment ? `: ${comment}` : ""}`,
        createdAt: now,
      },
    }),
    prisma.notification.createMany({
      data: [
        {
          userId: appeal.authorId,
          appealId: id,
          event: "redirect",
          message: limitReached
            ? `Обращение ${appeal.code} эскалировано администратору`
            : `Обращение ${appeal.code} передано в профильное подразделение «${target.name}»`,
        },
        ...(limitReached
          ? (
              await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } })
            ).map((admin) => ({
              userId: admin.id,
              appealId: id,
              event: "escalated",
              message: `Обращение ${appeal.code} требует решения: превышен лимит перенаправлений`,
            }))
          : target.head
            ? [
                {
                  userId: target.head.id,
                  appealId: id,
                  event: "redirect",
                  message: `В ваш отдел передано обращение ${appeal.code}`,
                },
              ]
            : []),
      ],
    }),
  ]);

  refresh(id);

  // Обращение передано другому отделу — задача в портале закрывается.
  await syncBitrix24TaskState(
    appeal,
    "complete",
    `Обращение ${appeal.code} передано в подразделение «${target.name}».`,
    { id: user.id, email: user.email },
  );
  redirect("/appeals");
}

export async function markDuplicate(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const code = String(formData.get("duplicateCode") ?? "")
    .trim()
    .toUpperCase();
  const { user, appeal } = await loadAppeal(id);

  if (!canManageAppeal(user, appeal) || !["new", "review"].includes(appeal.status)) return;

  const original = await prisma.appeal.findFirst({ where: { code: { equals: code } } });
  if (!original || original.id === id) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.appeal.update({
      where: { id },
      data: {
        status: "duplicate",
        duplicateOfId: original.id,
        assigneeId: null,
        deadline: null,
      },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "duplicate",
        fromStatus: appeal.status,
        toStatus: "duplicate",
        comment: `Дубликат обращения ${original.code}`,
        createdAt: now,
      },
    }),
    prisma.appealSubscription.upsert({
      where: { appealId_userId: { appealId: original.id, userId: appeal.authorId } },
      create: { appealId: original.id, userId: appeal.authorId },
      update: {},
    }),
    prisma.notification.create({
      data: {
        userId: appeal.authorId,
        appealId: id,
        event: "duplicate",
        message: `Обращение ${appeal.code} отмечено дубликатом ${original.code}. Вы подписаны на обновления оригинала.`,
      },
    }),
  ]);

  refresh(id);
  revalidatePath(`/appeals/${original.id}`);

  // Дубликат — закрываем задачу в портале.
  await syncBitrix24TaskState(
    appeal,
    "complete",
    `Обращение ${appeal.code} помечено как дубликат ${original.code}.`,
    { id: user.id, email: user.email },
  );
}

export async function rateAppeal(formData: FormData) {
  const id = String(formData.get("appealId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const { user, appeal } = await loadAppeal(id);

  if (!isAuthor(user, appeal) || !["implemented", "closed"].includes(appeal.status)) return;
  if (!Number.isInteger(score) || score < 1 || score > 5) return;

  const now = new Date();
  await prisma.$transaction([
    prisma.rating.upsert({
      where: { appealId: id },
      create: { appealId: id, authorId: user.id, score, createdAt: now },
      update: { score },
    }),
    prisma.appeal.update({
      where: { id },
      data: { status: "closed", closedAt: now },
    }),
    prisma.appealHistory.create({
      data: {
        appealId: id,
        actorId: user.id,
        event: "rated",
        fromStatus: appeal.status,
        toStatus: "closed",
        comment: `Оценка автора: ${score} из 5`,
        createdAt: now,
      },
    }),
    prisma.notification.create({
      data: {
        userId: appeal.assigneeId ?? appeal.responsibleId ?? user.id,
        appealId: id,
        event: "rated",
        message: `Обращение ${appeal.code} оценено на ${score} из 5 и закрыто`,
      },
    }),
  ]);

  refresh(id);
}
