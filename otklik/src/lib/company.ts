/**
 * Реквизиты и контакты для юридических страниц.
 *
 * ВАЖНО: это демонстрационный стенд хакатона. Реальные регистрационные данные
 * компании в репозиторий не добавляются — используются явно помеченные
 * демонстрационные реквизиты. Перед промышленной эксплуатацией значения
 * заменяет оператор.
 */
export const COMPANY = {
  product: "«Отклик»",
  legalName: "ТОО «Модус Трейд» (демонстрационный стенд)",
  brand: "ГК «Модус Трейд»",
  bin: "000000000000 (демонстрационные реквизиты)",
  address: "Республика Казахстан, г. Алматы (демонстрационный адрес)",
  privacyEmail: "privacy@otklik.local",
  supportEmail: "support@otklik.local",
  phone: "+7 (000) 000-00-00 (демо)",
  site: "https://github.com/DENDORoff/otklik",
  updatedAt: "12.11.2026",
  consentVersion: "1.0",
} as const;

export const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Политика конфиденциальности" },
  { href: "/legal/consent", label: "Согласие на обработку данных" },
  { href: "/legal/terms", label: "Условия использования" },
  { href: "/legal/cookies", label: "Файлы cookie" },
  { href: "/legal/refund", label: "Возврат средств" },
  { href: "/legal/licenses", label: "Лицензии" },
  { href: "/data-request", label: "Удаление данных" },
] as const;
