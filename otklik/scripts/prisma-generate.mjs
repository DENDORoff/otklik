/**
 * Генерация Prisma-клиента под нужного провайдера БД.
 *
 * Локально — SQLite (prisma/schema.prisma), на Vercel — PostgreSQL
 * (prisma/schema.postgres.prisma). Скрипт вызывается в postinstall,
 * чтобы клиент всегда соответствовал схеме, с которой работает приложение.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const provider = process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite";
const schema =
  provider === "postgresql" ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";

console.log(`prisma generate: провайдер ${provider}, схема ${schema}`);

const result = spawnSync(
  process.execPath,
  [path.join("node_modules", "prisma", "build", "index.js"), "generate", "--schema", schema],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
