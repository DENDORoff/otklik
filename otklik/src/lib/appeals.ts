import type { Prisma, User } from "@prisma/client";
import { prisma } from "./db";

export type ListFilters = {
  status?: string;
  categoryId?: string;
  departmentId?: string;
  type?: string;
  priority?: string;
  q?: string;
  overdue?: boolean;
};

export const appealListInclude = {
  category: true,
  department: true,
  author: { include: { department: true } },
  assignee: { include: { department: true } },
  responsible: { include: { department: true } },
} satisfies Prisma.AppealInclude;

export type AppealListItem = Prisma.AppealGetPayload<{ include: typeof appealListInclude }>;

type ScopedUser = Pick<User, "id" | "role" | "departmentId">;

export function visibleWhere(user: ScopedUser): Prisma.AppealWhereInput {
  if (user.role === "admin") return {};
  if (user.role === "head" && user.departmentId) {
    return {
      OR: [
        { departmentId: user.departmentId },
        { authorId: user.id },
        { assigneeId: user.id },
        { subscriptions: { some: { userId: user.id } } },
      ],
    };
  }
  return {
    OR: [
      { authorId: user.id },
      { assigneeId: user.id },
      { subscriptions: { some: { userId: user.id } } },
    ],
  };
}

export function buildListWhere(user: ScopedUser, filters: ListFilters): Prisma.AppealWhereInput {
  const and: Prisma.AppealWhereInput[] = [visibleWhere(user)];

  if (filters.status) and.push({ status: filters.status });
  if (filters.categoryId) and.push({ categoryId: filters.categoryId });
  if (filters.departmentId) and.push({ departmentId: filters.departmentId });
  if (filters.type) and.push({ type: filters.type });
  if (filters.priority) and.push({ priority: filters.priority });

  if (filters.overdue) {
    and.push({
      deadline: { lt: new Date() },
      status: { in: ["review", "clarification", "in_work"] },
    });
  }

  if (filters.q) {
    const q = filters.q.trim();
    if (q) {
      and.push({
        OR: [
          { code: { contains: q } },
          { text: { contains: q } },
          { proposal: { contains: q } },
        ],
      });
    }
  }

  return { AND: and };
}

export async function listAppeals(user: ScopedUser, filters: ListFilters): Promise<AppealListItem[]> {
  return prisma.appeal.findMany({
    where: buildListWhere(user, filters),
    include: appealListInclude,
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
}

export async function getAppealForUser(id: string, user: ScopedUser) {
  return prisma.appeal.findFirst({
    where: { AND: [{ id }, visibleWhere(user)] },
    include: {
      ...appealListInclude,
      duplicateOf: { select: { id: true, code: true } },
      duplicates: { select: { id: true, code: true } },
      attachments: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
      history: {
        include: { actor: true },
        orderBy: { createdAt: "asc" },
      },
      rating: true,
    },
  });
}

export type AppealDetail = NonNullable<Awaited<ReturnType<typeof getAppealForUser>>>;

export function parseFilters(params: Record<string, string | string[] | undefined>): ListFilters {
  const value = (key: string) => {
    const raw = params[key];
    return typeof raw === "string" ? raw : "";
  };

  return {
    status: value("status") || undefined,
    categoryId: value("categoryId") || undefined,
    departmentId: value("departmentId") || undefined,
    type: value("type") || undefined,
    priority: value("priority") || undefined,
    q: value("q") || undefined,
    overdue: value("overdue") === "1",
  };
}
