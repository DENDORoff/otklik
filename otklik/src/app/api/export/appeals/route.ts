import { buildListWhere, parseFilters } from "@/lib/appeals";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import { priorityLabel, statusLabel, typeLabel } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * CSV-выгрузка обращений, доступных пользователю.
 * BOM нужен Excel для корректной кириллицы. Значения, начинающиеся с =,+,-,@,
 * экранируются, чтобы Excel не выполнил их как формулу.
 */
function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Требуется вход.", { status: 401 });

  const limit = rateLimit(`export:${user.id}`, { limit: 6, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) {
    return new Response("Слишком много выгрузок. Попробуйте позже.", {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  const url = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) params[key] = value;
  const filters = parseFilters(params);

  const appeals = await prisma.appeal.findMany({
    where: buildListWhere(user, filters),
    include: {
      category: true,
      department: true,
      author: true,
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const header = [
    "Номер",
    "Статус",
    "Тип",
    "Категория",
    "Приоритет",
    "Автор",
    "Отдел",
    "Исполнитель",
    "Создано",
    "Срок",
    "Текст",
    "Итог",
  ];

  const rows = appeals.map((appeal) => [
    appeal.code,
    statusLabel(appeal.status),
    typeLabel(appeal.type),
    appeal.customCategory ?? appeal.category.name,
    priorityLabel(appeal.priority),
    appeal.author.name,
    appeal.department?.name ?? "",
    appeal.assignee?.name ?? "",
    formatDate(appeal.publishedAt),
    appeal.deadline ? formatDate(appeal.deadline) : "",
    appeal.text.replace(/\s+/g, " "),
    (appeal.result ?? "").replace(/\s+/g, " "),
  ]);

  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="otklik-appeals-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
