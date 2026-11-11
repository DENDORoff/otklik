import {
  PRIORITY_META,
  STATUS_META,
  TYPE_META,
  type PriorityKey,
  type StatusKey,
  type TypeKey,
} from "@/lib/constants";

function metaColor(status: string) {
  return STATUS_META[status as StatusKey] ?? { label: status, color: "#B0B8C5", text: "#323A47" };
}

export function StatusBadge({ status }: { status: string }) {
  const meta = metaColor(status);
  return (
    <span className="badge" style={{ backgroundColor: meta.color, color: meta.text }}>
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority as PriorityKey] ?? {
    label: priority,
    color: "#B0B8C5",
    text: "#323A47",
  };
  return (
    <span className="badge" style={{ backgroundColor: meta.color, color: meta.text }}>
      {meta.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type as TypeKey] ?? {
    label: type,
    color: "#F4F4F4",
    text: "#323A47",
  };
  return (
    <span className="badge" style={{ backgroundColor: meta.color, color: meta.text }}>
      {meta.label}
    </span>
  );
}
