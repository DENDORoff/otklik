"use client";

import { useEffect, useLayoutEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { LOCALE_COOKIE, LOCALE_SHORT, LOCALES, type Locale } from "@/lib/i18n";
import { applyTheme, readTheme, saveTheme, type ThemeChoice } from "@/lib/theme";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Синхронизация темы после гидрации.
 *
 * Инлайн-скрипт в <head> ставит класс .dark до первой отрисовки, но React при
 * гидрации может переписать атрибуты <html> и снять класс. Этот компонент
 * переподтверждает выбор пользователя сразу после коммита (useLayoutEffect
 * выполняется до отрисовки — вспышки нет).
 *
 * Если выбран вариант «как в системе», компонент слушает prefers-color-scheme
 * и переключает тему, когда системная настройка меняется.
 */
export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    const choice = readTheme();
    applyTheme(choice);

    if (choice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return null;
}

/**
 * Блок «Оформление и язык» в настройках: тема (светлая / тёмная / как в системе)
 * и язык интерфейса (RU / EN / KZ).
 */
export function AppearanceSettings() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function changeTheme(next: ThemeChoice) {
    setTheme(next);
    saveTheme(next);
  }

  function changeLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const themeOptions: { value: ThemeChoice; label: string }[] = [
    { value: "light", label: t("Светлая") },
    { value: "dark", label: t("Тёмная") },
    { value: "system", label: t("Как в системе") },
  ];

  return (
    <div className="mt-4 grid gap-6 sm:grid-cols-2">
      <fieldset>
        <legend className="label">{t("Тема оформления")}</legend>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={t("Тема оформления")}
        >
          {themeOptions.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeTheme(option.value)}
                className={[
                  "inline-flex min-h-11 items-center gap-2 rounded border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-red bg-brand-red/10 text-brand-ink"
                    : "border-line text-muted hover:border-muted hover:text-ink",
                ].join(" ")}
              >
                {option.value === "light" ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </svg>
                ) : null}
                {option.value === "dark" ? (
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
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                  </svg>
                ) : null}
                {option.value === "system" ? (
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
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M12 16v4" />
                  </svg>
                ) : null}
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("Тема сохраняется в браузере и применяется до первой отрисовки страницы.")}
        </p>
      </fieldset>

      <fieldset>
        <legend className="label">{t("Язык интерфейса")}</legend>
        <div
          className="mt-2 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={t("Язык интерфейса")}
        >
          {LOCALES.map((code) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeLocale(code)}
                className={[
                  "inline-flex min-h-11 items-center rounded border px-4 py-2 text-sm font-semibold uppercase transition-colors",
                  active
                    ? "border-brand-red bg-brand-red/10 text-brand-ink"
                    : "border-line text-muted hover:border-muted hover:text-ink",
                ].join(" ")}
              >
                {LOCALE_SHORT[code]}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("Выбор языка сохраняется в cookie и действует во всём интерфейсе.")}
        </p>
      </fieldset>
    </div>
  );
}
