"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n-provider";
import { IconBell, IconChevronDown, IconLogOut, IconSettings } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

/**
 * Меню профиля в шапке.
 *
 * В шапке остаётся только то, чем пользуются часто: лого, разделы и вход в профиль.
 * Редкие элементы (уведомления, настройки, выход) спрятаны в выпадающий список,
 * чтобы шапка не превращалась в панель кнопок.
 */
export function ProfileMenu({
  name,
  role,
  department,
  unread,
  logoutAction,
}: {
  name: string;
  role: string;
  department?: string | null;
  unread: number;
  logoutAction: () => Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const itemClass =
    "flex w-full min-h-11 items-center gap-3 rounded px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-canvas";

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-11 items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-white/10"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-bold uppercase tracking-wide text-white"
        >
          {initials}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-sm font-medium leading-tight text-white">{name}</span>
          <span className="block text-[11px] uppercase tracking-wide text-white/55">
            {role}
            {department ? ` · ${department}` : ""}
          </span>
        </span>
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <span className="sr-only">{t("Меню профиля")}</span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t("Меню профиля")}
          className="absolute right-0 z-40 mt-2 w-64 rounded border border-line bg-surface p-1.5 shadow-xl"
        >
          <Link
            href="/notifications"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <IconBell className="h-4 w-4 shrink-0 text-muted" />
            <span className="flex-1">{t("Уведомления")}</span>
            {unread > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-action px-1 text-[11px] font-bold text-white">
                {unread}
              </span>
            ) : null}
          </Link>

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            <IconSettings className="h-4 w-4 shrink-0 text-muted" />
            <span className="flex-1">{t("Настройки")}</span>
          </Link>

          <div className="my-1 border-t border-line" role="separator" />

          <form action={logoutAction}>
            <SubmitButton className={itemClass} pendingText={t("Выходим…")} role="menuitem">
              <IconLogOut className="h-4 w-4 shrink-0 text-muted" />
              <span className="flex-1">{t("Выйти")}</span>
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
