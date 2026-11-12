import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-[0_2px_10px_rgba(8,39,66,0.22)]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="Отклик — на главную">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16">
        <div className="card w-full max-w-xl p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Ошибка 404
          </p>
          <h1 className="mt-2 text-[26px] font-bold leading-tight text-brand-ink">
            Обращение не найдено
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Возможно, ссылка устарела, обращение удалено или у вас нет прав на его просмотр.
            Обращения видны автору, исполнителю, начальнику отдела-получателя и администратору.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/appeals" className="btn btn-primary">
              К списку обращений
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Сменить пользователя
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
