import {
  PRIORITY_META,
  STATUS_META,
  TYPE_META,
  type PriorityKey,
  type StatusKey,
  type TypeKey,
} from "@/lib/constants";

const FALLBACK = "bg-[#B0B8C5] text-[#323A47]";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta?.label ?? status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority as PriorityKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta?.label ?? priority}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type as TypeKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta?.label ?? type}
    </span>
  );
}
