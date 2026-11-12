import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { COMPANY } from "@/lib/company";

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
  themeColor: "#082742",
  colorScheme: "light",
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="skip-link">
          Перейти к содержимому
        </a>
        {children}
        <CookieBanner />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
