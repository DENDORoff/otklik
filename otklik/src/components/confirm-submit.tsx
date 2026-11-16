"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useT } from "@/components/i18n-provider";
import { usePendingWatchdog } from "@/lib/pending-watchdog";

/**
 * Необратимое действие: сначала подтверждение в модальном окне,
 * затем отправка формы. Два варианта — «Отмена» и явное действие.
 */
export function ConfirmSubmit({
  children,
  pendingText,
  className = "btn btn-secondary w-full",
  title,
  description,
  confirmLabel,
  tone = "danger",
  disabled = false,
  stuckText,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  disabled?: boolean;
  stuckText?: string;
}) {
  const t = useT();
  const { pending } = useFormStatus();
  const { stuck, restart } = usePendingWatchdog(pending);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // Сервер не ответил — блокировку снимаем, действие можно повторить.
  const busy = pending && !stuck;
  const hint = stuck ? (stuckText ?? t("Сервер не ответил. Нажмите, чтобы повторить.")) : null;

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy || disabled}
        aria-busy={busy}
        title={hint ?? undefined}
        onClick={(event) => {
          if (stuck) restart();
          formRef.current = event.currentTarget.form;
          setOpen(true);
        }}
      >
        {busy || stuck ? (
          <span className="flex flex-col items-center gap-0.5">
            <span className="flex items-center gap-2">
              {busy ? (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              ) : null}
              {busy ? (pendingText ?? t("Выполняем…")) : children}
            </span>
            {hint ? (
              <span className="max-w-[18rem] text-[11px] font-normal normal-case tracking-normal opacity-80">
                {hint}
              </span>
            ) : null}
          </span>
        ) : (
          children
        )}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#04182A]/55 p-4 sm:items-center"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="w-full max-w-md rounded-card bg-surface p-6 shadow-xl"
          >
            <h2 id="confirm-title" className="text-lg font-bold text-brand-ink">
              {title}
            </h2>
            <p id="confirm-desc" className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOpen(false)}
              >
                {t("Отмена")}
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={tone === "danger" ? "btn btn-primary" : "btn btn-primary"}
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
