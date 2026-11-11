import Link from "next/link";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
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
    { href: "/analytics", label: "Аналитика" },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Администрирование" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-brand text-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
          <Link href="/appeals" aria-label="Отклик — на главную">
            <Logo />
          </Link>

          <Nav items={items} />

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/notifications"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Уведомления
              {unread > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>

            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/50">
                {roleLabel(user.role)}
                {user.department ? ` · ${user.department.name}` : ""}
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="rounded border border-white/25 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/70 transition-colors hover:border-white/60 hover:text-white"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-xs text-muted">
        «Отклик» · демо-стенд хакатона ГК «Модус Трейд» · синтетические данные
      </footer>
    </div>
  );
}
