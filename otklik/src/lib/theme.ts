"use client";

/**
 * Логика темы оформления: выбор пользователя → применение к <html>.
 * Вариант «как в системе» следит за prefers-color-scheme и обновляется на лету.
 */

export type ThemeChoice = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE = "theme";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

export function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readTheme(): ThemeChoice {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeChoice(saved)) return saved;
  } catch {
    /* приватный режим */
  }
  return "system";
}

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  return choice === "system" ? systemTheme() : choice;
}

/** Применяет тему к документу. */
export function applyTheme(choice: ThemeChoice): "light" | "dark" {
  const root = document.documentElement;
  const resolved = resolveTheme(choice);
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  return resolved;
}

/** Сохраняет выбор и сразу применяет его. */
export function saveTheme(choice: ThemeChoice): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* приватный режим — выбор не запомнится */
  }
  document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
  applyTheme(choice);
}
