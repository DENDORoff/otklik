"use client";

import Link from "next/link";
import { useT } from "@/components/i18n-provider";
import { IconAlert } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
      <div className="card w-full p-8">
          <IconAlert className="h-8 w-8 text-muted" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("Ошибка")}
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight text-brand-ink">
          {t("Что-то пошло не так")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("Действие не выполнено. Попробуйте ещё раз — данные не потеряны. Если ошибка повторяется, обновите страницу и войдите заново.")}
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted">{t("Код ошибки:")} {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            {t("Повторить")}
          </button>
          <Link href="/appeals" className="btn btn-secondary">
            {t("К обращениям")}
          </Link>
        </div>
      </div>
    </div>
  );
}
