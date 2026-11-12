"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { getClientIp, rateLimit, recordAudit, resetRateLimit } from "@/lib/security";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

async function markConsent(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId, consentVersion: null },
    data: { consentVersion: COMPANY.consentVersion, consentAt: new Date() },
  });
}

async function findValidUser(email: string, password: string) {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) return null;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return null;

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  return valid ? user : null;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await getClientIp();

  // Лимит на пару «IP + почта»: 5 неудач за 15 минут, затем блокировка на 15 минут.
  const key = `login:${ip}:${email.slice(0, 200)}`;
  const limit = rateLimit(key, { limit: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 });
  if (!limit.allowed) {
    await recordAudit({ action: "auth.blocked", email, meta: { ip } });
    redirect(`/login?error=rate&retry=${limit.retryAfterSeconds}`);
  }

  const user = await findValidUser(email, password);
  if (!user) {
    await recordAudit({ action: "auth.failed", email, meta: { attemptsLeft: limit.remaining } });
    redirect(`/login?error=credentials&left=${limit.remaining}`);
  }

  resetRateLimit(key);
  await recordAudit({ action: "auth.success", userId: user.id, email: user.email });
  await markConsent(user.id);
  await createSession(user.id);
  redirect("/appeals");
}

export async function quickLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = await getClientIp();
  const limit = rateLimit(`quick:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) redirect("/login?error=rate&retry=600");

  const user = await findValidUser(email, "demo1234");
  if (!user) redirect("/login?error=demo");

  await recordAudit({ action: "auth.quick_login", userId: user.id, email: user.email });
  await markConsent(user.id);
  await createSession(user.id);
  redirect("/appeals");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
