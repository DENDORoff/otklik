import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-line bg-brand text-white">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Отклик — на главную">
            <Logo />
          </Link>
          <nav aria-label="Правовые документы" className="flex flex-wrap items-center gap-1">
            <Link
              href="/legal/privacy"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              Конфиденциальность
            </Link>
            <Link
              href="/legal/terms"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              Условия
            </Link>
            <Link
              href="/legal/cookies"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              Cookie
            </Link>
            <Link href="/login" className="btn btn-secondary ml-1 normal-case">
              Войти
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
