"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/security";

export async function updateRoutingRule(formData: FormData) {
  const admin = await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "");
  if (!categoryId) return;

  // «Не направлять»: выключаем правило — обращения попадут в очередь «Неназначенные».
  if (!departmentId) {
    await prisma.routingRule.updateMany({
      where: { categoryId },
      data: { isActive: false },
    });
    await recordAudit({
      action: "admin.routing_disabled",
      userId: admin.id,
      email: admin.email,
      meta: { categoryId },
    });
    revalidatePath("/admin");
    revalidatePath("/appeals");
    return;
  }

  const [category, department] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    prisma.department.findUnique({ where: { id: departmentId } }),
  ]);
  if (!category || !department) return;

  // Одно активное правило на категорию: остальные выключаем.
  await prisma.routingRule.updateMany({
    where: { categoryId, departmentId: { not: departmentId } },
    data: { isActive: false },
  });

  await prisma.routingRule.upsert({
    where: { categoryId_departmentId: { categoryId, departmentId } },
    create: { categoryId, departmentId, weight: 10, isActive: true },
    update: { isActive: true, weight: 10 },
  });

  await recordAudit({
    action: "admin.routing_updated",
    userId: admin.id,
    email: admin.email,
    meta: { category: category.name, department: department.name },
  });

  revalidatePath("/admin");
  revalidatePath("/appeals");
}

const dataRequestSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["in_progress", "done", "rejected"]),
});

export async function handleDataRequest(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = dataRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await prisma.dataRequest.updateMany({
    where: { id: parsed.data.requestId },
    data: {
      status: parsed.data.status,
      handledAt: parsed.data.status === "done" ? new Date() : null,
    },
  });
  await recordAudit({
    action: "admin.data_request_updated",
    userId: admin.id,
    email: admin.email,
    meta: { requestId: parsed.data.requestId, status: parsed.data.status },
  });
  revalidatePath("/admin");
}
