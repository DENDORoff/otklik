import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Политика использования файлов cookie",
  description:
    "Сессионная cookie для входа, cookie выбора темы оформления, локальное сохранение выбора баннера и никаких сторонних трекеров.",
  alternates: { canonical: "/legal/cookies" },
};

export default async function CookiesPage() {
  const t = await getTranslator();
  return (
    <article className="legal-prose">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("Обновлено")} {COMPANY.updatedAt}
      </p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand-ink">
        {t("Политика использования файлов cookie")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {t("«Отклик» использует минимум cookie. Рекламных и аналитических трекеров нет.")}
      </p>

      <h2>{t("1. Что такое cookie")}</h2>
      <p>
        {t("Небольшой файл, который браузер сохраняет по запросу сайта. Он помогает поддерживать вход и запоминать выбор в баннере согласия. Cookie не содержит пароль.")}
      </p>

      <h2>{t("2. Какие cookie мы используем")}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="th">{t("Имя")}</th>
              <th className="th">{t("Тип")}</th>
              <th className="th">{t("Назначение")}</th>
              <th className="th">{t("Срок")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="td font-mono text-xs">otklik_session</td>
              <td className="td">{t("Необходимая")}</td>
              <td className="td">{t("Подписанная сессия входа, httpOnly")}</td>
              <td className="td">{t("7 дней")}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="td font-mono text-xs">otklik_cookie_choice_v1</td>
              <td className="td">{t("Необходимая")}</td>
              <td className="td">{t("Запоминает выбор в баннере (localStorage, не cookie)")}</td>
              <td className="td">{t("до очистки браузера")}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="td font-mono text-xs">theme</td>
              <td className="td">{t("Функциональная")}</td>
              <td className="td">
                {t("Запоминает выбранную тему оформления (light или dark). Персональных данных не содержит, выбор меняется кнопкой в шапке.")}
              </td>
              <td className="td">{t("12 месяцев")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>{t("3. Чего у нас нет")}</h2>
      <ul>
        <li>{t("Google Analytics, Яндекс.Метрики и других счётчиков;")}</li>
        <li>{t("рекламных пикселей и ретаргетинга;")}</li>
        <li>{t("сторонних SDK, чатов и виджетов;")}</li>
        <li>{t("профилирования и продажи данных.")}</li>
      </ul>

      <h2>{t("4. Согласие и управление")}</h2>
      <p>
        {t("Баннер при первом визите предлагает два равных варианта: «Только необходимые» и «Принять все». Поскольку необязательных cookie нет, оба варианта дают одинаковый результат — это сделано намеренно, без тёмных паттернов. Выбор можно изменить, очистив данные сайта в браузере.")}
      </p>
      <p>
        {t("Cookie можно отключить в настройках браузера. Сессионная cookie необходима для входа: при её блокировке система не сможет поддерживать авторизацию. Cookie темы оформления не влияет на работу системы — без неё тема просто сбросится к светлой при следующем визите.")}
      </p>

      <h2>{t("5. Контакты")}</h2>
      <p>
        {t("Вопросы по cookie и данным:")}{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>{t(". Подробнее —")}{" "}
        <Link href="/legal/privacy">{t("политика конфиденциальности")}</Link>.
      </p>
    </article>
  );
}
