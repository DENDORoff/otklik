"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/lib/constants";

type Category = { id: string; name: string };
type Similar = {
  id: string;
  code: string;
  category: string;
  status: string;
  excerpt: string;
};

const TYPE_HINTS: Record<string, string> = {
  problem: "Что мешает работать: сбой, потеря времени, непонятный процесс.",
  proposal: "Как улучшить процесс, инструмент или коммуникацию.",
  praise: "Отметьте полезную практику, чтобы сохранить её.",
};

const STEPS = ["Тип и категория", "Описание", "Срок и отправка"];

function SimilarList({ text }: { text: string }) {
  const [items, setItems] = useState<Similar[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = text.trim();
    if (query.length < 12) {
      setItems(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/similar?q=${encodeURIComponent(query.slice(0, 300))}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("request failed");
        const data = (await response.json()) as { items: Similar[] };
        setItems(data.items ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setItems([]);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [text]);

  if (loading) {
    return (
      <div className="mt-3 rounded border border-line bg-canvas p-3" aria-live="polite">
        <p className="text-xs font-semibold text-muted">Ищем похожие обращения…</p>
        <div className="skeleton mt-2 h-3 w-3/4" />
        <div className="skeleton mt-2 h-3 w-1/2" />
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-3 rounded border border-[#FFE1A8] bg-[#FFF9ED] p-3 dark:border-[#5A4518] dark:bg-[#33270F]" aria-live="polite">
      <p className="text-xs font-semibold text-[#8A5A00] dark:text-[#F0C36B]">
        Похожие обращения уже есть — возможно, ваше повторяет одно из них
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-xs text-ink">
            <Link
              href={`/appeals/${item.id}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              {item.code}
            </Link>{" "}
            <span className="text-muted">
              · {item.category} · {item.excerpt}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">
        Если ваше обращение отличается — продолжайте. Дубликат начальник отдела сможет связать
        с оригиналом.
      </p>
    </div>
  );
}

function SubmitArea({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary"
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Публикуем обращение…
        </>
      ) : (
        "Опубликовать обращение"
      )}
    </button>
  );
}

export function NewAppealForm({
  categories,
  error,
  action,
}: {
  categories: Category[];
  error: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState("problem");
  const [categoryId, setCategoryId] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [priority, setPriority] = useState("mid");
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState("");
  const [consent, setConsent] = useState(false);
  const [fileError, setFileError] = useState("");
  const [stepError, setStepError] = useState("");
  const topRef = useRef<HTMLDivElement | null>(null);

  const isOther = categoryId === "__other__";
  const progress = useMemo(() => `${((step + 1) / STEPS.length) * 100}%`, [step]);

  function goTo(next: number) {
    setStepError("");
    if (next > step) {
      if (step === 0) {
        if (!categoryId) {
          setStepError("Выберите категорию — по ней обращение попадёт в нужный отдел.");
          return;
        }
        if (isOther && customCategory.trim().length < 3) {
          setStepError("Опишите свою категорию: минимум 3 символа.");
          return;
        }
      }
      if (step === 1 && text.trim().length < 10) {
        setStepError("Добавьте описание: минимум 10 символов, чтобы было понятно, что произошло.");
        return;
      }
    }
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Файл больше 5 МБ. Выберите файл меньше или сожмите его.");
      event.target.value = "";
    }
  }

  const errorText =
    error === "category"
      ? "Категория недоступна. Вернитесь на шаг 1 и выберите другую."
      : error === "file"
        ? "Вложение не принято: проверьте формат и размер до 5 МБ."
        : error === "rate"
          ? "Слишком много обращений подряд. Подождите несколько минут."
          : error
            ? "Проверьте обязательные поля: тип, категория, описание не короче 10 символов и согласие."
            : "";

  return (
    <div ref={topRef} className="scroll-mt-24">
      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Этапы формы">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={
              index === step
                ? "font-semibold text-brand-ink"
                : index < step
                  ? "text-[#136C4A] dark:text-[#5FD3A3]"
                  : "text-muted"
            }
            aria-current={index === step ? "step" : undefined}
          >
            {index < step ? "✓ " : `${index + 1}. `}
            {label}
          </li>
        ))}
      </ol>
      <div
        className="mt-3 h-1.5 w-full rounded bg-subtle"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-label={`Шаг ${step + 1} из ${STEPS.length}`}
      >
        <div
          className="h-1.5 rounded bg-brand-red transition-[width] duration-300"
          style={{ width: progress }}
        />
      </div>

      {errorText ? (
        <div className="danger-block mt-4 text-sm text-[#C00000] dark:text-[#FF9A9A]" role="alert">
          {errorText}
        </div>
      ) : null}
      {stepError ? (
        <div className="danger-block mt-4 text-sm text-[#C00000] dark:text-[#FF9A9A]" role="alert">
          {stepError}
        </div>
      ) : null}

      <form action={action} className="mt-6">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="customCategory" value={customCategory} />
        <input type="hidden" name="priority" value={priority} />
        <input type="hidden" name="text" value={text} />
        <input type="hidden" name="proposal" value={proposal} />
        <input type="hidden" name="consent" value={consent ? "on" : ""} />

        {step === 0 ? (
          <div className="space-y-5">
            <fieldset>
              <legend className="label">Тип обращения *</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="cursor-pointer rounded border border-line bg-surface p-3 transition-colors has-[:checked]:border-brand-red has-[:checked]:bg-[#FFF5F5] dark:has-[:checked]:bg-[#2B1A1F]"
                  >
                    <input
                      type="radio"
                      name="type-choice"
                      value={option.value}
                      checked={type === option.value}
                      onChange={() => setType(option.value)}
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

            <div>
              <label className="label" htmlFor="category">
                Категория *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="input"
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="__other__">Другое — своей формулировкой</option>
              </select>
              <p className="mt-1 text-xs text-muted">
                По категории система направит обращение в профильный отдел.
              </p>
            </div>

            {isOther ? (
              <div>
                <label className="label" htmlFor="customCategory">
                  Своя категория *
                </label>
                <input
                  id="customCategory"
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  maxLength={120}
                  className="input"
                  placeholder="Например: доступ к оборудованию"
                />
                <p className="mt-1 text-xs text-muted">
                  Обращение попадёт в очередь «Неназначенные», администратор направит его вручную.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="text">
                Что произошло *
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                minLength={10}
                maxLength={4000}
                rows={6}
                className="input resize-y"
                placeholder="Что происходит, где и как часто? Что вы ожидали?"
              />
              <p className="mt-1 text-xs text-muted">
                {text.trim().length < 10
                  ? `Ещё ${Math.max(0, 10 - text.trim().length)} символов до минимума`
                  : `${text.trim().length} символов — достаточно`}
              </p>
              <SimilarList text={text} />
            </div>

            <div>
              <label className="label" htmlFor="proposal">
                Предложенное решение
              </label>
              <textarea
                id="proposal"
                value={proposal}
                onChange={(event) => setProposal(event.target.value)}
                maxLength={4000}
                rows={4}
                className="input resize-y"
                placeholder="Как можно исправить или улучшить ситуацию? Необязательно."
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="priority">
                Приоритет
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="input"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Срок после взятия в работу: высокий — 3 дня, средний — 7, низкий — 14.
              </p>
            </div>

            <div>
              <label className="label" htmlFor="attachment">
                Вложение (необязательно, до 5 МБ)
              </label>
              <input
                id="attachment"
                name="attachment"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.odt,.ods"
                onChange={onFileChange}
                className="block min-h-11 w-full cursor-pointer rounded border border-line bg-surface px-3 py-2 text-sm text-muted file:mr-3 file:rounded file:border-0 file:bg-canvas file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
              />
              <p className="mt-1 text-xs text-muted">
                PDF, изображения, TXT, CSV, DOC(X), XLS(X), ODT/ODS. Исполняемые файлы и скрипты
                запрещены. На демо не прикладывайте реальные данные компании.
              </p>
              {fileError ? (
                <p className="field-error" role="alert">
                  {fileError}
                </p>
              ) : null}
            </div>

            <fieldset className="rounded border border-line p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Перед публикацией</legend>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED1111]"
                />
                <span>
                  Я согласен на обработку данных и ознакомился с{" "}
                  <Link
                    href="/legal/consent"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    согласием
                  </Link>{" "}
                  и{" "}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    политикой конфиденциальности
                  </Link>
                  . *
                </span>
              </label>
              <p className="mt-2 text-xs text-muted">
                Номер вида A-XXX присвоится после публикации. Автор увидит итог и сможет
                оценить результат.
              </p>
            </fieldset>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {step > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={() => goTo(step - 1)}>
              Назад
            </button>
          ) : (
            <Link href="/appeals" className="btn btn-secondary">
              Отмена
            </Link>
          )}

          {step < 2 ? (
            <button type="button" className="btn btn-primary" onClick={() => goTo(step + 1)}>
              Далее: {STEPS[step + 1]}
            </button>
          ) : (
            <SubmitArea disabled={!consent || Boolean(fileError)} />
          )}

          <span className="text-xs text-muted">Шаг {step + 1} из 3</span>
        </div>
      </form>
    </div>
  );
}
