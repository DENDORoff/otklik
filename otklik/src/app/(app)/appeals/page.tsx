import Link from "next/link";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { listAppeals, parseFilters, type ListFilters } from "@/lib/appeals";
import { requireUser } from "@/lib/auth";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { deadlineState, formatDate } from "@/lib/format";
import { getTranslator } from "@/lib/i18n/server";

function queryString(filters: ListFilters, overrides: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    status: filters.status,
    categoryId: filters.categoryId,
    departmentId: filters.departmentId,
    type: filters.type,
    priority: filters.priority,
    q: filters.q,
    overdue: filters.overdue ? "1" : undefined,
    scope: filters.scope,
    ...overrides,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

const TABS = [
  { key: "all", label: "Все", href: (filters: ListFilters) => `/appeals${queryString(filters, { scope: undefined, overdue: undefined })}` },
  { key: "mine", label: "Мои", href: (filters: ListFilters) => `/appeals${queryString(filters, { scope: "mine", overdue: undefined })}` },
  { key: "assigned", label: "На мне", href: (filters: ListFilters) => `/appeals${queryString(filters, { scope: "assigned", overdue: undefined })}` },
  { key: "overdue", label: "Просроченные", href: (filters: ListFilters) => `/appeals${queryString(filters, { scope: undefined, overdue: "1" })}` },
] as const;

export default async function AppealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslator();
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

  const activeTab = filters.overdue ? "overdue" : filters.scope === "mine" ? "mine" : filters.scope === "assigned" ? "assigned" : "all";
  const exportHref = `/api/export/appeals${queryString(filters)}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Обращения")}</h1>
          <p className="mt-1 text-sm text-muted">
            {user.role === "admin"
              ? t("Все обращения компании")
              : user.role === "head"
                ? t("Обращения вашего отдела и личные")
                : t("Ваши обращения и назначенные на вас")}
            {" · "}{t("найдено:")} <span className="font-semibold text-ink">{appeals.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={exportHref} className="btn btn-secondary" download>
            {t("Выгрузить CSV")}
          </a>
          <Link href="/appeals/new" className="btn btn-primary">
            {t("Новое обращение")}
          </Link>
        </div>
      </div>

      <nav aria-label={t("Быстрые выборки")} className="mb-4 border-b border-line">
        <ul className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href(filters)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm transition-colors",
                    active
                      ? "border-brand-red font-semibold text-brand-ink"
                      : "border-transparent text-muted hover:border-line hover:text-ink",
                  ].join(" ")}
                >
                  {t(tab.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <details open={hasFilters} className="group mb-6 border-b border-line pb-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink">
          <span>{t("Фильтры")}{hasFilters ? t("· применены") : ""}</span>
          <span className="text-xs font-normal text-muted group-open:hidden">
            {t("Поиск, статус, категория, отдел")}
          </span>
          <span className="hidden text-xs font-normal text-muted group-open:inline">{t("Свернуть")}</span>
        </summary>

        <form method="get" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filters.scope ? <input type="hidden" name="scope" value={filters.scope} /> : null}
          {filters.overdue ? <input type="hidden" name="overdue" value="1" /> : null}

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label" htmlFor="q">
              {t("Поиск")}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              className="input"
              placeholder={t("Номер или текст обращения")}
            />
          </div>

          <div>
            <label className="label" htmlFor="status">
              {t("Статус")}
            </label>
            <select id="status" name="status" defaultValue={filters.status ?? ""} className="input">
              <option value="">{t("Все статусы")}</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="categoryId">
              {t("Категория")}
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={filters.categoryId ?? ""}
              className="input"
            >
              <option value="">{t("Все категории")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="departmentId">
              {t("Подразделение")}
            </label>
            <select
              id="departmentId"
              name="departmentId"
              defaultValue={filters.departmentId ?? ""}
              className="input"
            >
              <option value="">{t("Все подразделения")}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="type">
              {t("Тип")}
            </label>
            <select id="type" name="type" defaultValue={filters.type ?? ""} className="input">
              <option value="">{t("Все типы")}</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="priority">
              {t("Приоритет")}
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={filters.priority ?? ""}
              className="input"
            >
              <option value="">{t("Любой приоритет")}</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn btn-primary">
              {t("Применить")}
            </button>
            {hasFilters ? (
              <Link href="/appeals" className="btn btn-secondary">
                {t("Сбросить")}
              </Link>
            ) : null}
          </div>
        </form>
      </details>

      {appeals.length === 0 ? (
        <div className="border-y border-line py-16 text-center">
          <p className="text-sm font-medium text-ink">{t("Обращений не найдено")}</p>
          <p className="mt-1 text-sm text-muted">
            {hasFilters
              ? t("Измените фильтры — возможно, обращение в другом статусе или отделе.")
              : t("Создайте первое обращение: оно пройдёт маршрутизацию и получит итог.")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {hasFilters ? (
              <Link href="/appeals" className="btn btn-secondary">
                {t("Сбросить фильтры")}
              </Link>
            ) : null}
            <Link href="/appeals/new" className="btn btn-primary">
              {t("Новое обращение")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Мобильный список: без горизонтальной прокрутки. */}
          <ul className="divide-y divide-line border-y border-line md:hidden">
            {appeals.map((appeal) => {
              const state = deadlineState(appeal.deadline, appeal.status);
              return (
                <li key={appeal.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/appeals/${appeal.id}`}
                      className="font-semibold text-brand-ink hover:text-link"
                    >
                      {appeal.code}
                    </Link>
                    <StatusBadge status={appeal.status} />
                    <PriorityBadge priority={appeal.priority} />
                  </div>
                  <Link href={`/appeals/${appeal.id}`} className="mt-2 block">
                    <span className="line-clamp-2 text-sm text-ink">{appeal.text}</span>
                  </Link>
                  <p className="mt-2 text-xs text-muted">
                    {appeal.customCategory ?? appeal.category.name} ·{" "}
                    {appeal.department?.name ?? t("Неназначенные")} ·{" "}
                    {formatDate(appeal.createdAt, t.locale)}
                    {state === "overdue" ? (
                      <span className="font-semibold text-[#C00000] dark:text-[#FF9A9A]"> {t("· просрочено")}</span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Таблица для широких экранов. */}
          <div className="hidden overflow-x-auto border-y border-line md:block">
            <table className="w-full min-w-[840px] border-collapse">
              <thead className="border-b border-line bg-subtle">
                <tr>
                  <th className="th">{t("Номер")}</th>
                  <th className="th">{t("Обращение")}</th>
                  <th className="th">{t("Автор")}</th>
                  <th className="th">{t("Отдел")}</th>
                  <th className="th">{t("Статус")}</th>
                  <th className="th">{t("Приоритет")}</th>
                  <th className="th">{t("Создано")}</th>
                  <th className="th">{t("Срок")}</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => {
                  const state = deadlineState(appeal.deadline, appeal.status);
                  return (
                    <tr
                      key={appeal.id}
                      className={[
                        "border-b border-line last:border-0 transition-colors hover:bg-subtle",
                        state === "overdue" ? "bg-info" : "",
                      ].join(" ")}
                    >
                      <td className="td whitespace-nowrap font-semibold text-brand-ink">
                        <Link href={`/appeals/${appeal.id}`} className="text-brand-ink hover:text-link">
                          {appeal.code}
                        </Link>
                      </td>
                      <td className="td max-w-[360px]">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <TypeBadge type={appeal.type} />
                          <span className="text-xs text-muted">
                            {appeal.customCategory ?? appeal.category.name}
                          </span>
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
                        {formatDate(appeal.createdAt, t.locale)}
                      </td>
                      <td className="td whitespace-nowrap">
                        {appeal.deadline ? (
                          <span
                            className={state === "overdue" ? "font-semibold text-[#C00000] dark:text-[#FF9A9A]" : ""}
                          >
                            {formatDate(appeal.deadline, t.locale)}
                            {state === "overdue" ? t("· просрочено") : ""}
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
        </>
      )}
    </div>
  );
}
