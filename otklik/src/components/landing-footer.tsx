import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/company";
import { getTranslator } from "@/lib/i18n/server";

export async function LandingFooter() {
  const t = await getTranslator();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-md">
            <p className="text-lg font-semibold text-brand-ink">отклик</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t(
                "Внутренняя система обратной связи и предложений сотрудников. Демо-стенд хакатона ГК «Модус Трейд» на синтетических данных.",
              )}
            </p>
          </div>

          <nav aria-label={t("Правовая информация")} className="flex flex-col gap-2 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("Документы")}
            </p>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-muted hover:text-ink">
                {t(link.label)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-xs text-muted">
          {t(
            "Демо-стенд. Данные синтетические: реальные сведения компании не используются.",
          )}
        </p>
      </div>
    </footer>
  );
}
