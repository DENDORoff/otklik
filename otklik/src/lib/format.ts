const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value?: Date | string | null): string {
  if (!value) return "—";
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value?: Date | string | null): string {
  if (!value) return "—";
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function daysBetween(from: Date | string, to: Date | string = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  return Math.max(0, Math.round((+b - +a) / 86_400_000));
}

export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

export type DeadlineState = "none" | "ok" | "soon" | "overdue";

const ACTIVE_STATUSES = new Set(["review", "clarification", "in_work"]);

export function deadlineState(deadline?: Date | string | null, status?: string): DeadlineState {
  if (!deadline) return "none";
  if (status && !ACTIVE_STATUSES.has(status)) return "none";
  const days = Math.ceil((+new Date(deadline) - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 1) return "soon";
  return "ok";
}
