"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n-provider";

type NavItem = { href: string; label: string; badge?: number };

export function Nav({ items }: { items: NavItem[] }) {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav aria-label={t("Основная навигация")} className="flex flex-nowrap items-center gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex min-h-11 items-center whitespace-nowrap rounded px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-white/15 font-semibold text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {item.label}
            {item.badge ? (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-action px-1 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
