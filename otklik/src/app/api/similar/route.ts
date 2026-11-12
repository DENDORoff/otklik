import { NextResponse } from "next/server";
import { visibleWhere } from "@/lib/appeals";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/security";
import { statusLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** Похожие обращения для шага «Описание». Только доступные пользователю записи. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const limit = rateLimit(`similar:${user.id}`, { limit: 40, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { items: [], error: "rate" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 300) ?? "";
  if (query.length < 12) {
    return NextResponse.json({ items: [] });
  }

  const appeals = await prisma.appeal.findMany({
    where: {
      AND: [
        visibleWhere(user),
        {
          OR: [
            { text: { contains: query } },
            { proposal: { contains: query } },
            { code: { contains: query } },
          ],
        },
      ],
    },
    select: {
      id: true,
      code: true,
      status: true,
      text: true,
      category: { select: { name: true } },
      customCategory: true,
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return NextResponse.json({
    items: appeals.map((appeal) => ({
      id: appeal.id,
      code: appeal.code,
      status: statusLabel(appeal.status),
      category: appeal.customCategory ?? appeal.category.name,
      excerpt: appeal.text.replace(/\s+/g, " ").slice(0, 120),
    })),
  });
}
