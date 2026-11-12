import Link from "next/link";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const unread = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  const items = [
    { href: "/appeals", label: "Обращения" },
    ...(user.role === "head" ? [{ href: "/inbox", label: "Входящие" }] : []),
    { href: "/improvements", label: "Улучшения" },
    { href: "/analytics", label: "Аналитика" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Администрирование" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-[0_2px_10px_rgba(8,39,66,0.22)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
          <Link href="/appeals" aria-label="Отклик — на главную" className="shrink-0">
            <Logo />
          </Link>

          <div className="order-3 w-full overflow-x-auto no-scrollbar sm:order-none sm:w-auto">
            <Nav items={items} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/notifications"
              className="inline-flex min-h-11 items-center text-sm text-white/75 transition-colors hover:text-white"
              aria-label={
                unread > 0 ? `Уведомления, непрочитанных: ${unread}` : "Уведомления"
              }
            >
              <span aria-hidden="true">Уведомления</span>
              {unread > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-action px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>

            <Link
              href="/settings"
              className="hidden text-right sm:block"
              aria-label="Настройки профиля и уведомлений"
            >
              <span className="block text-sm font-medium leading-tight text-white hover:underline">
                {user.name}
              </span>
              <span className="block text-[11px] uppercase tracking-wide text-white/55">
                {roleLabel(user.role)}
                {user.department ? ` · ${user.department.name}` : ""}
              </span>
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded border border-white/30 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/80 transition-colors hover:border-white/70 hover:text-white"
              >
                Выйти
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
