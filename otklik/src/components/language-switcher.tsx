"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, LOCALE_LABEL, LOCALE_SHORT, LOCALES, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n-provider";

/**
 * Переключатель языка RU / EN / KZ.
 * Выбор сохраняется в cookie и применяется ко всему интерфейсу через router.refresh().
 */
export function LanguageSwitcher({
  variant = "onDark",
  className = "",
}: {
  variant?: "onDark" | "onSurface";
  className?: string;
}) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const tone =
    variant === "onSurface"
      ? "border-line text-muted hover:border-muted hover:text-ink"
      : "border-white/30 text-white/80 hover:border-white/70 hover:text-white";

  return (
    <label
      className={[
        "inline-flex h-11 items-center gap-1.5 rounded border px-2 text-sm transition-colors",
        tone,
        pending ? "opacity-70" : "",
        className,
      ].join(" ")}
    >
      <span className="sr-only">{t(t("Язык интерфейса"))}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
      </svg>
      <select
        value={locale}
        onChange={(event) => choose(event.target.value as Locale)}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-sm font-medium outline-none"
        aria-label={t(t("Язык интерфейса"))}
      >
        {LOCALES.map((code) => (
          <option
            key={code}
            value={code}
            className="bg-surface text-ink"
            title={LOCALE_LABEL[code]}
          >
            {LOCALE_SHORT[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
