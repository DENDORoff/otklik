import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { getTranslator } from "@/lib/i18n/server";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslator();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-brand text-white shadow-[0_2px_10px_rgba(8,39,66,0.22)]">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label={t("Отклик — на главную")}>
            <Logo />
          </Link>
          <nav aria-label={t("Правовые документы")} className="flex flex-wrap items-center gap-1">
            <Link
              href="/legal/privacy"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              {t("Конфиденциальность")}
            </Link>
            <Link
              href="/legal/terms"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              {t("Условия")}
            </Link>
            <Link
              href="/legal/cookies"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              Cookie
            </Link>
            <Link href="/login" className="btn btn-secondary ml-1 normal-case">
              {t("Войти")}
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 scroll-mt-20 px-4 py-12 sm:px-6">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
