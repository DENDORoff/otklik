import { StatusBadge } from "@/components/badges";
import { visibleWhere } from "@/lib/appeals";
import { requireUser } from "@/lib/auth";
import { STATUS_META, TYPE_META } from "@/lib/constants";
import { prisma } from "@/lib/db";

const DAY = 86_400_000;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 text-3xl font-bold leading-none text-brand">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const where = visibleWhere(user);

  const [total, byStatus, byType, byCategory, appeals, categories] = await Promise.all([
    prisma.appeal.count({ where }),
    prisma.appeal.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.appeal.groupBy({ by: ["type"], where, _count: { _all: true } }),
    prisma.appeal.groupBy({ by: ["categoryId"], where, _count: { _all: true } }),
    prisma.appeal.findMany({
      where,
      select: {
        status: true,
        firstResponseAt: true,
        publishedAt: true,
        resolvedAt: true,
        deadline: true,
        rating: { select: { score: true } },
      },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const group of byStatus) statusCounts[group.status] = group._count._all;

  const reviewCount = total - (statusCounts.new ?? 0);
  const withResult = (statusCounts.implemented ?? 0) + (statusCounts.closed ?? 0);
  const duplicateCount = statusCounts.duplicate ?? 0;

  const firstResponseDays = appeals
    .filter((appeal) => appeal.firstResponseAt)
    .map((appeal) => (+appeal.firstResponseAt! - +appeal.publishedAt) / DAY);

  const resolutionDays = appeals
    .filter((appeal) => appeal.resolvedAt)
    .map((appeal) => (+appeal.resolvedAt! - +appeal.publishedAt) / DAY);

  const scores = appeals
    .map((appeal) => appeal.rating?.score)
    .filter((score): score is number => typeof score === "number");

  const overdueCount = appeals.filter(
    (appeal) =>
      appeal.deadline &&
      ["review", "clarification", "in_work"].includes(appeal.status) &&
      +appeal.deadline < Date.now(),
  ).length;

  const avgFirstResponse = average(firstResponseDays);
  const avgResolution = average(resolutionDays);
  const avgScore = average(scores);

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const categoryRows = [...byCategory]
    .map((group) => ({
      name: categoryNames.get(group.categoryId) ?? "—",
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const duplicateCategories = new Map<string, number>();
  const duplicates = await prisma.appeal.findMany({
    where: { AND: [where, { status: "duplicate" }] },
    select: { category: { select: { name: true } } },
  });
  for (const dup of duplicates) {
    const name = dup.category.name;
    duplicateCategories.set(name, (duplicateCategories.get(name) ?? 0) + 1);
  }
  const topDuplicates = [...duplicateCategories.entries()].sort((a, b) => b[1] - a[1]);

  const maxCategory = Math.max(1, ...categoryRows.map((row) => row.count));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold leading-tight text-brand">Аналитика</h1>
        <p className="mt-1 text-sm text-muted">
          {user.role === "admin"
            ? "Сводка по всем обращениям компании"
            : user.role === "head"
              ? "Сводка по вашему отделу и личным обращениям"
              : "Обезличенные агрегаты и ваши обращения"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Всего обращений" value={String(total)} hint="за всё время" />
        <Metric
          label="Доля рассмотренных"
          value={total ? `${Math.round((reviewCount / total) * 100)}%` : "—"}
          hint={`${reviewCount} из ${total} вышли из статуса «Новое»`}
        />
        <Metric
          label="Доля с результатом"
          value={total ? `${Math.round((withResult / total) * 100)}%` : "—"}
          hint={`${withResult} реализовано или закрыто`}
        />
        <Metric
          label="Время первого ответа"
          value={avgFirstResponse == null ? "—" : `${avgFirstResponse.toFixed(1)} дн.`}
          hint="среднее от публикации до первого действия"
        />
        <Metric
          label="Среднее время решения"
          value={avgResolution == null ? "—" : `${avgResolution.toFixed(1)} дн.`}
          hint="для реализованных обращений"
        />
        <Metric
          label="Удовлетворённость"
          value={avgScore == null ? "—" : `${avgScore.toFixed(1)} / 5`}
          hint={`${scores.length} оценок авторов`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Просроченные
          </div>
          <div className="mt-2 text-3xl font-bold leading-none text-[#E40000]">{overdueCount}</div>
          <div className="mt-2 text-xs text-muted">дедлайн прошёл, обращение ещё в работе</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Дубликаты
          </div>
          <div className="mt-2 text-3xl font-bold leading-none text-brand">{duplicateCount}</div>
          <div className="mt-2 text-xs text-muted">повторяющиеся обращения</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            В работе сейчас
          </div>
          <div className="mt-2 text-3xl font-bold leading-none text-brand">
            {(statusCounts.in_work ?? 0) + (statusCounts.review ?? 0)}
          </div>
          <div className="mt-2 text-xs text-muted">в рассмотрении и работе</div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-brand">По типам</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="th">Тип</th>
                <th className="th text-right">Количество</th>
                <th className="th text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((group) => (
                <tr key={group.type} className="border-b border-line last:border-0">
                  <td className="td">
                    {TYPE_META[group.type as keyof typeof TYPE_META]?.label ?? group.type}
                  </td>
                  <td className="td text-right font-semibold">{group._count._all}</td>
                  <td className="td text-right text-muted">
                    {total ? Math.round((group._count._all / total) * 100) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-brand">По статусам</h2>
          <ul className="space-y-2">
            {Object.entries(STATUS_META).map(([status, meta]) => {
              const count = statusCounts[status] ?? 0;
              return (
                <li key={status} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <StatusBadge status={status} />
                  </span>
                  <span className="font-semibold text-ink">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-brand">По категориям</h2>
          <ul className="space-y-3">
            {categoryRows.map((row) => (
              <li key={row.name}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{row.name}</span>
                  <span className="font-semibold text-ink">{row.count}</span>
                </div>
                <div className="h-1.5 rounded bg-canvas">
                  <div
                    className="h-1.5 rounded bg-brand-red"
                    style={{ width: `${Math.max(4, (row.count / maxCategory) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-brand">Повторяющиеся проблемы</h2>
          {topDuplicates.length === 0 ? (
            <p className="text-sm text-muted">Дубликатов пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {topDuplicates.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{name}</span>
                  <span className="badge bg-[#F4F4F4] text-ink">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
