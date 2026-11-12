import { checkBitrix24ConnectionAction } from "@/app/(app)/admin/bitrix24-actions";
import { SubmitButton } from "@/components/submit-button";
import { getBitrix24Config, isBitrix24Configured } from "@/lib/bitrix24";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getTranslator } from "@/lib/i18n/server";

type CheckMeta = { ok?: boolean; configured?: boolean; message?: string };

/**
 * Карточка интеграции с облачным порталом Битрикс24 (админка).
 *
 * Показывает состояние подключения, портал, число обращений с привязанной
 * задачей и результат последней проверки связи. Сама карточка ничего не
 * меняет: проверка — один read-only вызов портала.
 */
export async function Bitrix24Card() {
  const t = await getTranslator();
  const configured = isBitrix24Configured();
  const config = getBitrix24Config();

  const [linkedCount, lastCheck] = await Promise.all([
    prisma.appeal.count({ where: { bitrixTaskId: { not: null } } }),
    prisma.auditLog.findFirst({
      where: { action: "bitrix24.connection_check" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, meta: true },
    }),
  ]);

  let checkMeta: CheckMeta | null = null;
  if (lastCheck?.meta) {
    try {
      checkMeta = JSON.parse(lastCheck.meta) as CheckMeta;
    } catch {
      checkMeta = null;
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-lg font-bold text-brand-ink">{t("Интеграция с Битрикс24")}</h2>
        <p className="mt-1 text-xs text-muted">
          {t("Обращения → задачи в облачном портале. По умолчанию интеграция выключена.")}
        </p>
      </div>

      <div className="px-5 py-4">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">{t("Состояние")}</dt>
            <dd>
              {configured ? (
                <span className="badge bg-[#EAF7F1] text-[#136C4A] dark:bg-[#102A1D] dark:text-[#5FD3A3]">
                  {t("настроен")}
                </span>
              ) : (
                <span className="badge bg-[#EFF1F4] text-[#5C6675] dark:bg-[#1B2836] dark:text-[#9AA9BC]">
                  {t("не настроен")}
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">{t("Портал")}</dt>
            <dd className="font-medium text-ink">
              {config?.portalId || (configured ? t("идентификатор не задан") : "—")}
            </dd>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">{t("Обращений с задачей в портале")}</dt>
            <dd className="font-medium text-ink">{linkedCount}</dd>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">{t("Последняя проверка")}</dt>
            <dd className="text-right">
              {lastCheck ? (
                <>
                  <span
                    className={
                      checkMeta?.ok
                        ? "font-medium text-[#136C4A] dark:text-[#5FD3A3]"
                        : "font-medium text-[#D40000] dark:text-[#FF7A7A]"
                    }
                  >
                    {checkMeta?.ok ? t("соединение установлено") : t("ошибка связи")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatDateTime(lastCheck.createdAt, t.locale)}
                    {checkMeta?.message ? ` · ${checkMeta.message}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-muted">{t("проверка не выполнялась")}</span>
              )}
            </dd>
          </div>
        </dl>

        <form action={checkBitrix24ConnectionAction} className="mt-4">
          <SubmitButton className="btn btn-secondary" pendingText={t("Проверяем…")}>
            {t("Проверить соединение")}
          </SubmitButton>
        </form>

        {!configured ? (
          <p className="mt-3 text-xs text-muted">
            {t(
              "Чтобы включить интеграцию, задайте переменные окружения BITRIX24_WEBHOOK_URL, BITRIX24_PORTAL_ID и BITRIX24_INTEGRATION_SECRET.",
            )}
          </p>
        ) : null}
      </div>
    </section>
  );
}
