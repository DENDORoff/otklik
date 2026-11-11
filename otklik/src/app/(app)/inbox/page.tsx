import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function InboxPage() {
  const user = await requireUser();

  const params = new URLSearchParams({ status: "new" });
  if (user.role === "head" && user.departmentId) {
    params.set("departmentId", user.departmentId);
  }

  redirect(`/appeals?${params.toString()}`);
}
