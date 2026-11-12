import type { Metadata } from "next";
import Link from "next/link";
import { NewAppealForm } from "@/components/new-appeal-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAppeal } from "./actions";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Новое обращение",
  robots: { index: false, follow: false },
};

export default async function NewAppealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslator();
  await requireUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const categories = await prisma.category.findMany({
    where: { isActive: true, name: { not: t("Другое") } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link href="/appeals" className="text-sm text-muted hover:text-link">
          {t("← Все обращения")}
        </Link>
        <h1 className="mt-3 text-[26px] font-bold leading-tight text-brand-ink">{t("Новое обращение")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("Три шага: что случилось, подробности, срок и отправка. Номер вида A-XXX присвоится автоматически.")}
        </p>
      </div>

      <NewAppealForm categories={categories} error={error} action={createAppeal} />
    </div>
  );
}
