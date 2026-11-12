import Link from "next/link";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/constants";
import { getTranslator } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslator();
  const user = await requireUser();

  const unread = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  const items = [
    { href: "/appeals", label: t("Обращения") },
    ...(user.role === "head" ? [{ href: "/inbox", label: t("Входящие") }] : []),
    { href: "/improvements", label: t("Улучшения") },
    { href: "/analytics", label: t("Аналитика") },
    ...(user.role === "admin" ? [{ href: "/admin", label: t("Администрирование") }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-[0_2px_10px_rgba(8,39,66,0.22)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/appeals" aria-label={t("Отклик — на главную")} className="shrink-0">
            <Logo />
          </Link>

          <div className="order-3 w-full overflow-x-auto no-scrollbar sm:order-none sm:w-auto">
            <Nav items={items} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/notifications"
              className="inline-flex min-h-11 items-center text-sm text-white/75 transition-colors hover:text-white"
              aria-label={
                unread > 0 ? `Уведомления, непрочитанных: ${unread}` : t("Уведомления")
              }
            >
              <span aria-hidden="true">{t("Уведомления")}</span>
              {unread > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-action px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>

            {/* Имя и роль — просто подпись, а не ссылка: настройки открываются отдельной кнопкой. */}
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium leading-tight text-white">
                {user.name}
              </span>
              <span className="block text-[11px] uppercase tracking-wide text-white/55">
                {roleLabel(user.role)}
                {user.department ? ` · ${user.department.name}` : ""}
              </span>
            </span>

            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center gap-2 rounded border border-white/30 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/80 transition-colors hover:border-white/70 hover:text-white"
              aria-label={t("Настройки профиля, оформления и уведомлений")}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V7a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
              <span>{t("Настройки")}</span>
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded border border-white/30 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/80 transition-colors hover:border-white/70 hover:text-white"
              >
                {t("Выйти")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 scroll-mt-32 px-4 py-6 sm:scroll-mt-24 sm:px-6 sm:py-8">
        {children}
      </main>

      <SiteFooter compact />
    </div>
  );
}
