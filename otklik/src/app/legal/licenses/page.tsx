import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Лицензии шрифтов, кода и изображений",
  description:
    "Какие шрифты, библиотеки и изображения использует «Отклик» и на каких условиях они распространяются.",
  alternates: { canonical: "/legal/licenses" },
};

export default async function LicensesPage() {
  const t = await getTranslator();
  return (
    <article className="legal-prose">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("Обновлено")} {COMPANY.updatedAt}
      </p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand-ink">
        {t("Лицензии шрифтов, кода и изображений")}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {t("Мы используем только те ресурсы, которые можно законно распространять. Ниже — состав и условия.")}
      </p>

      <h2>{t("1. Шрифты")}</h2>
      <p>
        {t("Весь интерфейс набран одним бесплатным шрифтом Montserrat (SIL Open Font License 1.1). Файлы шрифта и текст лицензии лежат в")}{" "}
        <code>public/fonts</code>. {t("Шрифты отдаются с нашего сервера, внешние запросы к Google Fonts не выполняются — это снижает риск передачи IP-адресов третьим лицам.")}
      </p>

      <h2>{t("2. Изображения и графика")}</h2>
      <ul>
        <li>{t("логотип «Отклик» — собственная векторная графика проекта;")}</li>
        <li>{t("декоративные элементы — CSS и inline-SVG, без стоковых фотографий;")}</li>
        <li>{t("скриншоты в документации сняты с собственного интерфейса;")}</li>
        <li>{t("изображений с лицензией «только для некоммерческого использования» нет.")}</li>
      </ul>

      <h2>{t("3. Программные библиотеки")}</h2>
      <p>
        {t("Проект использует Next.js, React, Prisma, Tailwind CSS, jose, bcryptjs, zod и date-fns. Каждая библиотека распространяется по своей открытой лицензии (MIT, Apache-2.0 или BSD). Полные тексты доступны в каталоге")} <code>node_modules</code>{" "}
        {t("соответствующего пакета и на сайте проекта.")}
      </p>

      <h2>{t("4. Сторонние сервисы")}</h2>
      <p>
        {t("На стенде нет внешних SDK, карт, платёжных виджетов и облачной аналитики. Если интеграция появится, мы обновим эту страницу и политику конфиденциальности до подключения.")}
      </p>

      <h2>{t("5. Как сообщить о проблеме")}</h2>
      <p>
        {t("Если вы правообладатель и считаете, что материал использован некорректно, напишите на")}{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>{t(". Мы проверим обращение и при необходимости удалим материал.")}
      </p>
    </article>
  );
}
