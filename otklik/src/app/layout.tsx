import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Отклик — система обратной связи и предложений сотрудников",
  description:
    "Внутренняя система обратной связи ГК «Модус Трейд»: обращения сотрудников, маршрутизация, статусы, аналитика.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
