import { en } from "./en";
import { kz } from "./kz";
import { DEFAULT_LOCALE, type Locale, type TranslationMap } from "./index";

/**
 * Полные словари. Подключаются только на сервере — в клиентский бандл
 * словари не попадают (см. client-keys.ts).
 */
export const DICTIONARIES: Record<Locale, TranslationMap> = {
  ru: {},
  en,
  kz,
};

export function dictionaryFor(locale: Locale): TranslationMap {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
