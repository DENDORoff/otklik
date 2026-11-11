import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/lib/constants";
import { createAppeal } from "./actions";

const TYPE_HINTS: Record<string, string> = {
  problem: "Что мешает работать: сбой, потеря времени, непонятный процесс.",
  proposal: "Как улучшить процесс, инструмент или коммуникацию.",
  praise: "Отметьте полезную практику, чтобы сохранить её.",
};

export default async function NewAppealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/appeals" className="text-sm text-muted hover:text-link">
          ← Все обращения
        </Link>
      </div>

      <div className="card p-6">
        <h1 className="text-[26px] font-bold leading-tight text-brand">Новое обращение</h1>
        <p className="mt-1 text-sm text-muted">
          Опишите ситуацию и, если есть, предложите решение. Номер присваивается автоматически.
        </p>

        {error ? (
          <div className="danger-block mt-4 text-sm text-[#E40000]">
            {error === "category"
              ? "Категория недоступна. Выберите другую."
              : "Заполните обязательные поля: тип, категория, описание (не менее 10 символов)."}
          </div>
        ) : null}

        <form action={createAppeal} className="mt-6 space-y-5">
          <fieldset>
            <legend className="label">Тип обращения</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {TYPE_OPTIONS.map((option, index) => (
                <label
                  key={option.value}
                  className="cursor-pointer rounded border border-line bg-white p-3 transition-colors has-[:checked]:border-brand-red has-[:checked]:bg-[#FFF5F5]"
                >
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    defaultChecked={index === 0}
                    className="mr-2 accent-[#ED1111]"
                  />
                  <span className="text-sm font-semibold text-ink">{option.label}</span>
                  <span className="mt-1 block pl-6 text-xs leading-snug text-muted">
                    {TYPE_HINTS[option.value]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="categoryId">
                Категория *
              </label>
              <select id="categoryId" name="categoryId" required className="input">
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                По категории система направит обращение в профильный отдел.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="priority">
                Приоритет
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="mid"
                className="input"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Высокий — 3 дня, средний — 7, низкий — 14 (после взятия в работу).
              </p>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="text">
              Описание *
            </label>
            <textarea
              id="text"
              name="text"
              required
              minLength={10}
              rows={5}
              className="input resize-y"
              placeholder="Что происходит, где и как часто? Что вы ожидали?"
            />
          </div>

          <div>
            <label className="label" htmlFor="proposal">
              Предложенное решение
            </label>
            <textarea
              id="proposal"
              name="proposal"
              rows={3}
              className="input resize-y"
              placeholder="Как можно исправить или улучшить ситуацию?"
            />
          </div>

          <div>
            <label className="label" htmlFor="attachment">
              Вложение (необязательно, до 5 МБ)
            </label>
            <input
              id="attachment"
              name="attachment"
              type="file"
              className="block w-full cursor-pointer rounded border border-line bg-white px-3 py-2 text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-canvas file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
            />
            <p className="mt-1 text-xs text-muted">
              Для демо используйте файл-заглушку без реальных данных компании.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <button type="submit" className="btn btn-primary">
              Опубликовать обращение
            </button>
            <Link href="/appeals" className="btn btn-secondary">
              Отмена
            </Link>
            <span className="text-xs text-muted">
              Номер вида A-XXX присвоится после публикации
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
