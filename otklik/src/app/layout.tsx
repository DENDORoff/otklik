import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { ThemeSync } from "@/components/theme-toggle";
import { I18nProvider } from "@/components/i18n-provider";
import { COMPANY } from "@/lib/company";
import { getLocale, getClientLabels } from "@/lib/i18n/server";
import { getTranslator } from "@/lib/i18n/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Отклик — обратная связь и предложения сотрудников",
    template: "%s · Отклик",
  },
  description:
    "Внутренняя система обратной связи ГК «Модус Трейд»: обращение проходит маршрутизацию, назначение исполнителя, итог и оценку автора. Демо-стенд на синтетических данных.",
  applicationName: "Отклик",
  authors: [{ name: "Команда проекта «Отклик»" }],
  keywords: [
    "обратная связь сотрудников",
    "предложения сотрудников",
    "внутренняя система",
    "маршрутизация обращений",
    "ГК Модус Трейд",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Отклик",
    title: "Отклик — каждому обращению сотрудника есть итог",
    description:
      "Подача, маршрутизация, исполнитель, результат и оценка автора — один прозрачный процесс. Демонстрационный стенд хакатона.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Отклик — система обратной связи сотрудников",
    description:
      "Обращение не теряется: маршрутизация по категориям, SLA, история и оценка результата.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#082742" },
    { media: "(prefers-color-scheme: dark)", color: "#0B131C" },
  ],
  colorScheme: "light dark",
};

/**
 * Тема до первой отрисовки: без этого при перезагрузке мелькала бы светлая тема.
 * Приоритет: сохранённый выбор → системная настройка. Класс ставится на <html>.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Отклик",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Внутренняя система обратной связи и предложений сотрудников: маршрутизация, SLA, история, аналитика.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "KZT" },
  publisher: { "@type": "Organization", name: COMPANY.brand },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslator();
  const locale = await getLocale();
  const labels = await getClientLabels();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          {t("Перейти к содержимому")}
        </a>
        <I18nProvider locale={locale} labels={labels}>
          {children}
          <CookieBanner />
          <ThemeSync />
        </I18nProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
