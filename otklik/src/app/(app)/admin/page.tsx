import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { handleDataRequest, updateRoutingRule } from "./actions";
import { Bitrix24Card } from "@/components/bitrix24-card";
import { getTranslator } from "@/lib/i18n/server";

export default async function AdminPage() {
  const t = await getTranslator();
  await requireAdmin();

  const DATA_REQUEST_STATUS: Record<string, string> = {
    new: t("Новый"),
    in_progress: t("В работе"),
    done: t("Обработан"),
    rejected: t("Отклонён"),
  };

  const DATA_REQUEST_KIND: Record<string, string> = {
    access: t("Доступ к данным"),
    delete: t("Удаление"),
    correct: t("Исправление"),
    withdraw: t("Отзыв согласия"),
  };

  const [categories, departments, users, unassigned, dataRequests, audit] = await Promise.all([
    prisma.category.findMany({
      include: {
        routingRules: {
          where: { isActive: true },
          include: { department: true },
          orderBy: { weight: "desc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      include: {
        head: true,
        _count: { select: { members: true, appeals: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      include: { department: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.appeal.findMany({
      where: { OR: [{ responsibleId: null }, { departmentId: null }] },
      include: { category: true, author: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dataRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 20 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Администрирование")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("Структура компании — записи в базе. Изменение правила маршрутизации меняет путь новых обращений без правки кода.")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Правила маршрутизации")}</h2>
            <p className="mt-1 text-xs text-muted">{t("Категория → подразделение-получатель")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-subtle">
                <tr className="border-b border-line">
                  <th className="th">{t("Категория")}</th>
                  <th className="th">{t("Направляется в")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const currentDepartmentId = category.routingRules[0]?.departmentId ?? "";
                  return (
                    <tr key={category.id} className="border-b border-line last:border-0">
                      <td className="td">
                        <div className="font-medium text-ink">{category.name}</div>
                        {category.routingRules.length === 0 ? (
                          <span className="text-xs text-[#D40000] dark:text-[#FF7A7A]">
                            {t("нет правила — очередь «Неназначенные»")}
                          </span>
                        ) : null}
                      </td>
                      <td className="td">
                        <form action={updateRoutingRule} className="flex items-center gap-2">
                          <input type="hidden" name="categoryId" value={category.id} />
                          <select
                            name="departmentId"
                            defaultValue={currentDepartmentId}
                            className="input max-w-[190px] py-1.5 text-xs"
                          >
                            <option value="">{t("Не направлять")}</option>
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-red hover:text-link"
                          >
                            {t("Сохранить")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Подразделения")}</h2>
            <p className="mt-1 text-xs text-muted">{t("Начальник отдела назначает исполнителей")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-subtle">
                <tr className="border-b border-line">
                  <th className="th">{t("Отдел")}</th>
                  <th className="th">{t("Начальник")}</th>
                  <th className="th text-right">{t("Сотрудники")}</th>
                  <th className="th text-right">{t("Обращения")}</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id} className="border-b border-line last:border-0">
                    <td className="td font-medium text-ink">{department.name}</td>
                    <td className="td text-muted">{department.head?.name ?? t("не назначен")}</td>
                    <td className="td text-right">{department._count.members}</td>
                    <td className="td text-right">{department._count.appeals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Очередь «Неназначенные»")}</h2>
            <p className="mt-1 text-xs text-muted">
              {t("Обращения без правила маршрутизации или без ответственного — не теряются")}
            </p>
          </div>
          {unassigned.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">{t("Очередь пуста — все обращения распределены.")}</p>
          ) : (
            <table className="w-full">
              <thead className="bg-subtle">
                <tr className="border-b border-line">
                  <th className="th">{t("Номер")}</th>
                  <th className="th">{t("Категория")}</th>
                  <th className="th">{t("Автор")}</th>
                  <th className="th">{t("Создано")}</th>
                </tr>
              </thead>
              <tbody>
                {unassigned.map((appeal) => (
                  <tr key={appeal.id} className="border-b border-line last:border-0">
                    <td className="td font-semibold">
                      <Link href={`/appeals/${appeal.id}`}>{appeal.code}</Link>
                    </td>
                    <td className="td">{appeal.category.name}</td>
                    <td className="td text-muted">{appeal.author.name}</td>
                    <td className="td text-muted">{formatDate(appeal.createdAt, t.locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Запросы по персональным данным")}</h2>
            <p className="mt-1 text-xs text-muted">
              {t("Доступ, исправление, удаление и отзыв согласия. Срок ответа — до 10 рабочих дней.")}
            </p>
          </div>
          {dataRequests.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              {t("Новых запросов нет. Форма для пользователей —")}{" "}
              <Link href="/data-request" className="underline underline-offset-2">
                /data-request
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {dataRequests.map((request) => (
                <li key={request.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {DATA_REQUEST_KIND[request.kind] ?? request.kind} · {request.email}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {request.name} {t("· создан")} {formatDateTime(request.createdAt, t.locale)} ·{" "}
                        {DATA_REQUEST_STATUS[request.status] ?? request.status}
                      </p>
                    </div>
                    {request.status === "done" ? null : (
                      <form action={handleDataRequest} className="flex items-center gap-2">
                        <input type="hidden" name="requestId" value={request.id} />
                        <select
                          name="status"
                          defaultValue="done"
                          className="input max-w-[150px] py-1.5 text-xs"
                        >
                          <option value="in_progress">{t("В работе")}</option>
                          <option value="done">{t("Обработан")}</option>
                          <option value="rejected">{t("Отклонён")}</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-red hover:text-link"
                        >
                          {t("Сохранить")}
                        </button>
                      </form>
                    )}
                  </div>
                  <p className="mt-2 max-w-3xl whitespace-pre-line text-sm text-muted">
                    {request.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Журнал безопасности")}</h2>
            <p className="mt-1 text-xs text-muted">
              {t("Входы, блокировки подбора пароля, действия с данными. Пароли и тексты обращений не записываются.")}
            </p>
          </div>
          {audit.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">{t("Журнал пока пуст.")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {audit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-xs"
                >
                  <span className="font-semibold text-ink">{entry.action}</span>
                  <span className="text-muted">{entry.email ?? "—"}</span>
                  <span className="text-muted">{entry.ip ?? "—"}</span>
                  <span className="text-muted">{formatDateTime(entry.createdAt, t.locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Bitrix24Card />

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand-ink">{t("Пользователи")}</h2>            <p className="mt-1 text-xs text-muted">
              {t("Демо-пароль всех учётных записей — demo1234")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-subtle">
                <tr className="border-b border-line">
                  <th className="th">{t("Сотрудник")}</th>
                  <th className="th">{t("Почта")}</th>
                  <th className="th">{t("Роль")}</th>
                  <th className="th">{t("Отдел")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0">
                    <td className="td font-medium text-ink">{user.name}</td>
                    <td className="td text-muted">{user.email}</td>
                    <td className="td">{roleLabel(user.role)}</td>
                    <td className="td text-muted">{user.department?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
