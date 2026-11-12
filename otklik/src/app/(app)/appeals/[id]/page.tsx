import Link from "next/link";
import { notFound } from "next/navigation";
import { AppealActions } from "@/components/appeal-actions";
import { ExpandableText } from "@/components/expandable-text";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";
import { getAppealForUser } from "@/lib/appeals";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageAppeal } from "@/lib/permissions";
import {
  EVENT_LABELS,
  STATUS_META,
  type StatusKey,
} from "@/lib/constants";
import { deadlineState, formatDate, formatDateTime } from "@/lib/format";

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-right text-sm text-ink">{children}</dd>
    </div>
  );
}

export default async function AppealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const appeal = await getAppealForUser(id, user);

  if (!appeal) notFound();

  const created = query.created === "1";
  const state = deadlineState(appeal.deadline, appeal.status);

  const executors =
    canManageAppeal(user, appeal) && appeal.departmentId
      ? await prisma.user.findMany({
          where: { departmentId: appeal.departmentId },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : [];

  const departments = canManageAppeal(user, appeal)
    ? await prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/appeals" className="text-muted hover:text-link">
          ← Все обращения
        </Link>
        <span className="text-line">/</span>
        <span className="font-semibold text-brand-ink">{appeal.code}</span>
        <StatusBadge status={appeal.status} />
        <TypeBadge type={appeal.type} />
        <PriorityBadge priority={appeal.priority} />
      </div>

      {created ? (
        <div className="info-block mb-5 text-sm text-ink">
          Обращение <strong>{appeal.code}</strong> зарегистрировано и направлено в{" "}
          <strong>{appeal.department?.name ?? "очередь «Неназначенные»"}</strong>. Следите за
          статусом на этой странице.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <AppealActions
            appeal={appeal}
            user={user}
            executors={executors}
            departments={departments}
          />

          <section className="card p-6">
            <h1 className="text-[22px] font-bold leading-snug text-brand-ink">
              {appeal.customCategory ?? appeal.category.name}
            </h1>
            {appeal.customCategory ? (
              <p className="mt-1 text-xs text-muted">
                Своя категория · базовая: {appeal.category.name} · направлено администратору
                для маршрутизации
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted">
              {appeal.author.name}
              {appeal.author.department ? ` · ${appeal.author.department.name}` : ""} ·{" "}
              {formatDateTime(appeal.publishedAt)}
            </p>

            <div className="mt-5">
              <h2 className="label">Описание</h2>
              <ExpandableText
                text={appeal.text}
                className="text-[15px] leading-relaxed text-ink"
              />
            </div>

            {appeal.type === "proposal" && appeal.proposal ? (
              <div className="mt-5">
                <h2 className="label">Предложенное решение</h2>
                <ExpandableText
                  text={appeal.proposal}
                  className="text-[15px] leading-relaxed text-ink"
                />
              </div>
            ) : null}

            {appeal.attachments.length > 0 ? (
              <div className="mt-5">
                <h2 className="label">Вложения</h2>
                <ul className="space-y-1 text-sm">
                  {appeal.attachments.map((file) => (
                    <li key={file.id}>
                      <span className="text-ink">{file.fileName}</span>{" "}
                      <span className="text-muted">({Math.ceil(file.size / 1024)} КБ)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {appeal.result ? (
              <div className="info-block mt-5">
                <h2 className="label">Итог рассмотрения</h2>
                <ExpandableText
                  text={appeal.result}
                  className="text-[15px] leading-relaxed text-ink"
                />
                {appeal.resolvedAt ? (
                  <p className="mt-2 text-xs text-muted">
                    Зафиксировано {formatDateTime(appeal.resolvedAt)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {appeal.status === "rejected" && appeal.rejectReason ? (
              <div className="danger-block mt-5">
                <h2 className="label">Мотивированный отказ</h2>
                <p className="text-[15px] leading-relaxed text-ink">{appeal.rejectReason}</p>
              </div>
            ) : null}

            {appeal.duplicateOf ? (
              <div className="info-block mt-5">
                <h2 className="label">Дубликат</h2>
                <p className="text-sm text-ink">
                  Обращение повторяет{" "}
                  <Link href={`/appeals/${appeal.duplicateOf.id}`} className="font-semibold">
                    {appeal.duplicateOf.code}
                  </Link>
                  . Автор подписан на обновления оригинала.
                </p>
              </div>
            ) : null}

            {appeal.duplicates.length > 0 ? (
              <div className="mt-5 text-sm text-muted">
                Дубликаты:{" "}
                {appeal.duplicates.map((dup, index) => (
                  <span key={dup.id}>
                    {index > 0 ? ", " : ""}
                    <Link href={`/appeals/${dup.id}`}>{dup.code}</Link>
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-ink">Комментарии</h2>
              <span className="text-xs text-muted">{appeal.comments.length}</span>
            </div>

            {appeal.comments.length === 0 ? (
              <p className="text-sm text-muted">Комментариев пока нет.</p>
            ) : (
              <ul className="space-y-4">
                {appeal.comments.map((comment) => (
                  <li key={comment.id} className="border-l-2 border-line pl-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-ink">{comment.author.name}</span>
                      <span>{formatDateTime(comment.createdAt)}</span>
                      {comment.isClarification ? (
                        <span className="badge bg-[#FFF6E5] text-[#8A5A00] dark:bg-[#33270F] dark:text-[#F0C36B]">
                          Запрос уточнения
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                      {comment.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-brand-ink">История</h2>
            <ol className="space-y-4">
              {appeal.history.map((event) => {
                const dot =
                  STATUS_META[event.toStatus as StatusKey]?.color ?? "#B0B8C5";
                return (
                  <li key={event.id} className="relative pl-6">
                    <span
                      className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-ink">
                        {EVENT_LABELS[event.event] ?? event.event}
                      </span>
                      {event.fromStatus && event.toStatus && event.event === "status_changed" ? (
                        <span className="text-muted">
                          {STATUS_META[event.fromStatus as StatusKey]?.label ?? event.fromStatus}
                          {" → "}
                          {STATUS_META[event.toStatus as StatusKey]?.label ?? event.toStatus}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted">{formatDateTime(event.createdAt)}</span>
                      {event.actor ? (
                        <span className="text-xs text-muted">· {event.actor.name}</span>
                      ) : null}
                    </div>
                    {event.comment ? (
                      <p className="mt-1 whitespace-pre-line text-sm text-muted">{event.comment}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-ink">
              Карточка
            </h2>
            <dl>
              <MetaRow label="Автор">{appeal.author.name}</MetaRow>
              <MetaRow label="Отдел">{appeal.department?.name ?? "Не назначен"}</MetaRow>
              <MetaRow label="Ответственный">
                {appeal.responsible?.name ?? "—"}
              </MetaRow>
              <MetaRow label="Исполнитель">{appeal.assignee?.name ?? "—"}</MetaRow>
              <MetaRow label="Приоритет">
                <PriorityBadge priority={appeal.priority} />
              </MetaRow>
              <MetaRow label="Создано">{formatDate(appeal.publishedAt)}</MetaRow>
              <MetaRow label="Первый ответ">
                {appeal.firstResponseAt ? formatDate(appeal.firstResponseAt) : "—"}
              </MetaRow>
              <MetaRow label="Срок">
                {appeal.deadline ? (
                  <span className={state === "overdue" ? "font-semibold text-[#D40000] dark:text-[#FF7A7A]" : ""}>
                    {formatDate(appeal.deadline)}
                    {state === "overdue" ? " · просрочено" : ""}
                  </span>
                ) : (
                  "—"
                )}
              </MetaRow>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-ink">
              Оценка автора
            </h2>
            {appeal.rating ? (
              <div>
                <div className="text-2xl tracking-[0.15em] text-[#ED1111]">
                  {"★".repeat(appeal.rating.score)}
                  <span className="text-line">{"★".repeat(5 - appeal.rating.score)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {appeal.rating.score} из 5 · {formatDate(appeal.rating.createdAt)}
                </p>
                {appeal.rating.comment ? (
                  <p className="mt-2 text-sm text-ink">«{appeal.rating.comment}»</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">Оценка появится после реализации.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
