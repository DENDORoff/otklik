export const STATUS_META = {
  new: { label: "Новое", color: "#1A5FB4", text: "#FFFFFF", className: "bg-[#1A5FB4] text-white" },
  review: { label: "На рассмотрении", color: "#6610F2", text: "#FFFFFF", className: "bg-[#6610F2] text-white" },
  clarification: { label: "Ожидает уточнения", color: "#FFC107", text: "#323A47", className: "bg-[#FFC107] text-[#323A47]" },
  in_work: { label: "В работе", color: "#20C997", text: "#0B3B2E", className: "bg-[#20C997] text-[#0B3B2E]" },
  implemented: { label: "Реализовано", color: "#198754", text: "#FFFFFF", className: "bg-[#198754] text-white" },
  closed: { label: "Закрыто", color: "#6C757D", text: "#FFFFFF", className: "bg-[#6C757D] text-white" },
  rejected: { label: "Отклонено", color: "#E40000", text: "#FFFFFF", className: "bg-[#E40000] text-white" },
  duplicate: { label: "Дубликат", color: "#B0B8C5", text: "#323A47", className: "bg-[#B0B8C5] text-[#323A47]" },
} as const;

export type StatusKey = keyof typeof STATUS_META;

export const PRIORITY_META = {
  high: { label: "Высокий", color: "#E40000", text: "#FFFFFF", className: "bg-[#E40000] text-white" },
  mid: { label: "Средний", color: "#FFC107", text: "#323A47", className: "bg-[#FFC107] text-[#323A47]" },
  low: { label: "Низкий", color: "#B0B8C5", text: "#323A47", className: "bg-[#B0B8C5] text-[#323A47]" },
} as const;

export type PriorityKey = keyof typeof PRIORITY_META;

export const TYPE_META = {
  problem: {
    label: "Проблема",
    color: "#EFF6FD",
    text: "#0B5CAB",
    className: "bg-[#EFF6FD] text-[#0B5CAB] dark:bg-[#14283C] dark:text-[#8FC2F5]",
  },
  proposal: {
    label: "Предложение",
    color: "#EAF7F1",
    text: "#136C4A",
    className: "bg-[#EAF7F1] text-[#136C4A] dark:bg-[#102A1D] dark:text-[#5FD3A3]",
  },
  praise: {
    label: "Положительный отзыв",
    color: "#FFF6E5",
    text: "#8A5A00",
    className: "bg-[#FFF6E5] text-[#8A5A00] dark:bg-[#33270F] dark:text-[#F0C36B]",
  },
} as const;

export type TypeKey = keyof typeof TYPE_META;

export const ROLE_META = {
  employee: { label: "Сотрудник", short: "Сотрудник" },
  head: { label: "Начальник отдела", short: "Начальник" },
  admin: { label: "Администратор", short: "Администратор" },
} as const;

export type RoleKey = keyof typeof ROLE_META;

export const SLA_DAYS: Record<PriorityKey, number> = {
  high: 3,
  mid: 7,
  low: 14,
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const TYPE_OPTIONS = Object.entries(TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const EVENT_LABELS: Record<string, string> = {
  published: "Обращение зарегистрировано",
  status_changed: "Смена статуса",
  assigned: "Назначен исполнитель",
  clarification: "Запрошено уточнение",
  redirect: "Перенаправлено в другой отдел",
  resolved: "Итог зафиксирован",
  rejected: "Мотивированный отказ",
  duplicate: "Помечено как дубликат",
  rated: "Оценка автора",
  commented: "Комментарий",
};

export function statusLabel(status: string): string {
  return STATUS_META[status as StatusKey]?.label ?? status;
}

export function priorityLabel(priority: string): string {
  return PRIORITY_META[priority as PriorityKey]?.label ?? priority;
}

export function typeLabel(type: string): string {
  return TYPE_META[type as TypeKey]?.label ?? type;
}

export function roleLabel(role: string): string {
  return ROLE_META[role as RoleKey]?.label ?? role;
}
