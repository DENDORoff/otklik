import Link from "next/link";
import { COMPANY, LEGAL_LINKS } from "@/lib/company";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-sm font-bold text-brand-ink">{COMPANY.product}</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
              Внутренняя система обратной связи и предложений сотрудников. Демонстрационный
              стенд хакатона, синтетические данные из датасета.
            </p>
            {!compact ? (
              <dl className="mt-4 space-y-1 text-xs leading-relaxed text-muted">
                <div>
                  <dt className="inline font-semibold text-ink">Оператор: </dt>
                  <dd className="inline">{COMPANY.legalName}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">БИН: </dt>
                  <dd className="inline">{COMPANY.bin}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Адрес: </dt>
                  <dd className="inline">{COMPANY.address}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Телефон: </dt>
                  <dd className="inline">{COMPANY.phone}</dd>
                </div>
              </dl>
            ) : null}
          </div>

          <nav aria-label="Правовая информация">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Документы
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink hover:text-link hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Связаться
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-ink">
              <li>
                <a
                  href={`mailto:${COMPANY.privacyEmail}`}
                  className="underline decoration-from-font underline-offset-2 hover:text-link"
                >
                  {COMPANY.privacyEmail}
                </a>{" "}
                — персональные данные
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY.supportEmail}`}
                  className="underline decoration-from-font underline-offset-2 hover:text-link"
                >
                  {COMPANY.supportEmail}
                </a>{" "}
                — поддержка
              </li>
              <li>
                <Link href="/settings" className="hover:text-link hover:underline">
                  Настройки уведомлений и отписка
                </Link>
              </li>
              <li>
                <Link href="/data-request" className="hover:text-link hover:underline">
                  Запрос на удаление данных
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
          <p>
            © 2026 {COMPANY.brand}. Демонстрационные реквизиты. Обновлено {COMPANY.updatedAt}.
          </p>
          <p>
            Данные обрабатываются по согласию пользователя.{" "}
            <Link href="/legal/consent" className="underline underline-offset-2">
              Версия {COMPANY.consentVersion}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
