"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type Locale, type TranslationMap } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  labels: TranslationMap;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: "ru",
  labels: {},
  t: (key, params) => translate(undefined, key, params),
});

export function I18nProvider({
  locale,
  labels,
  children,
}: {
  locale: Locale;
  labels: TranslationMap;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      labels,
      t: (key, params) => translate(labels, key, params),
    }),
    [locale, labels],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

/** Короткий доступ к функции перевода в клиентских компонентах. */
export function useT(): (key: string, params?: Record<string, string | number>) => string {
  return useContext(I18nContext).t;
}
