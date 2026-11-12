import Link from "next/link";
import { COMPANY, LEGAL_LINKS } from "@/lib/company";
import { getTranslator } from "@/lib/i18n/server";

export async function SiteFooter({ compact = false }: { compact?: boolean }) {
  const t = await getTranslator();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-sm font-bold text-brand-ink">{COMPANY.product}</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
              {t("Внутренняя система обратной связи и предложений сотрудников. Демонстрационный стенд хакатона, синтетические данные из датасета.")}
            </p>
            {!compact ? (
              <dl className="mt-4 space-y-1 text-xs leading-relaxed text-muted">
                <div>
                  <dt className="inline font-semibold text-ink">{t("Оператор:")} </dt>
                  <dd className="inline">{COMPANY.legalName}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">{t("БИН:")} </dt>
                  <dd className="inline">{COMPANY.bin}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">{t("Адрес:")} </dt>
                  <dd className="inline">{COMPANY.address}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">{t("Телефон:")} </dt>
                  <dd className="inline">{COMPANY.phone}</dd>
                </div>
              </dl>
            ) : null}
          </div>

          <nav aria-label={t("Правовая информация")}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {t("Документы")}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink hover:text-link hover:underline">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {t("Связаться")}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-ink">
              <li>
                <a
                  href={`mailto:${COMPANY.privacyEmail}`}
                  className="underline decoration-from-font underline-offset-2 hover:text-link"
                >
                  {COMPANY.privacyEmail}
                </a>{" "}
                {t("— персональные данные")}
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.supportEmail}`}
                  className="underline decoration-from-font underline-offset-2 hover:text-link"
                >
                  {COMPANY.supportEmail}
                </a>{" "}
                {t("— поддержка")}
              </li>
              <li>
                <Link href="/settings" className="hover:text-link hover:underline">
                  {t("Настройки уведомлений и отписка")}
                </Link>
              </li>
              <li>
                <Link href="/data-request" className="hover:text-link hover:underline">
                  {t("Запрос на удаление данных")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
          <p>
            © 2026 {COMPANY.brand}{t(". Демонстрационные реквизиты. Обновлено")} {COMPANY.updatedAt}.
          </p>
          <p>
            {t("Данные обрабатываются по согласию пользователя.")}{" "}
            <Link href="/legal/consent" className="underline underline-offset-2">
              {t("Версия")} {COMPANY.consentVersion}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
