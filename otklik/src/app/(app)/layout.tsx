import Link from "next/link";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { ProfileMenu } from "@/components/profile-menu";
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

          <div className="ml-auto flex items-center gap-2">
            <ProfileMenu
              name={user.name}
              role={roleLabel(user.role)}
              department={user.department?.name ?? null}
              unread={unread}
              logoutAction={logout}
            />
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
