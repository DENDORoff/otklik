import Link from "next/link";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { listAppeals, parseFilters } from "@/lib/appeals";
import { requireUser } from "@/lib/auth";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deadlineState, formatDate } from "@/lib/format";

export default async function AppealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);

  const [appeals, categories, departments] = await Promise.all([
    listAppeals(user, filters),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const hasFilters =
    Boolean(filters.status) ||
    Boolean(filters.categoryId) ||
    Boolean(filters.departmentId) ||
    Boolean(filters.type) ||
    Boolean(filters.priority) ||
    Boolean(filters.q) ||
    Boolean(filters.overdue);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-brand">Обращения</h1>
          <p className="mt-1 text-sm text-muted">
            {user.role === "admin"
              ? "Все обращения компании"
              : user.role === "head"
                ? "Обращения вашего отдела и личные"
                : "Ваши обращения и назначенные на вас"}
            {" · "}
            найдено: <span className="font-semibold text-ink">{appeals.length}</span>
          </p>
        </div>
        <Link href="/appeals/new" className="btn btn-primary">
          Новое обращение
        </Link>
      </div>

      <form method="get" className="card mb-5 grid gap-3 p-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="label" htmlFor="q">
            Поиск
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q ?? ""}
            className="input"
            placeholder="Номер или текст обращения"
          />
        </div>

        <div>
          <label className="label" htmlFor="status">
            Статус
          </label>
          <select id="status" name="status" defaultValue={filters.status ?? ""} className="input">
            <option value="">Все</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="categoryId">
            Категория
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={filters.categoryId ?? ""}
            className="input"
          >
            <option value="">Все</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="departmentId">
            Подразделение
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={filters.departmentId ?? ""}
            className="input"
          >
            <option value="">Все</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="type">
            Тип
          </label>
          <select id="type" name="type" defaultValue={filters.type ?? ""} className="input">
            <option value="">Все</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="priority">
            Приоритет
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue={filters.priority ?? ""}
            className="input"
          >
            <option value="">Все</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center pb-1 md:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="overdue"
              value="1"
              defaultChecked={filters.overdue}
              className="h-4 w-4 accent-[#ED1111]"
            />
            Только просроченные
          </label>
        </div>

        <div className="flex items-end gap-2 md:col-span-4 md:justify-end">
          <button type="submit" className="btn btn-primary">
            Применить
          </button>
          {hasFilters ? (
            <Link href="/appeals" className="btn btn-secondary">
              Сбросить
            </Link>
          ) : null}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="border-b border-line bg-[#FAFBFC]">
              <tr>
                <th className="th">Номер</th>
                <th className="th">Обращение</th>
                <th className="th">Автор</th>
                <th className="th">Отдел</th>
                <th className="th">Статус</th>
                <th className="th">Приоритет</th>
                <th className="th">Создано</th>
                <th className="th">Срок</th>
              </tr>
            </thead>
            <tbody>
              {appeals.map((appeal) => {
                const state = deadlineState(appeal.deadline, appeal.status);
                return (
                  <tr
                    key={appeal.id}
                    className={[
                      "border-b border-line last:border-0 transition-colors hover:bg-[#FAFBFC]",
                      state === "overdue" ? "bg-info" : "",
                    ].join(" ")}
                  >
                    <td className="td whitespace-nowrap font-semibold text-brand">
                      <Link href={`/appeals/${appeal.id}`} className="text-brand hover:text-link">
                        {appeal.code}
                      </Link>
                    </td>
                    <td className="td max-w-[360px]">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <TypeBadge type={appeal.type} />
                        <span className="text-xs text-muted">{appeal.category.name}</span>
                      </div>
                      <Link
                        href={`/appeals/${appeal.id}`}
                        className="line-clamp-2 text-ink hover:text-link"
                      >
                        {appeal.text}
                      </Link>
                    </td>
                    <td className="td whitespace-nowrap text-muted">{appeal.author.name}</td>
                    <td className="td whitespace-nowrap text-muted">
                      {appeal.department?.name ?? "—"}
                    </td>
                    <td className="td">
                      <StatusBadge status={appeal.status} />
                    </td>
                    <td className="td">
                      <PriorityBadge priority={appeal.priority} />
                    </td>
                    <td className="td whitespace-nowrap text-muted">
                      {formatDate(appeal.createdAt)}
                    </td>
                    <td className="td whitespace-nowrap">
                      {appeal.deadline ? (
                        <span
                          className={state === "overdue" ? "font-semibold text-[#E40000]" : ""}
                        >
                          {formatDate(appeal.deadline)}
                          {state === "overdue" ? " · просрочено" : ""}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {appeals.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-ink">Обращений не найдено</p>
            <p className="mt-1 text-sm text-muted">
              Измените фильтры или создайте первое обращение.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
