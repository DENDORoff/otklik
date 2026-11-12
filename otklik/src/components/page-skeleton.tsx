export function PageSkeleton({
  rows = 6,
  withFilters = true,
}: {
  rows?: number;
  withFilters?: boolean;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем данные…</span>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="skeleton h-7 w-48" />
          <div className="skeleton mt-2 h-4 w-64" />
        </div>
        <div className="skeleton h-11 w-40" />
      </div>

      {withFilters ? (
        <div className="card mb-5 grid gap-3 p-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={index === 0 ? "md:col-span-2" : ""}>
              <div className="skeleton h-3 w-16" />
              <div className="skeleton mt-2 h-11 w-full" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="border-b border-line bg-subtle px-4 py-3">
          <div className="skeleton h-4 w-full max-w-2xl" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid gap-3 px-4 py-4 md:grid-cols-6">
              <div className="skeleton h-4 w-16" />
              <div className="md:col-span-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton mt-2 h-3 w-2/3" />
              </div>
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
