/**
 * Генерация схемы для PostgreSQL из основной схемы SQLite.
 *
 * Модели у «Отклика» переносимы между провайдерами (типы — строки, enum’ов нет),
 * поэтому для деплоя на Vercel нужен только другой datasource-провайдер.
 * Файл собирается автоматически, чтобы основная схема осталась единственным
 * источником правды.
 *
 *   node scripts/generate-postgres-schema.mjs
 */
import fs from "node:fs";
import path from "node:path";

const source = path.resolve("prisma/schema.prisma");
const target = path.resolve("prisma/schema.postgres.prisma");

const src = fs.readFileSync(source, "utf8");

const header = `// СГЕНЕРИРОВАНО АВТОМАТИЧЕСКИ: node scripts/generate-postgres-schema.mjs
// Не редактировать вручную — правьте prisma/schema.prisma и перегенерируйте.
// Вариант схемы для PostgreSQL (Vercel, Neon, Supabase): та же модель данных,
// другой datasource-провайдер и миграция prisma/migrations/0_init.
`;

const out = src
  .replace(/^\/\/ Схема БД[\s\S]*?^$/m, "")
  .replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"')
  .replace(/^generator client \{[\s\S]*?^\}/m, `generator client {
  provider = "prisma-client-js"
}`);

fs.writeFileSync(target, header + out, "utf8");
console.log("сгенерировано:", target);
