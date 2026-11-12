import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { typeLabel } from "@/lib/constants";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Реализованные улучшения",
  robots: { index: false, follow: false },
};

export default async function ImprovementsPage() {
  const t = await getTranslator();
  await requireUser();

  const [items, total, implemented, categories] = await Promise.all([
    prisma.appeal.findMany({
      where: { status: { in: ["implemented", "closed"] }, result: { not: null } },
      select: {
        id: true,
        type: true,
        result: true,
        resolvedAt: true,
        publishedAt: true,
        customCategory: true,
        category: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: [{ resolvedAt: "desc" }, { publishedAt: "desc" }],
      take: 40,
    }),
    prisma.appeal.count(),
    prisma.appeal.count({ where: { status: { in: ["implemented", "closed"] } } }),
    prisma.category.count({ where: { isActive: true } }),
  ]);

  const share = total > 0 ? Math.round((implemented / total) * 100) : 0;

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-[26px] font-bold leading-tight text-brand-ink">
          {t("Реализованные улучшения")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("Обезличенная лента: видно, что изменилось, а не кто пожаловался. Авторы и номера обращений скрыты — показываем только суть результата, категорию и отдел.")}
        </p>
      </div>

      <dl className="grid gap-6 border-y border-line py-6 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t("Доведено до итога")}
          </dt>
          <dd className="mt-1 text-3xl font-bold text-brand-ink">{implemented}</dd>
          <p className="mt-1 text-xs text-muted">{t("из")} {total} {t("обращений")}</p>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t("Доля завершённых")}
          </dt>
          <dd className="mt-1 text-3xl font-bold text-brand-ink">{share}%</dd>
          <p className="mt-1 text-xs text-muted">{t("от общего потока")}</p>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {t("Категорий в работе")}
          </dt>
          <dd className="mt-1 text-3xl font-bold text-brand-ink">{categories}</dd>
          <p className="mt-1 text-xs text-muted">{t("маршрутизация по правилам")}</p>
        </div>
      </dl>

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-ink">{t("Пока нет завершённых улучшений")}</p>
          <p className="mt-1 text-sm text-muted">
            {t("Как только обращение получит итог, оно появится здесь без имени автора.")}
          </p>
          <Link href="/appeals/new" className="btn btn-primary mt-5">
            {t("Предложить улучшение")}
          </Link>
        </div>
      ) : (
        <ol className="mt-8 space-y-8">
          {items.map((item, index) => (
            <li key={item.id} className="border-b border-line pb-8 last:border-0 last:pb-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t("Улучшение")} {String(index + 1).padStart(2, "0")} ·{" "}
                {typeLabel(item.type)} · {formatDate(item.resolvedAt ?? item.publishedAt, t.locale)}
              </p>
              <h2 className="mt-2 text-lg font-bold leading-snug text-brand-ink">
                {item.customCategory ?? item.category.name}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink">{item.result}</p>
              <p className="mt-2 text-xs text-muted">
                {t("Внедрил отдел:")} {item.department?.name ?? t("не указан")}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-12 rounded border border-line bg-surface p-6">
        <h2 className="text-base font-bold text-brand-ink">{t("Как попасть в эту ленту")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t("Обращение проходит путь «Новое → На рассмотрении → В работе → Реализовано». Исполнитель фиксирует итог, автор оценивает результат, обращение закрывается. Именно итог, а не сам факт жалобы, попадает в ленту.")}
        </p>
        <Link href="/appeals/new" className="btn btn-secondary mt-4">
          {t("Создать обращение")}
        </Link>
      </section>
    </div>
  );
}
