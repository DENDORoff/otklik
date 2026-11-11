"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SLA_DAYS, type PriorityKey } from "@/lib/constants";
import { canManageAppeal, isAssignee, isAuthor } from "@/lib/permissions";

const DAY = 86_400_000;

async function loadAppeal(id: string) {
  const user = await requireUser();
  const appeal = await prisma.appeal.findUnique({
    where: { id },
    include: { department: true },
  });
  if (!appeal) notFound();
  return { user, appeal };
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
