import type { Appeal, User } from "@prisma/client";

type ScopedUser = Pick<User, "id" | "role" | "departmentId">;
type ScopedAppeal = Pick<Appeal, "authorId" | "assigneeId" | "departmentId" | "responsibleId">;

export function isAdmin(user: ScopedUser): boolean {
  return user.role === "admin";
}

export function isAuthor(user: ScopedUser, appeal: ScopedAppeal): boolean {
  return appeal.authorId === user.id;
}

export function isAssignee(user: ScopedUser, appeal: ScopedAppeal): boolean {
  return appeal.assigneeId === user.id;
}

export function canManageAppeal(user: ScopedUser, appeal: ScopedAppeal): boolean {
  if (user.role === "admin") return true;
  if (user.role !== "head") return false;
  return appeal.departmentId === user.departmentId || appeal.responsibleId === user.id;
}
