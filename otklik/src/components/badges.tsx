import {
  PRIORITY_META,
  STATUS_META,
  TYPE_META,
  type PriorityKey,
  type StatusKey,
  type TypeKey,
} from "@/lib/constants";
import { getTranslator } from "@/lib/i18n/server";

const FALLBACK = "bg-[#B0B8C5] text-[#323A47]";

export async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslator();
  const meta = STATUS_META[status as StatusKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta ? t(meta.label) : status}
    </span>
  );
}

export async function PriorityBadge({ priority }: { priority: string }) {
  const t = await getTranslator();
  const meta = PRIORITY_META[priority as PriorityKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta ? t(meta.label) : priority}
    </span>
  );
}

export async function TypeBadge({ type }: { type: string }) {
  const t = await getTranslator();
  const meta = TYPE_META[type as TypeKey];
  return (
    <span className={["badge", meta?.className ?? FALLBACK].join(" ")}>
      {meta ? t(meta.label) : type}
    </span>
  );
}
