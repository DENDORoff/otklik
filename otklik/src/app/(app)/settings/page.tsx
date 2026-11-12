import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { roleLabel } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { unsubscribeAll, updateNotificationSettings } from "./actions";

export const metadata: Metadata = {
  title: "Настройки профиля и уведомлений",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const saved = typeof params.saved === "string" ? params.saved : "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold leading-tight text-brand-ink">Настройки</h1>
        <p className="mt-1 text-sm text-muted">
          Управляйте уведомлениями и данными. Обязательные сообщения о ваших обращениях
          остаются в системе.
        </p>
      </div>

      {saved ? (
        <p
          role="status"
          className="mb-6 border-l-4 border-[#198754] bg-[#F1F8F4] px-4 py-3 text-sm text-ink dark:border-[#3FBF7F] dark:bg-[#102A1D]"
        >
          {saved === "unsubscribed"
            ? "Необязательные уведомления отключены. Сервисные сообщения о ваших обращениях останутся."
            : "Настройки уведомлений сохранены."}
        </p>
      ) : null}

      <section className="card p-6">
        <h2 className="text-base font-bold text-brand-ink">Профиль</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="label">Имя</dt>
            <dd className="text-ink">{user.name}</dd>
          </div>
          <div>
            <dt className="label">Рабочая почта</dt>
            <dd className="text-ink">{user.email}</dd>
          </div>
          <div>
            <dt className="label">Роль</dt>
            <dd className="text-ink">{roleLabel(user.role)}</dd>
          </div>
          <div>
            <dt className="label">Подразделение</dt>
            <dd className="text-ink">{user.department?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="label">Согласие</dt>
            <dd className="text-ink">
              {user.consentVersion ? `Версия ${user.consentVersion}` : "Не зафиксировано"}
              {user.consentAt ? ` · ${formatDateTime(user.consentAt)}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Данные профиля меняет администратор. Чтобы исправить или удалить сведения, отправьте{" "}
          <Link href="/data-request" className="underline underline-offset-2">
            запрос на обработку данных
          </Link>
          .
        </p>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-base font-bold text-brand-ink">Уведомления</h2>
        <p className="mt-1 text-sm text-muted">
          Внутрисистемные уведомления показываются в разделе «Уведомления». Почтовые на стенде
          имитируются и не отправляются.
        </p>

        <form action={updateNotificationSettings} className="mt-5 space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded border border-line p-4 text-sm text-ink">
            <input
              type="checkbox"
              name="notifyInApp"
              defaultChecked={user.notifyInApp}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED1111]"
            />
            <span>
              <span className="block font-semibold">Внутрисистемные уведомления</span>
              <span className="mt-0.5 block text-xs text-muted">
                Статусы, назначения, уточнения и оценки по вашим обращениям.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded border border-line p-4 text-sm text-ink">
            <input
              type="checkbox"
              name="notifyEmail"
              defaultChecked={user.notifyEmail}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED1111]"
            />
            <span>
              <span className="block font-semibold">Почтовые уведомления</span>
              <span className="mt-0.5 block text-xs text-muted">
                Необязательные письма о новостях и напоминаниях. На демо-стенде имитируются.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-primary">
              Сохранить настройки
            </button>
            <span className="text-xs text-muted">Изменения применяются сразу</span>
          </div>
        </form>
      </section>

      <section className="card mt-6 p-6">
        <h2 className="text-base font-bold text-brand-ink">Отписка и данные</h2>
        <p className="mt-1 text-sm text-muted">
          Отписаться можно одной кнопкой. Обязательные сервисные сообщения о ваших обращениях
          остаются доступными в системе — они нужны для работы процесса.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={unsubscribeAll}>
            <button type="submit" className="btn btn-secondary">
              Отписаться от необязательных уведомлений
            </button>
          </form>
          <Link href="/data-request" className="btn btn-secondary">
            Запросить удаление данных
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          Вопросы по данным:{" "}
          <a href={`mailto:${COMPANY.privacyEmail}`} className="underline underline-offset-2">
            {COMPANY.privacyEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
