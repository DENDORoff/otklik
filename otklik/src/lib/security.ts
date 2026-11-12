import { headers } from "next/headers";
import { prisma } from "./db";

type Bucket = { count: number; resetAt: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Простой ограничитель в памяти процесса. Для одного демо-стенда этого достаточно;
 * в промышленной эксплуатации лимит выносится в Redis или БД.
 */
export function rateLimit(
  key: string,
  { limit, windowMs, blockMs = windowMs }: { limit: number; windowMs: number; blockMs?: number },
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt < now && bucket.blockedUntil < now) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + windowMs, blockedUntil: 0 };

  if (bucket.blockedUntil > now) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    bucket.blockedUntil = now + blockMs;
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockMs / 1000),
    };
  }

  buckets.set(key, bucket);
  return { allowed: true, remaining: Math.max(0, limit - bucket.count), retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return store.get("x-real-ip") ?? "unknown";
}

/** Запись в журнал безопасности. Ошибка журнала не должна ломать основное действие. */
export async function recordAudit(entry: {
  action: string;
  userId?: string | null;
  email?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    const store = await headers();
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId ?? null,
        email: entry.email?.slice(0, 200) ?? null,
        ip: (await getClientIp()).slice(0, 64),
        userAgent: (store.get("user-agent") ?? "").slice(0, 300) || null,
        meta: entry.meta ? JSON.stringify(entry.meta).slice(0, 2000) : null,
      },
    });
  } catch {
    // Журнал не должен блокировать работу пользователя.
  }
}

/** Проверка загружаемого файла: расширение, MIME и сигнатура. */
export const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "txt",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "odt",
  "ods",
]);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/octet-stream",
]);

export function validateUploadName(fileName: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Формат файла не поддерживается. Разрешены PDF, изображения, TXT, CSV, DOC(X), XLS(X), ODT/ODS.";
  }
  return null;
}

export function validateUploadMime(mime: string): string | null {
  if (!mime) return null;
  if (!ALLOWED_MIME.has(mime)) {
    return "Тип файла не разрешён. Загрузите документ или изображение.";
  }
  return null;
}

/**
 * Проверка сигнатуры для самых опасных форматов. Для офисных документов
 * сигнатура ZIP (PK) допустима; исполняемые файлы отсекаются по расширению и MIME.
 */
export function validateUploadSignature(bytes: Uint8Array): string | null {
  const startsWith = (signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);

  if (startsWith([0x4d, 0x5a])) return "Исполняемые файлы запрещены.";
  if (startsWith([0x7f, 0x45, 0x4c, 0x46])) return "Исполняемые файлы запрещены.";
  if (startsWith([0x23, 0x21])) return "Скрипты запрещены.";
  return null;
}

export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120) || "file";
}
