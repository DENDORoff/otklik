import { PrismaClient } from "@prisma/client";

/**
 * Предел ожидания запроса к базе данных.
 *
 * Если база недоступна или зависла (холодный старт Neon, переполнение пула,
 * разрыв соединения), запрос должен закончиться ошибкой, а не «висеть» бесконечно:
 * иначе server action не отвечает, и кнопка в интерфейсе остаётся заблокированной.
 */
export const DB_TIMEOUT_MS = 10_000;

export class DbTimeoutError extends Error {
  constructor(operation: string) {
    super(`База данных не ответила вовремя: ${operation}.`);
    this.name = "DbTimeoutError";
  }
}

function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    name: "db-timeout",
    query: {
      $allModels: {
        $allOperations: async ({ model, operation, args, query }) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            return await Promise.race([
              query(args),
              new Promise<never>((_, reject) => {
                timer = setTimeout(
                  () => reject(new DbTimeoutError(`${model}.${operation}`)),
                  DB_TIMEOUT_MS,
                );
              }),
            ]);
          } finally {
            if (timer) clearTimeout(timer);
          }
        },
      },
    },
  });
}

export type PrismaClientExtended = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientExtended };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
