"use client";

import { useFormStatus } from "react-dom";
import { useT } from "@/components/i18n-provider";
import { usePendingWatchdog } from "@/lib/pending-watchdog";

export function SubmitButton({
  children,
  pendingText,
  stuckText,
  className = "btn btn-primary",
  disabled = false,
  stuckAfterMs,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  pendingText?: string;
  stuckText?: string;
  className?: string;
  disabled?: boolean;
  stuckAfterMs?: number;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
} & Omit<React.ComponentPropsWithoutRef<"button">, "onClick">) {
  const t = useT();
  const { pending } = useFormStatus();
  const { stuck, restart } = usePendingWatchdog(pending, { stuckAfterMs });

  // Сервер не ответил: блокировку снимаем, действие можно повторить.
  const busy = pending && !stuck;
  const hint = stuck ? (stuckText ?? t("Сервер не ответил. Нажмите, чтобы повторить.")) : null;

  return (
    <button
      type="submit"
      className={className}
      disabled={busy || disabled}
      aria-busy={busy}
      title={hint ?? undefined}
      onClick={(event) => {
        if (stuck) restart();
        onClick?.(event);
      }}
      {...rest}
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
            {busy ? (pendingText ?? t("Сохраняем…")) : children}
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
  );
}
