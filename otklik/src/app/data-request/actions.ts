"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientIp, rateLimit, recordAudit } from "@/lib/security";

const requestSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(120),
  email: z.string().trim().toLowerCase().email("Проверьте адрес почты").max(200),
  kind: z.enum(["access", "delete", "correct", "withdraw"], {
    message: "Выберите тип запроса",
  }),
  message: z.string().trim().min(10, "Опишите запрос подробнее").max(4000),
  consent: z.literal("on", { message: "Нужно согласие на обработку данных" }),
  adult: z.literal("on", { message: "Подтвердите, что вам 18 лет или больше" }),
});

export async function submitDataRequest(formData: FormData) {
  const ip = await getClientIp();
  const limit = rateLimit(`data-request:${ip}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
    blockMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) redirect("/data-request?error=rate");

  const parsed = requestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    kind: formData.get("kind"),
    message: formData.get("message"),
    consent: formData.get("consent"),
    adult: formData.get("adult"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Проверьте поля формы";
    redirect(`/data-request?error=${encodeURIComponent(first)}`);
  }

  const data = parsed.data;

  try {
    const request = await prisma.dataRequest.create({
      data: {
        name: data.name,
        email: data.email,
        kind: data.kind,
        message: data.message,
      },
    });
    await recordAudit({
      action: "data_request.created",
      email: data.email,
      meta: { kind: data.kind, requestId: request.id },
    });

    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });
    if (admins.length) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          event: "data_request",
          message: `Запрос по персональным данным (${data.kind}) от ${data.email}`,
        })),
      });
    }
  } catch {
    redirect("/data-request?error=server");
  }

  redirect("/data-request?sent=1");
}
