"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function updateRoutingRule(formData: FormData) {
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") ?? "");
  const departmentId = String(formData.get("departmentId") ?? "");
  if (!categoryId) return;

  // «Не направлять»: выключаем правило — обращения попадут в очередь «Неназначенные».
  if (!departmentId) {
    await prisma.routingRule.updateMany({
      where: { categoryId },
      data: { isActive: false },
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

  revalidatePath("/admin");
  revalidatePath("/appeals");
}
