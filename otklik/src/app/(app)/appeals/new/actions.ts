"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRIORITY_META, TYPE_META } from "@/lib/constants";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function nextCode(): Promise<string> {
  const rows = await prisma.appeal.findMany({ select: { code: true } });
  const max = rows.reduce((acc, row) => {
    const value = Number.parseInt(row.code.replace(/\D/g, ""), 10);
    return Number.isFinite(value) ? Math.max(acc, value) : acc;
  }, 0);
  return `A-${String(max + 1).padStart(3, "0")}`;
}

async function saveAttachment(appealId: string, file: File) {
  if (!file || file.size === 0) return;
  if (file.size > MAX_FILE_SIZE) return;

  const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120);
  const storedName = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "storage", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), buffer);

  await prisma.attachment.create({
    data: {
      appealId,
      fileName: file.name,
      storedPath: `storage/uploads/${storedName}`,
      mimeType: file.type || null,
      size: file.size,
    },
  });
}

export async function createAppeal(formData: FormData) {
  const user = await requireUser();

  const type = String(formData.get("type") ?? "problem");
  const categoryId = String(formData.get("categoryId") ?? "");
  const priority = String(formData.get("priority") ?? "mid");
  const text = String(formData.get("text") ?? "").trim();
  const proposalRaw = String(formData.get("proposal") ?? "").trim();

  if (!(type in TYPE_META) || !categoryId || !(priority in PRIORITY_META) || text.length < 10) {
    redirect("/appeals/new?error=validation");
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, isActive: true },
  });
  if (!category) redirect("/appeals/new?error=category");

  const rule = await prisma.routingRule.findFirst({
    where: { categoryId, isActive: true },
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
      type,
      categoryId,
      priority,
      text,
      proposal: type === "proposal" ? proposalRaw || text : proposalRaw || null,
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
          comment: "Обращение зарегистрировано",
          createdAt: now,
        },
      },
    },
  });

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    await saveAttachment(appeal.id, file);
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

  revalidatePath("/appeals");
  redirect(`/appeals/${appeal.id}?created=1`);
}
