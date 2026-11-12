import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { login, quickLogin } from "./actions";

export const metadata: Metadata = {
  title: "Вход в систему",
  description:
    "Вход в «Отклик» — внутреннюю систему обратной связи и предложений сотрудников ГК «Модус Трейд».",
  alternates: { canonical: "/login" },
};

const DEMO_ACCOUNTS = [
  { label: "Сотрудник закупок", email: "purchase@otklik.local" },
  { label: "Начальник закупок", email: "head.purchase@otklik.local" },
  { label: "Начальник IT", email: "head.it@otklik.local" },
  { label: "Администратор", email: "admin@otklik.local" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/appeals");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const left = typeof params.left === "string" ? params.left : "";
  const retry = typeof params.retry === "string" ? Number(params.retry) : 0;
  const retryMinutes = retry > 0 ? Math.max(1, Math.ceil(retry / 60)) : 0;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <Logo />
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Хакатон ГК «Модус Трейд»
          </p>
          <h1 className="text-balance text-4xl font-bold leading-tight">
            Каждому обращению —<br />
            <span className="text-[#ED1111]">итог</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/75">
            Сотрудник подаёт обращение, начальник отдела назначает исполнителя, автор видит
            результат и оценивает его. Обращение не теряется в переписке.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li>• Маршрутизация по категориям — структура компании как данные</li>
            <li>• Срок по приоритету: 3, 7 или 14 дней, просрочка подсвечивается</li>
            <li>• Аналитика повторов, сроков и удовлетворённости</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/45">
          Демо-стенд · синтетические данные из датасета
        </div>
        {/* Контрастная подложка: текст поверх декоративных фигур остаётся читаемым. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04182A]/60 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-1/4 h-64 w-64 rounded-full border border-[#ED1111]/30" />
      </section>

      <section className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo tone="dark" />
          </div>

          <h2 className="text-2xl font-bold text-brand">Вход в систему</h2>
          <p className="mt-1 text-sm text-muted">
            Введите рабочую почту и пароль. Для демо есть быстрый вход ниже.
          </p>

          <form action={login} className="mt-6 space-y-3" aria-describedby="login-status">
            <div>
              <label className="label" htmlFor="email">
                Рабочая почта
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={200}
                className="input"
                placeholder="name@otklik.local"
                aria-invalid={error === "credentials"}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={1}
                maxLength={200}
                className="input"
                placeholder="demo1234"
                aria-invalid={error === "credentials"}
              />
            </div>

            <div id="login-status" aria-live="polite">
              {error === "rate" ? (
                <p className="rounded border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#C00000]">
                  Слишком много попыток. Вход временно ограничен
                  {retryMinutes ? ` — попробуйте через ${retryMinutes} мин.` : "."} Это защита
                  от подбора пароля, данные не потеряны.
                </p>
              ) : error === "credentials" ? (
                <p className="rounded border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#C00000]">
                  Почта и пароль не совпали. Проверьте раскладку и попробуйте ещё раз.
                  {left ? ` Осталось попыток: ${left}.` : ""} Для демо пароль —{" "}
                  <strong>demo1234</strong>.
                </p>
              ) : error === "demo" ? (
                <p className="rounded border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-2 text-sm text-[#C00000]">
                  Демо-аккаунт недоступен. Выберите другую роль ниже.
                </p>
              ) : null}
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Войти
            </button>
          </form>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Входя, вы подтверждаете, что ознакомились с{" "}
            <Link href="/legal/terms" className="underline underline-offset-2">
              условиями
            </Link>{" "}
            и{" "}
            <Link href="/legal/privacy" className="underline underline-offset-2">
              политикой конфиденциальности
            </Link>
            . Обработка данных — по{" "}
            <Link href="/legal/consent" className="underline underline-offset-2">
              согласию
            </Link>
            .
          </p>

          <div className="mt-8 border-t border-line pt-5">
            <p className="label">Быстрый вход для демо</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <form key={account.email} action={quickLogin}>
                  <input type="hidden" name="email" value={account.email} />
                  <button type="submit" className="btn btn-secondary w-full normal-case">
                    {account.label}
                  </button>
                </form>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Пароль всех демо-аккаунтов: demo1234</p>
          </div>
        </div>
      </section>
    </div>
  );
}
