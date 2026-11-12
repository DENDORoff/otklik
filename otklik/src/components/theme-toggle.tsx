"use client";

import { useEffect, useLayoutEffect } from "react";
import { useT } from "@/components/i18n-provider";

/**
 * Синхронизация темы после гидрации.
 *
 * Инлайн-скрипт в <head> ставит класс .dark до первой отрисовки, но React при
 * гидрации может переписать атрибуты <html> и снять класс. Этот компонент
 * переподтверждает выбор пользователя сразу после коммита (useLayoutEffect
 * выполняется до отрисовки — вспышки нет).
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem("theme");
    } catch {
      saved = null;
    }
    const theme =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, []);

  return null;
}

/**
 * Переключатель светлой и тёмной темы.
 * Тема хранится в localStorage и cookie; класс .dark ставится на <html>.
 * Иконки переключаются только через CSS (dark:), поэтому нет рассинхрона гидратации.
 */
export function ThemeToggle({
  className = "",
  variant = "onDark",
}: {
  className?: string;
  variant?: "onDark" | "onSurface";
}) {
  const t = useT();
  function toggle() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* приватный режим — тема просто не запомнится */
    }
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }

  const tone =
    variant === "onSurface"
      ? "border-line text-muted hover:border-muted hover:text-ink"
      : "border-white/30 text-white/80 hover:border-white/70 hover:text-white";

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border transition-colors",
        tone,
        className,
      ].join(" ")}
    >
      <span className="sr-only dark:hidden">{t("Включить тёмную тему")}</span>
      <span className="sr-only hidden dark:inline">{t("Включить светлую тему")}</span>
      {/* Луна — предложение включить тёмную тему. */}
      <svg
        aria-hidden="true"
        className="h-5 w-5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      {/* Солнце — предложение вернуться к светлой теме. */}
      <svg
        aria-hidden="true"
        className="hidden h-5 w-5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
