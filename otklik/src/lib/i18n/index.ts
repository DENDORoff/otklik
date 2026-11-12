/**
 * Локализация интерфейса: RU (по умолчанию), EN, KZ.
 *
 * Ключ перевода — исходная русская строка. Так словарь остаётся единственным
 * источником правды: при переносе строки в словарь ключ меняется автоматически,
 * а если ключ забыт — интерфейс молча остаётся на русском, а не ломается.
 *
 * Плейсхолдеры вида {n} подставляются из аргументов translate().
 *
 * Модуль не импортирует словари: он одинаково работает на сервере (полный
 * словарь) и в браузере (только выборка строк клиентских компонентов).
 */

export const LOCALES = ["ru", "en", "kz"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_LABEL: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  kz: "Қазақша",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  kz: "KZ",
};

export const LOCALE_COOKIE = "otklik_locale";

export type TranslationMap = Record<string, string>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Определение языка: сохранённый выбор → заголовок Accept-Language → русский.
 */
export function detectLocale(
  cookieValue?: string | null,
  acceptLanguage?: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;

  if (acceptLanguage) {
    const ranked = acceptLanguage
      .split(",")
      .map((part) => {
        const [tag, q] = part.trim().split(";q=");
        return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
      })
      .filter((item) => item.tag)
      .sort((a, b) => b.q - a.q);

    for (const item of ranked) {
      const base = item.tag.split("-")[0];
      if (isLocale(base)) return base;
      // Казахский в разных вариантах написания.
      if (base === "kk") return "kz";
    }
  }

  return DEFAULT_LOCALE;
}

/** Подстановка плейсхолдеров {name}. */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Перевод по словарю. Если ключа нет — возвращается исходная строка
 * (русский текст), интерфейс не ломается.
 */
export function translate(
  map: TranslationMap | undefined,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value = map?.[key];
  return interpolate(value ?? key, params);
}

export type Translator = ((key: string, params?: Record<string, string | number>) => string) & {
  locale: Locale;
};

export function translator(locale: Locale, map: TranslationMap): Translator {
  const t = ((key: string, params?: Record<string, string | number>) =>
    translate(map, key, params)) as Translator;
  t.locale = locale;
  return t;
}
