const INTL_LOCALE: Record<string, string> = {
  ru: "ru-RU",
  en: "en-GB",
  kz: "kk-KZ",
  kk: "kk-KZ",
};

export function formatDate(
  value?: Date | string | null,
  locale = "ru-RU",
): string {
  if (!value) return "—";
  return formatter(locale, false).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(
  value?: Date | string | null,
  locale = "ru-RU",
): string {
  if (!value) return "—";
  return formatter(locale, true).format(typeof value === "string" ? new Date(value) : value);
}

const cache = new Map<string, Intl.DateTimeFormat>();

export type DeadlineState = "none" | "ok" | "soon" | "overdue";

const ACTIVE_STATUSES = new Set(["review", "clarification", "in_work"]);

/** Состояние срока: просрочен / на подходе / в норме / срок не задан. */
export function deadlineState(
  deadline?: Date | string | null,
  status?: string,
): DeadlineState {
  if (!deadline) return "none";
  if (status && !ACTIVE_STATUSES.has(status)) return "none";
  const days = Math.ceil((+new Date(deadline) - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 1) return "soon";
  return "ok";
}

function formatter(locale: string, withTime: boolean): Intl.DateTimeFormat {
  const tag = INTL_LOCALE[locale] ?? locale;
  const key = `${tag}:${withTime}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(tag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
  cache.set(key, created);
  return created;
}
