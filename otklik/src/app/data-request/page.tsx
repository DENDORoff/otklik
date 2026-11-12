import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { COMPANY } from "@/lib/company";
import { submitDataRequest } from "./actions";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Запрос на доступ или удаление данных",
  description:
    "Отправьте запрос на доступ, исправление, удаление данных или отзыв согласия. Срок ответа — до 10 рабочих дней.",
  alternates: { canonical: "/data-request" },
  robots: { index: true, follow: true },
};

const KINDS = [
  { value: "access", label: "Получить копию моих данных" },
  { value: "correct", label: "Исправить неточные данные" },
  { value: "delete", label: "Удалить мои данные" },
  { value: "withdraw", label: "Отозвать согласие на обработку" },
];

export default async function DataRequestPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslator();
  const params = await searchParams;
  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : "";
  const errorText =
    error === "rate"
      ? t("Слишком много запросов с этого адреса. Попробуйте через час.")
      : error === "server"
        ? t("Не удалось сохранить запрос. Попробуйте ещё раз или напишите на почту.")
        : error;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-brand text-white shadow-[0_2px_10px_rgba(8,39,66,0.22)]">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" aria-label={t("Отклик — на главную")}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/legal/privacy"
              className="rounded px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
            >
              {t("Политика")}
            </Link>
            <Link href="/login" className="btn btn-secondary normal-case">
              {t("Войти")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 scroll-mt-20 px-4 py-12 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("Персональные данные")}
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand-ink">
          {t("Запрос на доступ или удаление данных")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {t("Один запрос — один ответ. Мы подтвердим получение и сообщим решение в течение 10 рабочих дней. Для удаления аккаунта доступ в систему прекратится.")}
        </p>

        {sent ? (
          <div className="mt-8 rounded border border-[#B7E4C7] border-l-4 border-l-[#198754] bg-[#F1FBF5] p-5 dark:border-[#2C5A3F] dark:border-l-[#3FBF7F] dark:bg-[#102A1D]">
            <h2 className="text-base font-bold text-[#136C4A] dark:text-[#5FD3A3]">{t("Запрос отправлен")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {t("Мы записали обращение и уведомили ответственного. Ответ придёт на указанную почту. Если ответа нет дольше 10 рабочих дней, напишите на")}{" "}
              <a href={`mailto:${COMPANY.privacyEmail}`} className="font-medium underline">
                {COMPANY.privacyEmail}
              </a>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/" className="btn btn-primary">
                {t("На главную")}
              </Link>
              <Link href="/legal/privacy" className="btn btn-secondary">
                {t("Политика конфиденциальности")}
              </Link>
            </div>
          </div>
        ) : (
          <form action={submitDataRequest} className="mt-8 space-y-5">
            {errorText ? (
              <div className="danger-block text-sm text-[#C00000] dark:text-[#FF9A9A]" role="alert">
                {errorText}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">
                  {t("Имя и фамилия *")}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  className="input"
                  placeholder={t("Как к вам обращаться")}
                />
              </div>
              <div>
                <label htmlFor="email" className="label">
                  {t("Почта для ответа *")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  inputMode="email"
                  className="input"
                  placeholder="name@company.kz"
                />
              </div>
            </div>

            <div>
              <label htmlFor="kind" className="label">
                {t("Что нужно сделать *")}
              </label>
              <select id="kind" name="kind" required className="input" defaultValue="access">
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {t(kind.label)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="label">
                {t("Детали запроса *")}
              </label>
              <textarea
                id="message"
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={5}
                className="input resize-y"
                placeholder={t("Укажите рабочую почту или номер обращения, если он есть. Не прикладывайте пароли и документы.")}
              />
              <p className="mt-1 text-xs text-muted">
                {t("Минимум 10 символов. Не отправляйте пароли, номера карт и лишние документы.")}
              </p>
            </div>

            <fieldset className="space-y-3 rounded border border-line p-4">
              <legend className="px-1 text-sm font-semibold text-ink">
                {t("Подтверждения")}
              </legend>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED1111]"
                />
                <span>
                  {t("Я ознакомился с")}{" "}
                  <Link
                    href="/legal/consent"
                    className="font-medium underline underline-offset-2"
                  >
                    {t("согласием на обработку данных")}
                  </Link>{" "}
                  {t("и")}{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-medium underline underline-offset-2"
                  >
                    {t("политикой конфиденциальности")}
                  </Link>
                  {t(". Согласие можно отозвать.")}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  name="adult"
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED1111]"
                />
                <span>{t("Мне 18 лет или больше.")}</span>
              </label>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <button type="submit" className="btn btn-primary">
                {t("Отправить запрос")}
              </button>
              <Link href="/" className="btn btn-secondary">
                {t("Отмена")}
              </Link>
              <span className="text-xs text-muted">
                {t("Ответ — до 10 рабочих дней")}
              </span>
            </div>
          </form>
        )}

        <section className="mt-12 border-t border-line pt-6">
          <h2 className="text-sm font-bold text-brand-ink">{t("Что произойдёт дальше")}</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted">
            <li>{t("1. Мы подтвердим получение на указанную почту.")}</li>
            <li>{t("2. Проверим, что запрос относится к вашим данным.")}</li>
            <li>{t("3. Выполним доступ, исправление или удаление и сообщим результат.")}</li>
          </ol>
          <p className="mt-4 text-xs text-muted">
            {t("Если удобнее письмо —")}{" "}
            <a href={`mailto:${COMPANY.privacyEmail}`} className="underline underline-offset-2">
              {COMPANY.privacyEmail}
            </a>
            .
          </p>
        </section>
      </main>

      <SiteFooter compact />
    </div>
  );
}
