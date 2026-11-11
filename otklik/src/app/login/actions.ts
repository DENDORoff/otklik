"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

async function findValidUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const user = await findValidUser(email, password);
  if (!user) redirect("/login?error=credentials");

  await createSession(user.id);
  redirect("/appeals");
}

export async function quickLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const user = await findValidUser(email, "demo1234");
  if (!user) redirect("/login?error=demo");

  await createSession(user.id);
  redirect("/appeals");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
