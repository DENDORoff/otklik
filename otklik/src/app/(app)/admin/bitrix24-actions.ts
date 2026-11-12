"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/security";
import { checkBitrix24Connection } from "@/lib/bitrix24";

/**
 * Проверка связи с облачным порталом Битрикс24 из карточки админки.
 *
 * Выполняется один read-only вызов (user.current) — данные не изменяются,
 * секреты в журнал и в ответ не попадают.
 */
export async function checkBitrix24ConnectionAction() {
  const admin = await requireAdmin();

  const result = await checkBitrix24Connection();

  await recordAudit({
    action: "bitrix24.connection_check",
    userId: admin.id,
    email: admin.email,
    meta: {
      ok: result.ok,
      configured: result.configured,
      message: result.message,
    },
  });

  revalidatePath("/admin");
}
