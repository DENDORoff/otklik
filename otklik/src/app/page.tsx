import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslator } from "@/lib/i18n/server";

const DAY = 86_400_000;

export const metadata: Metadata = {
  title: "Отклик — обратная связь и предложения сотрудников",
  description:
    "«Отклик» — внутренняя система обратной связи ГК «Модус Трейд»: обращение проходит маршрутизацию, назначение исполнителя, срок по SLA, итог и оценку автора. Демо-стенд на синтетических данных.",
  alternates: { canonical: "/" },
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function LandingPage() {
  const t = await getTranslator();
  const user = await getCurrentUser();

  const [total, closed, implemented, departments, users, categories, rules, appeals] =
    await Promise.all([
      prisma.appeal.count(),
      prisma.appeal.count({ where: { status: "closed" } }),
      prisma.appeal.count({ where: { status: "implemented" } }),
      prisma.department.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.routingRule.count(),
      prisma.appeal.findMany({
        select: { publishedAt: true, resolvedAt: true, rating: { select: { score: true } } },
      }),
    ]);

  const resolutionDays = appeals
    .filter((appeal) => appeal.resolvedAt)
    .map((appeal) => (+appeal.resolvedAt! - +appeal.publishedAt) / DAY);
  const scores = appeals
    .map((appeal) => appeal.rating?.score)
    .filter((score): score is number => typeof score === "number");

  const avgResolution = average(resolutionDays);
  const avgScore = average(scores);
  const withResult = closed + implemented;
  const resultShare = total ? Math.round((withResult / total) * 100) : 0;

  const problems = [
    "Обращения теряются в почте и чатах: ответа нет, история не сохраняется.",
    "Непонятно, кому передавать вопрос: структура компании живёт в головах, а не в системе.",
    "Идеи сотрудников не доходят до изменений: нет связи между проблемой и результатом.",
  ];

  const solutions = [
    "Сквозной процесс: подача → маршрутизация → начальник отдела → исполнитель → итог → оценка.",
    "Маршрутизация — правило «категория → отдел» в базе, а не код: изменение структуры не требует релиза.",
    "Каждое обращение видно автору: статус, срок, история решений и мотивированный отказ.",
    "Метрики для руководства: доля рассмотренных, время первого ответа, доля с результатом, удовлетворённость.",
  ];

  const steps = [
    {
      title: "Подача",
      text: "Сотрудник описывает проблему или идею в мастере из трёх шагов: тип, категория, описание с файлом.",
    },
    {
      title: "Маршрутизация",
      text: "Правило из базы находит отдел-получателя. Если правила нет — очередь «Неназначенные» и уведомление администратору.",
    },
    {
      title: "Назначение",
      text: "Начальник отдела выбирает исполнителя и срок: SLA 3 / 7 / 14 дней в зависимости от приоритета.",
    },
    {
      title: "Работа",
      text: "Исполнитель уточняет детали при необходимости и фиксирует, что именно сделано.",
    },
    {
      title: "Итог",
      text: "Автор видит результат, а при отказе — мотивированную причину с датой.",
    },
    {
      title: "Оценка",
      text: "Оценка от 1 до 5 закрывает обращение и попадает в аналитику и ленту улучшений.",
    },
  ];

  const features = [
    {
      title: "Мастер из трёх шагов",
      text: "Тип, категория, «Другое» со своей формулировкой, поиск похожих, проверка файла и согласие на обработку данных.",
    },
    {
      title: "SLA и просрочка",
      text: "Срок считается по приоритету; просроченные обращения подсвечиваются и собраны в отдельной вкладке.",
    },
    {
      title: "Три роли, права на сервере",
      text: "Сотрудник, начальник отдела, администратор. Каждая проверка — в Server Action, а не только в интерфейсе.",
    },
    {
      title: "Маршрутизация из базы",
      text: "Правило «категория → отдел» меняется администратором без изменения кода.",
    },
    {
      title: "История и возврат",
      text: "Каждое действие фиксируется: кто, когда и что изменил. Обращение можно вернуть на доработку.",
    },
    {
      title: "Дубликаты и повторы",
      text: "Пометка дубликата подписывает автора на оригинал, аналитика показывает повторяющиеся проблемы.",
    },
    {
      title: "Аналитика",
      text: "Типы, категории, статусы, время первого ответа, среднее решение, просрочка и удовлетворённость.",
    },
    {
      title: "Лента улучшений",
      text: "Обезличенная лента реализованных изменений: видно, что изменилось, но не кто пожаловался.",
    },
    {
      title: "CSV-выгрузка",
      text: "Отчёт с BOM и защитой от формул Excel, учитывает права доступа.",
    },
    {
      title: "Светлая и тёмная тема",
      text: "Переключается в шапке, выбор запоминается, контраст проверен по WCAG AA.",
    },
    {
      title: "Языки RU / EN / KZ",
      text: "Интерфейс переключается без перезагрузки, выбор хранится в cookie.",
    },
    {
      title: "Юридический контур",
      text: "Политики, согласие с версией и датой, cookie-баннер, форма запроса на удаление данных.",
    },
  ];

  const roles = [
    {
      title: "Сотрудник",
      text: "Подаёт обращения, отслеживает статус, получает итог и оценивает результат.",
    },
    {
      title: "Начальник отдела",
      text: "Видит поток своего отдела, назначает исполнителя, запрашивает уточнение, фиксирует итог.",
    },
    {
      title: "Администратор",
      text: "Управляет правилами маршрутизации и справочниками, обрабатывает запросы по данным, ведёт журнал безопасности.",
    },
  ];

  const roadmap = [
    {
      title: "Битрикс24",
      text: "Облачный портал: обращение превращается в задачу ответственному, статус возвращается в «Отклик». Модуль подготовлен, включение — по данным портала.",
      state: "Модуль подготовлен",
    },
    {
      title: "1С",
      text: "Справочник сотрудников и подразделений подтягивается HTTP-сервисом — оргструктура перестаёт быть ручной.",
      state: "Описан",
    },
    {
      title: "Анонимные опросы",
      text: "Отдельный тип обращения без персональных данных — для оценки идей и условий работы.",
      state: "План",
    },
    {
      title: "Конструктор структуры",
      text: "Отделы, категории и правила маршрутизации — в интерфейсе администратора, без правки кода.",
      state: "План",
    },
    {
      title: "Каналы уведомлений",
      text: "Доставка выносится в настройки: сейчас внутрисистемные, email-канал имитируется.",
      state: "Частично",
    },
    {
      title: "Поиск по смыслу",
      text: "Похожие обращения находятся не только по тексту, но и по смыслу запроса.",
      state: "План",
    },
  ];

  const limitations = [
    "Только синтетические данные из датасета хакатона.",
    "Уведомления только внутрисистемные; email-канал имитируется.",
    "Интеграции с Битрикс24 и 1С описаны и подготовлены, но не включены в демо-стенд.",
    "Юридические документы опубликованы на русском языке.",
  ];

  const stats = [
    { label: "Обращений в демо-стенде", value: String(total) },
    { label: "Доля закрытых с результатом", value: `${resultShare}%` },
    { label: "Среднее время решения", value: avgResolution ? t("{n} дн.", { n: avgResolution.toFixed(1) }) : "—" },
    { label: "Средняя оценка автора", value: avgScore ? avgScore.toFixed(1) : "—" },
    { label: "Отделов в структуре", value: String(departments) },
    { label: "Сотрудников с доступом", value: String(users) },
    { label: "Категорий обращений", value: String(categories) },
    { label: "Правил маршрутизации", value: String(rules) },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <LandingHeader signedIn={Boolean(user)} />

      <main id="main" className="flex-1">
        {/* Первый экран */}
        <section className="bg-brand text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {t("Хакатон ГК «Модус Трейд» · внутренняя система обратной связи")}
            </p>
            <h1 className="mt-4 max-w-3xl text-[34px] font-bold leading-tight text-white sm:text-[46px]">
              {t("Каждому обращению сотрудника — есть итог")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75">
              {t(
                "«Отклик» проводит обращение от подачи до результата: маршрутизация по категории, назначение исполнителя, срок по SLA, мотивированный отказ и оценка автора.",
              )}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={user ? "/appeals" : "/login"} className="btn btn-primary normal-case">
                {t(user ? "Открыть обращения" : "Войти в систему")}
              </Link>
              <a
                href="#how"
                className="btn btn-secondary border-white/30 text-white hover:border-white/60"
              >
                {t("Как это работает")}
              </a>
            </div>

            <p className="mt-6 text-xs text-white/60">
              {t(
                "Демо-пароль всех учётных записей — demo1234. Быстрый вход кнопками на странице входа.",
              )}
            </p>
          </div>
        </section>

        {/* Проблема и решение */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Проблема")}</h2>
              <ul className="mt-5 space-y-3">
                {problems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
                    />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[26px] font-bold leading-tight text-brand-ink">
                {t("Что делает «Отклик»")}
              </h2>
              <ul className="mt-5 space-y-3">
                {solutions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    />
                    <span>{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-[26px] font-bold leading-tight text-brand-ink">
              {t("Как это работает")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {t("Шесть шагов от вопроса сотрудника до оценки результата.")}
            </p>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="card p-5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-brand-ink">{t(step.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(step.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Возможности */}
        <section id="features" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Возможности")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {t("Что уже работает в демо-стенде.")}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="card p-5">
                <h3 className="text-base font-bold text-brand-ink">{t(feature.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(feature.text)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Роли */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Кто работает")}</h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {roles.map((role) => (
                <article key={role.title} className="card p-5">
                  <h3 className="text-base font-bold text-brand-ink">{t(role.title)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(role.text)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Статистика */}
        <section id="stats" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-[26px] font-bold leading-tight text-brand-ink">{t("Статистика")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {t("Показатели демо-стенда, посчитанные по синтетическим данным датасета.")}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card p-5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {t(stat.label)}
                </dt>
                <dd className="mt-2 text-3xl font-bold leading-none text-brand-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-xs text-muted">
            {t("Это не реальные данные компании: стенд работает только на синтетике.")}
          </p>
        </section>

        {/* Развитие и интеграции */}
        <section id="integrations" className="border-y border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-[26px] font-bold leading-tight text-brand-ink">
              {t("Развитие и интеграции")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {t("Что можно подключить к «Отклику» дальше.")}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmap.map((item) => (
                <article key={item.title} className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-brand-ink">{t(item.title)}</h3>
                    <span className="badge bg-subtle text-[10px] text-muted">{t(item.state)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t(item.text)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Ограничения */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-brand-ink">{t("Честно об ограничениях")}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {limitations.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line"
                  />
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Финальный призыв */}
        <section className="bg-brand text-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="max-w-2xl text-[26px] font-bold leading-tight text-white">
              {t("Посмотрите, как это работает")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
              {t(
                "Войдите под демо-аккаунтом и пройдите сценарий: подача → назначение → итог → оценка.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={user ? "/appeals" : "/login"} className="btn btn-primary normal-case">
                {t(user ? "Открыть обращения" : "Войти в систему")}
              </Link>
              <a
                href="https://github.com/DENDORoff/otklik"
                className="btn btn-secondary border-white/30 text-white hover:border-white/60"
                target="_blank"
                rel="noreferrer"
              >
                {t("Код на GitHub")}
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
