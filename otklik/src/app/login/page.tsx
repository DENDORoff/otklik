import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { login, quickLogin } from "./actions";

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

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <Logo />
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Хакатон ГК «Модус Трейд»
          </p>
          <h1 className="text-4xl font-bold leading-tight">
            Каждому обращению —<br />
            <span className="text-[#ED1111]">отклик</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            Внутренняя система обратной связи: сотрудник подаёт обращение, начальник отдела
            назначает исполнителя, автор видит итог и оценивает результат.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            <li>• Маршрутизация по категориям — структура компании как данные</li>
            <li>• Прозрачный жизненный цикл: от «Новое» до «Закрыто»</li>
            <li>• Аналитика повторов, сроков и удовлетворённости</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/40">
          Демо-стенд · синтетические данные из датасета
        </div>
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-1/4 h-64 w-64 rounded-full border border-[#ED1111]/30" />
      </section>

      <section className="flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo tone="dark" />
          </div>

          <h2 className="text-2xl font-bold text-brand">Вход в систему</h2>
          <p className="mt-1 text-sm text-muted">
            Используйте демо-учётную запись или введите почту и пароль.
          </p>

          <form action={login} className="mt-6 space-y-3">
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
                className="input"
                placeholder="name@otklik.local"
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
                className="input"
                placeholder="demo1234"
              />
            </div>
            {error ? (
              <p className="rounded bg-white px-3 py-2 text-sm text-[#E40000]">
                Неверная почта или пароль. Для демо-доступа пароль —{" "}
                <strong>demo1234</strong>.
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary w-full">
              Войти
            </button>
          </form>

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
