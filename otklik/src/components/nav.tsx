"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import {
  IconChart,
  IconInbox,
  IconShield,
  IconTrendingUp,
  IconUser,
} from "@/components/icons";

type NavItem = { href: string; label: string; badge?: number };

/** Иконка раздела подобрана по адресу: навигация не перегружена, но сканируется быстрее. */
const NAV_ICONS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "/appeals": IconInbox,
  "/inbox": IconUser,
  "/improvements": IconTrendingUp,
  "/analytics": IconChart,
  "/admin": IconShield,
};

export function Nav({ items }: { items: NavItem[] }) {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav aria-label={t("Основная навигация")} className="flex flex-nowrap items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const IconComponent = NAV_ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-white/15 font-semibold text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {IconComponent ? <IconComponent className="h-4 w-4 shrink-0 opacity-90" /> : null}
            {item.label}
            {item.badge ? (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-action px-1 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
