"use client";

import { useFormStatus } from "react-dom";
import { useT } from "@/components/i18n-provider";

export function SubmitButton({
  children,
  pendingText,
  className = "btn btn-primary",
  disabled = false,
  ...rest
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
} & React.ComponentPropsWithoutRef<"button">) {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
      aria-live="polite"
      {...rest}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {pendingText ?? t("Сохраняем…")}
        </>
      ) : (
        children
      )}
    </button>
  );
}
