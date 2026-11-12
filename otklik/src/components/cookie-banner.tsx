"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "otklik_cookie_choice_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState<"all" | "essential" | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
      else setSaved(stored === "all" ? "all" : "essential");
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value: "all" | "essential") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Приватный режим: выбор не сохранится, но интерфейс продолжит работать.
    }
    setSaved(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section
      aria-label="Согласие на использование файлов cookie"
      role="region"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white shadow-[0_-8px_24px_rgba(8,39,66,0.08)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-ink">
            Только необходимые cookie — без рекламы и слежки
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Мы используем одну сессионную cookie для входа. Аналитики, рекламных пикселей и
            сторонних SDK нет. Подробнее —{" "}
            <Link href="/legal/cookies" className="font-medium underline underline-offset-2">
              в политике cookie
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => choose("essential")} className="btn btn-secondary">
            Только необходимые
          </button>
          <button type="button" onClick={() => choose("all")} className="btn btn-primary">
            Принять все
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {saved ? "Выбор сохранён" : ""}
      </p>
    </section>
  );
}
