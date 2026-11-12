import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Политика использования файлов cookie",
  description:
    "Одна сессионная cookie для входа, локальное сохранение выбора баннера и никаких сторонних трекеров.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <article className="legal-prose">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        Обновлено {COMPANY.updatedAt}
      </p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand">
        Политика использования файлов cookie
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        «Отклик» использует минимум cookie. Рекламных и аналитических трекеров нет.
      </p>

      <h2>1. Что такое cookie</h2>
      <p>
        Небольшой файл, который браузер сохраняет по запросу сайта. Он помогает поддерживать
        вход и запоминать выбор в баннере согласия. Cookie не содержит пароль.
      </p>

      <h2>2. Какие cookie мы используем</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="th">Имя</th>
              <th className="th">Тип</th>
              <th className="th">Назначение</th>
              <th className="th">Срок</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="td font-mono text-xs">otklik_session</td>
              <td className="td">Необходимая</td>
              <td className="td">Подписанная сессия входа, httpOnly</td>
              <td className="td">7 дней</td>
            </tr>
            <tr className="border-b border-line">
              <td className="td font-mono text-xs">otklik_cookie_choice_v1</td>
              <td className="td">Необходимая</td>
              <td className="td">Запоминает выбор в баннере (localStorage, не cookie)</td>
              <td className="td">до очистки браузера</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>3. Чего у нас нет</h2>
      <ul>
        <li>Google Analytics, Яндекс.Метрики и других счётчиков;</li>
        <li>рекламных пикселей и ретаргетинга;</li>
        <li>сторонних SDK, чатов и виджетов;</li>
        <li>профилирования и продажи данных.</li>
      </ul>

      <h2>4. Согласие и управление</h2>
      <p>
        Баннер при первом визите предлагает два равных варианта: «Только необходимые» и
        «Принять все». Поскольку необязательных cookie нет, оба варианта дают одинаковый
        результат — это сделано намеренно, без тёмных паттернов. Выбор можно изменить,
        очистив данные сайта в браузере.
      </p>
      <p>
        Cookie можно отключить в настройках браузера. Сессионная cookie необходима для входа:
        при её блокировке система не сможет поддерживать авторизацию.
      </p>

      <h2>5. Контакты</h2>
      <p>
        Вопросы по cookie и данным:{" "}
        <a href={`mailto:${COMPANY.privacyEmail}`}>{COMPANY.privacyEmail}</a>. Подробнее —{" "}
        <Link href="/legal/privacy">политика конфиденциальности</Link>.
      </p>
    </article>
  );
}
