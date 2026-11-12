import type { Metadata } from "next";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Лицензии шрифтов, кода и изображений",
  description:
    "Какие шрифты, библиотеки и изображения использует «Отклик» и на каких условиях они распространяются.",
  alternates: { canonical: "/legal/licenses" },
};

export default function LicensesPage() {
  return (
    <article className="legal-prose">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        Обновлено {COMPANY.updatedAt}
      </p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand">
        Лицензии шрифтов, кода и изображений
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Мы используем только те ресурсы, которые можно законно распространять. Ниже — состав
        и условия.
      </p>

      <h2>1. Шрифты</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="th">Шрифт</th>
              <th className="th">Где используется</th>
              <th className="th">Лицензия</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="td font-semibold">Montserrat</td>
              <td className="td">Весь интерфейс</td>
              <td className="td">
                SIL Open Font License 1.1. Файлы лежат в{" "}
                <code>public/fonts</code>, текст лицензии —{" "}
                <code>public/fonts/OFL-Montserrat.txt</code>
              </td>
            </tr>
            <tr className="border-b border-line">
              <td className="td font-semibold">Gilroy</td>
              <td className="td">Не включён</td>
              <td className="td">
                Коммерческий шрифт. Файлы не публикуются в репозитории; при наличии лицензии
                у оператора подключаются локально. Интерфейс использует Montserrat как
                совместимую замену.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Шрифты отдаются с нашего сервера, внешние запросы к Google Fonts не выполняются.
        Это снижает риск передачи IP-адресов третьим лицам.
      </p>

      <h2>2. Изображения и графика</h2>
      <ul>
        <li>логотип «Отклик» — собственная векторная графика проекта;</li>
        <li>декоративные элементы — CSS и inline-SVG, без стоковых фотографий;</li>
        <li>скриншоты в документации сняты с собственного интерфейса;</li>
        <li>изображений с лицензией «только для некоммерческого использования» нет.</li>
      </ul>

      <h2>3. Программные библиотеки</h2>
      <p>
        Проект использует Next.js, React, Prisma, Tailwind CSS, jose, bcryptjs, zod,
        date-fns и recharts. Каждая библиотека распространяется по своей открытой лицензии
        (MIT, Apache-2.0 или BSD). Полные тексты доступны в каталоге <code>node_modules</code>{" "}
        соответствующего пакета и на сайте проекта.
      </p>

      <h2>4. Сторонние сервисы</h2>
      <p>
        На стенде нет внешних SDK, карт, платёжных виджетов и облачной аналитики. Если
        интеграция появится, мы обновим эту страницу и политику конфиденциальности до
        подключения.
      </p>

      <h2>5. Как сообщить о проблеме</h2>
      <p>
        Если вы правообладатель и считаете, что материал использован некорректно, напишите на{" "}
        <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>. Мы проверим
        обращение и при необходимости удалим материал.
      </p>
    </article>
  );
}
