"use client";

import { useState } from "react";
import { useT } from "@/components/i18n-provider";

export function ExpandableText({
  text,
  limit = 420,
  className = "",
}: {
  text: string;
  limit?: number;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const long = text.length > limit;

  if (!long) {
    return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
  }

  return (
    <div>
      <p className={`whitespace-pre-line ${className}`}>
        {open ? text : `${text.slice(0, limit).trimEnd()}…`}
      </p>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline"
      >
        {open ? t("Свернуть") : t("Читать далее")}
      </button>
    </div>
  );
}
