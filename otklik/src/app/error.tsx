"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4">
      <div className="card w-full p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Ошибка
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight text-brand-ink">
          Что-то пошло не так
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Действие не выполнено. Попробуйте ещё раз — данные не потеряны. Если ошибка повторяется,
          обновите страницу и войдите заново.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-muted">Код ошибки: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            Повторить
          </button>
          <Link href="/appeals" className="btn btn-secondary">
            К обращениям
          </Link>
        </div>
      </div>
    </div>
  );
}
