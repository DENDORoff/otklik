import type { CurrentUser } from "@/lib/auth";
import type { AppealDetail } from "@/lib/appeals";
import { SLA_DAYS, type PriorityKey } from "@/lib/constants";
import { canManageAppeal, isAssignee, isAuthor } from "@/lib/permissions";
import {
  acceptAppeal,
  assignAppeal,
  markDuplicate,
  rateAppeal,
  redirectDepartment,
  rejectAppeal,
  replyClarification,
  requestClarification,
  resolveAppeal,
  returnToHead,
} from "@/app/(app)/appeals/[id]/actions";

const DAY = 86_400_000;

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function ActionBox({
  title,
  tone = "default",
  children,
}: {
  title: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded border border-line">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-ink hover:bg-[#FAFBFC]">
        <span className={tone === "danger" ? "text-[#E40000]" : ""}>{title}</span>
      </summary>
      <div className="space-y-2 border-t border-line p-3">{children}</div>
    </details>
  );
}

export function AppealActions({
  appeal,
  user,
  executors,
  departments,
}: {
  appeal: AppealDetail;
  user: CurrentUser;
  executors: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const manage = canManageAppeal(user, appeal);
  const author = isAuthor(user, appeal);
  const assignee = isAssignee(user, appeal);
  const slaDays = SLA_DAYS[appeal.priority as PriorityKey] ?? 7;

  const blocks: React.ReactNode[] = [];

  if (manage && appeal.status === "new") {
    blocks.push(
      <form key="accept" action={acceptAppeal}>
        <input type="hidden" name="appealId" value={appeal.id} />
        <button type="submit" className="btn btn-primary w-full">
          Принять в рассмотрение
        </button>
        <p className="mt-2 text-xs text-muted">
          Автор получит уведомление, обращение перейдёт в статус «На рассмотрении».
        </p>
      </form>,
    );
  }

  if (manage && appeal.status === "review") {
    blocks.push(
      <ActionBox key="assign" title="Назначить исполнителя и срок">
        <form action={assignAppeal} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <div>
            <label className="label" htmlFor={`assignee-${appeal.id}`}>
              Исполнитель
            </label>
            <select id={`assignee-${appeal.id}`} name="assigneeId" required className="input">
              <option value="">Выберите сотрудника отдела</option>
              {executors.map((executor) => (
                <option key={executor.id} value={executor.id}>
                  {executor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`deadline-${appeal.id}`}>
              Срок (по умолчанию +{slaDays} дн. по приоритету)
            </label>
            <input
              id={`deadline-${appeal.id}`}
              type="date"
              name="deadline"
              defaultValue={isoDate(new Date(Date.now() + slaDays * DAY))}
              className="input"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Взять в работу
          </button>
        </form>
      </ActionBox>,
    );

    blocks.push(
      <ActionBox key="clarify" title="Запросить уточнение у автора">
        <form action={requestClarification} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <textarea
            name="comment"
            required
            minLength={5}
            rows={3}
            className="input resize-y"
            placeholder="Какой информации не хватает?"
          />
          <button type="submit" className="btn btn-secondary w-full">
            Отправить запрос
          </button>
        </form>
      </ActionBox>,
    );

    blocks.push(
      <ActionBox key="reject" title="Отклонить с мотивированным отказом" tone="danger">
        <form action={rejectAppeal} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <textarea
            name="reason"
            required
            minLength={5}
            rows={3}
            className="input resize-y"
            placeholder="Причина отказа, которую увидит автор"
          />
          <button type="submit" className="btn btn-secondary w-full">
            Отклонить обращение
          </button>
        </form>
      </ActionBox>,
    );
    blocks.push(
      <ActionBox key="redirect" title="Перенаправить в другой отдел">
        <form action={redirectDepartment} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <select name="departmentId" required className="input" defaultValue="">
            <option value="">Выберите подразделение</option>
            {departments
              .filter((department) => department.id !== appeal.departmentId)
              .map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
          </select>
          <textarea
            name="comment"
            rows={2}
            className="input resize-y"
            placeholder="Комментарий для нового отдела (необязательно)"
          />
          <button type="submit" className="btn btn-secondary w-full">
            Передать обращение
          </button>
          <p className="text-xs text-muted">
            Лимит — 3 перехода между отделами, дальше эскалация администратору.
          </p>
        </form>
      </ActionBox>,
    );

    blocks.push(
      <ActionBox key="duplicate" title="Пометить дубликатом" tone="danger">
        <form action={markDuplicate} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <input
            name="duplicateCode"
            required
            className="input"
            placeholder="Номер оригинала, например A-004"
          />
          <button type="submit" className="btn btn-secondary w-full">
            Пометить дубликатом
          </button>
          <p className="text-xs text-muted">
            Автор получит уведомление и подпишется на обновления оригинала.
          </p>
        </form>
      </ActionBox>,
    );
  }

  if ((assignee || user.role === "admin") && appeal.status === "in_work") {
    blocks.push(
      <ActionBox key="resolve" title="Зафиксировать итог и завершить">
        <form action={resolveAppeal} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <textarea
            name="result"
            required
            minLength={5}
            rows={3}
            className="input resize-y"
            placeholder="Что сделано и какой результат достигнут?"
          />
          <button type="submit" className="btn btn-primary w-full">
            Отметить выполненным
          </button>
        </form>
      </ActionBox>,
    );

    if (assignee) {
      blocks.push(
        <ActionBox key="return" title="Вернуть начальнику">
          <form action={returnToHead} className="space-y-2">
            <input type="hidden" name="appealId" value={appeal.id} />
            <textarea
              name="comment"
              required
              minLength={5}
              rows={3}
              className="input resize-y"
              placeholder="Почему не хватает данных для выполнения?"
            />
            <button type="submit" className="btn btn-secondary w-full">
              Вернуть с комментарием
            </button>
          </form>
        </ActionBox>,
      );
    }
  }

  if (author && appeal.status === "clarification") {
    blocks.push(
      <div key="reply">
        <p className="mb-2 text-sm text-ink">
          Начальник отдела запросил уточнение — ответьте, чтобы вернуть обращение в рассмотрение.
        </p>
        <form action={replyClarification} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <textarea
            name="reply"
            required
            minLength={3}
            rows={3}
            className="input resize-y"
            placeholder="Ваш ответ"
          />
          <button type="submit" className="btn btn-primary w-full">
            Отправить ответ
          </button>
        </form>
      </div>,
    );
  }

  if (author && appeal.status === "implemented") {
    blocks.push(
      <div key="rate">
        <p className="mb-2 text-sm text-ink">
          Итог зафиксирован. Оцените результат — обращение закроется.
        </p>
        <form action={rateAppeal} className="space-y-2">
          <input type="hidden" name="appealId" value={appeal.id} />
          <select name="score" className="input" defaultValue="5">
            <option value="5">5 — отлично</option>
            <option value="4">4 — хорошо</option>
            <option value="3">3 — нормально</option>
            <option value="2">2 — слабо</option>
            <option value="1">1 — плохо</option>
          </select>
          <button type="submit" className="btn btn-primary w-full">
            Оценить и закрыть
          </button>
        </form>
      </div>,
    );
  }

  if (blocks.length === 0) return null;

  return (
    <section className="card p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">Действия</h2>
      <div className="space-y-3">{blocks}</div>
      {manage ? (
        <p className="mt-3 text-xs text-muted">
          Доступно начальнику отдела-получателя и администратору.
        </p>
      ) : null}
    </section>
  );
}
