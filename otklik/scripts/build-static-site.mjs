/**
 * Сборка статического сайта для GitHub Pages.
 *
 * Полное приложение («Отклик») требует Node-сервера: Server Actions, база данных,
 * сессии. GitHub Pages умеет только статику, поэтому здесь собирается статический
 * снимок публичной части — лендинга и юридических страниц. Живое демо доступно
 * по адресу из переменной DEMO_URL, ссылки с лендинга ведут туда.
 *
 * Использование (после `npm run build`):
 *   BASE_PATH=/otklik DEMO_URL=https://example.nodeapp.net node scripts/build-static-site.mjs
 *
 * На выходе — папка `out/`, которую публикует GitHub Pages.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PORT = Number(process.env.STATIC_PORT || 4173);
const BASE = (process.env.BASE_PATH || "").replace(/\/$/, "");
const DEMO = (process.env.DEMO_URL || "").replace(/\/$/, "");
const OUT = path.resolve("out");

const ROUTES = [
  "/",
  "/legal/privacy",
  "/legal/terms",
  "/legal/consent",
  "/legal/cookies",
  "/legal/refund",
  "/legal/licenses",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return true;
    } catch {
      /* сервер ещё поднимается */
    }
    await sleep(500);
  }
  return false;
}

async function copyDir(from, to) {
  await fs.cp(from, to, { recursive: true });
}

/** Точка входа ссылок на приложение в статической сборке. */
function rewriteLinks(html) {
  if (!DEMO) return html;
  // ссылки на страницы приложения ведут на живое демо; служебные пути (_next) остаются локальными
  return html.replace(
    new RegExp(`(["'])${BASE}/(?!_next)`, "g"),
    `$1${DEMO}/`,
  );
}

async function main() {
  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });

  const server = spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    { env: { ...process.env, NODE_ENV: "production" }, stdio: "ignore" },
  );

  const origin = `http://127.0.0.1:${PORT}`;
  try {
    const ready = await waitForServer(`${origin}${BASE}/`);
    if (!ready) throw new Error("Сервер не поднялся");

    for (const route of ROUTES) {
      const response = await fetch(`${origin}${BASE}${route}`);
      if (!response.ok && response.status !== 404) {
        throw new Error(`${route} → ${response.status}`);
      }
      const html = rewriteLinks(await response.text());
      const target =
        route === "/" ? path.join(OUT, "index.html") : path.join(OUT, route.slice(1), "index.html");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, html, "utf8");
      console.log("страница:", route);
    }

    const notFound = await fetch(`${origin}${BASE}/page-does-not-exist`);
    await fs.writeFile(path.join(OUT, "404.html"), rewriteLinks(await notFound.text()), "utf8");

    // статика сборки.
    // GitHub Pages не публикует каталоги и файлы, имена которых начинаются с "_",
    // поэтому _next/static выкладывается как next/static, а ссылки в HTML и CSS
    // переписываются.
    await copyDir(path.resolve(".next/static"), path.join(OUT, "next/static"));
    await copyDir(path.resolve("public"), OUT);

    const rewriteStaticPaths = (text) =>
      text.split(`${BASE}/_next/static`).join(`${BASE}/next/static`).split("/_next/static").join("/next/static");

    const htmlFiles = [];
    const collectHtml = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) await collectHtml(full);
        else if (entry.name.endsWith(".html")) htmlFiles.push(full);
      }
    };
    await collectHtml(OUT);
    for (const file of htmlFiles) {
      const html = await fs.readFile(file, "utf8");
      await fs.writeFile(file, rewriteStaticPaths(html), "utf8");
    }

    // в CSS шрифты и картинки идут по абсолютному пути — с базовым путём их надо поправить
    const cssDir = path.join(OUT, "next/static/css");
    const files = await fs.readdir(cssDir).catch(() => []);
    for (const file of files.filter((name) => name.endsWith(".css"))) {
      const filePath = path.join(cssDir, file);
      const css = await fs.readFile(filePath, "utf8");
      await fs.writeFile(
        filePath,
        rewriteStaticPaths(css).split("url(/").join(`url(${BASE}/`),
        "utf8",
      );
    }

    console.log("готово:", OUT);
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
