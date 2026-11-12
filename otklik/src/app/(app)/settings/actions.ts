"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/security";

const settingsSchema = z.object({
  notifyInApp: z.boolean(),
  notifyEmail: z.boolean(),
});

export async function updateNotificationSettings(formData: FormData) {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse({
    notifyInApp: formData.get("notifyInApp") === "on",
    notifyEmail: formData.get("notifyEmail") === "on",
  });
  if (!parsed.success) return;

  await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });
  await recordAudit({
    action: "settings.notifications",
    userId: user.id,
    meta: parsed.data,
  });
  revalidatePath("/settings");
  redirect("/settings?saved=notifications");
}

export async function unsubscribeAll() {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { notifyEmail: false, notifyInApp: false },
  });
  await recordAudit({ action: "settings.unsubscribe", userId: user.id });
  revalidatePath("/settings");
  redirect("/settings?saved=unsubscribed");
}
