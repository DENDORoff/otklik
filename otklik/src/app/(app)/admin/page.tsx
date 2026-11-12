import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { handleDataRequest, updateRoutingRule } from "./actions";

const DATA_REQUEST_STATUS: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  done: "Обработан",
  rejected: "Отклонён",
};

const DATA_REQUEST_KIND: Record<string, string> = {
  access: "Доступ к данным",
  delete: "Удаление",
  correct: "Исправление",
  withdraw: "Отзыв согласия",
};

export default async function AdminPage() {
  await requireAdmin();

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
        <h1 className="text-[26px] font-bold leading-tight text-brand">Администрирование</h1>
        <p className="mt-1 text-sm text-muted">
          Структура компании — записи в базе. Изменение правила маршрутизации меняет путь новых
          обращений без правки кода.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand">Правила маршрутизации</h2>
            <p className="mt-1 text-xs text-muted">Категория → подразделение-получатель</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-[#FAFBFC]">
                <tr className="border-b border-line">
                  <th className="th">Категория</th>
                  <th className="th">Направляется в</th>
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
                          <span className="text-xs text-[#E40000]">
                            нет правила — очередь «Неназначенные»
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
                            <option value="">Не направлять</option>
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
                            Сохранить
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
            <h2 className="text-lg font-bold text-brand">Подразделения</h2>
            <p className="mt-1 text-xs text-muted">Начальник отдела назначает исполнителей</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-[#FAFBFC]">
                <tr className="border-b border-line">
                  <th className="th">Отдел</th>
                  <th className="th">Начальник</th>
                  <th className="th text-right">Сотрудники</th>
                  <th className="th text-right">Обращения</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.id} className="border-b border-line last:border-0">
                    <td className="td font-medium text-ink">{department.name}</td>
                    <td className="td text-muted">{department.head?.name ?? "не назначен"}</td>
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
            <h2 className="text-lg font-bold text-brand">Очередь «Неназначенные»</h2>
            <p className="mt-1 text-xs text-muted">
              Обращения без правила маршрутизации или без ответственного — не теряются
            </p>
          </div>
          {unassigned.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">Очередь пуста — все обращения распределены.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-[#FAFBFC]">
                <tr className="border-b border-line">
                  <th className="th">Номер</th>
                  <th className="th">Категория</th>
                  <th className="th">Автор</th>
                  <th className="th">Создано</th>
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
                    <td className="td text-muted">{formatDate(appeal.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand">Запросы по персональным данным</h2>
            <p className="mt-1 text-xs text-muted">
              Доступ, исправление, удаление и отзыв согласия. Срок ответа — до 10 рабочих дней.
            </p>
          </div>
          {dataRequests.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              Новых запросов нет. Форма для пользователей —{" "}
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
                        {request.name} · создан {formatDateTime(request.createdAt)} ·{" "}
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
                          <option value="in_progress">В работе</option>
                          <option value="done">Обработан</option>
                          <option value="rejected">Отклонён</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-red hover:text-link"
                        >
                          Сохранить
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
            <h2 className="text-lg font-bold text-brand">Журнал безопасности</h2>
            <p className="mt-1 text-xs text-muted">
              Входы, блокировки подбора пароля, действия с данными. Пароли и тексты обращений
              не записываются.
            </p>
          </div>
          {audit.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">Журнал пока пуст.</p>
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
                  <span className="text-muted">{formatDateTime(entry.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold text-brand">Пользователи</h2>
            <p className="mt-1 text-xs text-muted">
              Демо-пароль всех учётных записей — demo1234
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-[#FAFBFC]">
                <tr className="border-b border-line">
                  <th className="th">Сотрудник</th>
                  <th className="th">Почта</th>
                  <th className="th">Роль</th>
                  <th className="th">Отдел</th>
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
