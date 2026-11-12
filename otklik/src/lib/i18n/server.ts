import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  detectLocale,
  translator,
  type Locale,
  type TranslationMap,
  type Translator,
} from "./index";
import { dictionaryFor } from "./dictionaries";
import { CLIENT_KEYS } from "./client-keys";

/**
 * Язык на сервере: сохранённый выбор в cookie, иначе Accept-Language.
 * Чтение cookie делает маршрут динамическим — это осознанно: текст должен
 * прийти в правильной локали без «мигания» после гидрации.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const saved = store.get(LOCALE_COOKIE)?.value;
  if (saved) return detectLocale(saved);

  try {
    const requestHeaders = await headers();
    return detectLocale(null, requestHeaders.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Функция перевода для серверных компонентов. */
export async function getTranslator(): Promise<Translator> {
  const locale = await getLocale();
  return translator(locale, dictionaryFor(locale));
}

/**
 * Выборка строк для клиентских компонентов: полный словарь в бандл не идёт,
 * клиент получает только то, что реально используется в браузере.
 */
export async function getClientLabels(): Promise<TranslationMap> {
  const locale = await getLocale();
  const dictionary = dictionaryFor(locale);
  const labels: TranslationMap = {};
  for (const key of CLIENT_KEYS) {
    const value = dictionary[key];
    if (value) labels[key] = value;
  }
  return labels;
}

export type { Locale };
