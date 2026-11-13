"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COMPANY } from "@/lib/company";
import { storeAttachment } from "@/lib/storage";
import {
  rateLimit,
  recordAudit,
  safeFileName,
  UPLOAD_LIMIT_BYTES,
  validateUploadMime,
  validateUploadName,
  validateUploadSignature,
} from "@/lib/security";

const appealSchema = z.object({
  type: z.enum(["problem", "proposal", "praise"], { message: "Выберите тип обращения" }),
  categoryId: z.string().min(1, "Выберите категорию"),
  customCategory: z.string().trim().max(120).optional(),
  priority: z.enum(["high", "mid", "low"], { message: "Выберите приоритет" }),
  text: z.string().trim().min(10, "Описание — не короче 10 символов").max(4000),
  proposal: z.string().trim().max(4000).optional(),
  consent: z.literal("on", { message: "Нужно согласие на обработку данных" }),
});

async function nextCode(): Promise<string> {
  const rows = await prisma.appeal.findMany({ select: { code: true } });
  const max = rows.reduce((acc, row) => {
    const value = Number.parseInt(row.code.replace(/\D/g, ""), 10);
    return Number.isFinite(value) ? Math.max(acc, value) : acc;
  }, 0);
  return `A-${String(max + 1).padStart(3, "0")}`;
}

async function saveAttachment(appealId: string, file: File) {
  if (!file || file.size === 0) return null;
  if (file.size > UPLOAD_LIMIT_BYTES) return "file";

  const nameError = validateUploadName(file.name);
  const mimeError = validateUploadMime(file.type);
  if (nameError || mimeError) return "file";

  const buffer = Buffer.from(await file.arrayBuffer());
  const signatureError = validateUploadSignature(new Uint8Array(buffer.subarray(0, 8)));
  if (signatureError) return "file";

  const storedName = `${Date.now()}-${safeFileName(file.name)}`;
  const storedPath = await storeAttachment(buffer, storedName);

  await prisma.attachment.create({
    data: {
      appealId,
      fileName: safeFileName(file.name),
      storedPath,
      mimeType: file.type || null,
      size: file.size,
    },
  });
  return null;
}

export async function createAppeal(formData: FormData) {
  const user = await requireUser();

  const limit = rateLimit(`appeal:${user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) redirect("/appeals/new?error=rate");

  const parsed = appealSchema.safeParse({
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    customCategory: formData.get("customCategory") || undefined,
    priority: formData.get("priority"),
    text: formData.get("text"),
    proposal: formData.get("proposal") || undefined,
    consent: formData.get("consent"),
  });

  if (!parsed.success) redirect("/appeals/new?error=validation");

  const data = parsed.data;
  const isOther = data.categoryId === "__other__";

  let category;
  if (isOther) {
    const custom = (data.customCategory ?? "").trim();
    if (custom.length < 3) redirect("/appeals/new?error=validation");
    category = await prisma.category.upsert({
      where: { name: "Другое" },
      update: { isActive: true },
      create: { name: "Другое" },
    });
  } else {
    category = await prisma.category.findFirst({
      where: { id: data.categoryId, isActive: true },
    });
  }
  if (!category) redirect("/appeals/new?error=category");

  const rule = await prisma.routingRule.findFirst({
    where: { categoryId: category.id, isActive: true },
    orderBy: { weight: "desc" },
    include: { department: { include: { head: true } } },
  });

  const departmentId = rule?.departmentId ?? null;
  const responsibleId = rule?.department?.headId ?? null;
  const code = await nextCode();
  const now = new Date();

  const appeal = await prisma.appeal.create({
    data: {
      code,
      authorId: user.id,
      type: data.type,
      categoryId: category.id,
      customCategory: isOther ? (data.customCategory ?? null) : null,
      priority: data.priority,
      text: data.text,
      proposal: data.type === "proposal" ? data.proposal || data.text : data.proposal || null,
      departmentId,
      responsibleId,
      status: "new",
      createdAt: now,
      publishedAt: now,
      history: {
        create: {
          actorId: user.id,
          event: "published",
          toStatus: "new",
          comment: isOther
            ? `Обращение зарегистрировано. Категория автора: ${data.customCategory}`
            : "Обращение зарегистрировано",
          createdAt: now,
        },
      },
    },
  });

  await prisma.user.updateMany({
    where: { id: user.id, consentVersion: null },
    data: { consentVersion: COMPANY.consentVersion, consentAt: now },
  });

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const fileError = await saveAttachment(appeal.id, file);
    if (fileError) {
      await recordAudit({
        action: "appeal.attachment_rejected",
        userId: user.id,
        meta: { appealId: appeal.id, fileName: file.name, size: file.size, type: file.type },
      });
    }
  }

  const notifications = [
    {
      userId: user.id,
      appealId: appeal.id,
      event: "published",
      message: `Обращение ${code} зарегистрировано. Мы сообщим о ходе рассмотрения.`,
    },
  ];

  if (responsibleId) {
    notifications.push({
      userId: responsibleId,
      appealId: appeal.id,
      event: "new",
      message: `Новое обращение ${code} в вашем отделе: ${category.name}`,
    });
  } else {
    const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } });
    for (const admin of admins) {
      notifications.push({
        userId: admin.id,
        appealId: appeal.id,
        event: "unassigned",
        message: `Обращение ${code} попало в очередь «Неназначенные»: нет правила маршрутизации.`,
      });
    }
  }

  await prisma.notification.createMany({ data: notifications });
  await recordAudit({
    action: "appeal.created",
    userId: user.id,
    meta: {
      appealId: appeal.id,
      code,
      category: isOther ? `Другое: ${data.customCategory}` : category.name,
      priority: data.priority,
      routed: Boolean(departmentId),
    },
  });

  revalidatePath("/appeals");
  revalidatePath("/improvements");
  redirect(`/appeals/${appeal.id}?created=1`);
}
