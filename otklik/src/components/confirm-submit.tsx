"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Необратимое действие: сначала подтверждение в модальном окне,
 * затем отправка формы. Два варианта — «Отмена» и явное действие.
 */
export function ConfirmSubmit({
  children,
  pendingText = "Выполняем…",
  className = "btn btn-secondary w-full",
  title,
  description,
  confirmLabel,
  tone = "danger",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

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
        disabled={pending || disabled}
        aria-busy={pending}
        onClick={(event) => {
          formRef.current = event.currentTarget.form;
          setOpen(true);
        }}
      >
        {pending ? pendingText : children}
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
            className="w-full max-w-md rounded-card bg-white p-6 shadow-xl"
          >
            <h2 id="confirm-title" className="text-lg font-bold text-brand">
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
                Отмена
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
