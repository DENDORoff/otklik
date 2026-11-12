import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslator } from "@/lib/i18n/server";

const NAV = [
  { href: "#how", label: "Как это работает" },
  { href: "#features", label: "Возможности" },
  { href: "#stats", label: "Статистика" },
  { href: "#integrations", label: "Развитие" },
];

export async function LandingHeader({ signedIn }: { signedIn: boolean }) {
  const t = await getTranslator();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-brand/95 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label={t("Отклик — на главную")} className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label={t("Разделы страницы")} className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t(item.label)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href={signedIn ? "/appeals" : "/login"} className="btn btn-primary normal-case">
            {t(signedIn ? "Открыть обращения" : "Войти")}
          </Link>
        </div>
      </div>
    </header>
  );
}
