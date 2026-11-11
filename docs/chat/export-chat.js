#!/usr/bin/env node
/**
 * Экспорт истории чата OpenCode в читаемую стенограмму и JSONL.
 *
 * Требуется Node.js 22.5+ (встроенный модуль node:sqlite).
 * Скрипт только читает локальную базу OpenCode, ничего не изменяет.
 *
 * Использование:
 *   node docs/chat/export-chat.js
 *
 * Переменные окружения (необязательно):
 *   CHAT_DB  — путь к opencode.db
 *              (по умолчанию %USERPROFILE%/.local/share/opencode/opencode.db)
 *   OUT_DIR  — куда писать ИСТОРИЯ-ЧАТА.md (по умолчанию корень репозитория)
 *   RAW_DIR  — куда писать JSONL (по умолчанию docs/chat)
 *
 * Что попадает в экспорт:
 *   - все реплики пользователя и ассистента;
 *   - вызовы инструментов: имя, вход, статус, результат (в JSONL — полностью);
 *   - автосохранения контекста (compaction);
 *   - служебные сообщения и reasoning-блоки модели опускаются.
 *
 * Приватность: домашние пути заменяются на %USERPROFILE%, коды устройства
 * и токены GitHub вырезаются. Перед публикацией всё равно проверьте diff.
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const repoRoot = path.resolve(__dirname, "..", "..");
const dbPath =
  process.env.CHAT_DB ||
  path.join(os.homedir(), ".local", "share", "opencode", "opencode.db");
const outDir = process.env.OUT_DIR || repoRoot;
const rawDir = process.env.RAW_DIR || __dirname;

if (!fs.existsSync(dbPath)) {
  console.error("Не найдена база OpenCode:", dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath, { readOnly: true });
const session = db
  .prepare("select * from session_v2 order by time_updated desc limit 1")
  .get();
if (!session) {
  console.error("В базе нет сессий.");
  process.exit(1);
}
const rows = db
  .prepare(
    "select seq, type, time_created, data from session_message where session_id = ? order by seq asc",
  )
  .all(session.id);

// --- обезличивание -------------------------------------------------------
function clean(s) {
  if (typeof s !== "string") return s;
  let out = s;
  out = out.replace(
    /C:[\\/]+Users[\\/]+(?:Cтудент|Студент|CD844~1)/gi,
    "%USERPROFILE%",
  );
  out = out.split("6B01-EE38").join("<код устройства>");
  out = out.replace(/gh[pousr]_[A-Za-z0-9]{20,}/g, "gh*_***");
  out = out.replace(/github_pat_[A-Za-z0-9_]{20,}/g, "github_pat_***");
  return out;
}

const oneLine = (s, n) => {
  const t = clean(String(s || "")).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

const fmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Almaty",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const stamp = (t) => fmt.format(new Date(t)).replace(",", " ·");

// --- сбор сообщений -------------------------------------------------------
const entries = [];
for (const r of rows) {
  const d = JSON.parse(r.data);

  if (r.type === "user") {
    entries.push({
      kind: "user",
      seq: r.seq,
      time: r.time_created,
      text: (d.text || "").replace(/^Attached file:.*$/gm, "").trim(),
      attachments: (d.metadata && d.metadata.attachments) || [],
    });
  } else if (r.type === "assistant") {
    const texts = [];
    const tools = [];
    for (const part of d.content || []) {
      if (part.type === "text" && part.text) texts.push(part.text);
      if (part.type === "tool") {
        const st = part.state || {};
        const content = (st.content || [])
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");
        tools.push({
          name: part.name || "tool",
          input: st.input || {},
          status: st.status || "?",
          exit: st.metadata && st.metadata.exit,
          output: content || "",
        });
      }
    }
    if (texts.length || tools.length) {
      entries.push({
        kind: "assistant",
        seq: r.seq,
        time: r.time_created,
        texts,
        tools,
      });
    }
  } else if (r.type === "compaction") {
    entries.push({
      kind: "compaction",
      seq: r.seq,
      time: r.time_created,
      summary: d.summary || "",
    });
  } else if (r.type === "synthetic") {
    const m = d.metadata || {};
    if (m.source === "shell") {
      entries.push({
        kind: "shell",
        seq: r.seq,
        time: r.time_created,
        command: d.description || "",
        state: m.state || "",
        exit: m.exit,
        text: d.text || "",
      });
    }
  }
}

// --- читаемая стенограмма -------------------------------------------------
const titles = {
  4: "Постановка задачи и приоритизация",
  103: "Структура отделов, сценарии обращений и схема БД",
  155: "Бренд: стиль modus-trade.kz и смена названия",
  252: "Выбор стека",
  1808: "История чата, GitHub и передача контекста",
  2016: "Где лежат инструкции для следующего агента",
  2028: "История текущего чата",
};

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function describeTool(t) {
  const i = t.input || {};
  let where;
  if (t.name === "shell") where = "`" + oneLine(i.command, 220) + "`";
  else if (t.name === "read" || t.name === "write" || t.name === "edit")
    where = "`" + oneLine(i.path, 160) + "`";
  else if (t.name === "grep")
    where =
      "`" +
      oneLine(i.pattern, 80) +
      "`" +
      (i.path ? " в `" + oneLine(i.path, 120) + "`" : "");
  else if (t.name === "glob") where = "`" + oneLine(i.pattern, 120) + "`";
  else if (t.name === "execute") where = "`" + oneLine(i.code, 180) + "`";
  else if (t.name === "question") where = "вопрос пользователю";
  else if (t.name === "webfetch") where = "`" + oneLine(i.url, 140) + "`";
  else if (t.name === "websearch") where = "`" + oneLine(i.query, 140) + "`";
  else if (t.name && t.name.startsWith("browser.")) where = "`" + t.name + "`";
  else where = "`" + oneLine(JSON.stringify(i), 160) + "`";

  const status =
    t.status === "completed"
      ? t.exit !== undefined
        ? `ok (exit ${t.exit})`
        : "ok"
      : t.status;
  const out = oneLine(t.output, 200);
  return `**${t.name}** ${where} → ${status}${out ? `: ${out}` : ""}`;
}

let section = 0;
const toc = [];
let md = "";

for (const e of entries) {
  if (e.kind === "user") {
    section++;
    const title = titles[e.seq] || oneLine(e.text, 70);
    toc.push(
      `${section}. [${title}](#${section}-${slug(title)}) — ${stamp(e.time)}`,
    );
    md += `\n---\n\n## ${section}. ${title}\n\n**Пользователь · ${stamp(e.time)}**\n\n`;
    md += clean(e.text).trim() + "\n";
    if (e.attachments.length) {
      md += `\nВложения:\n`;
      for (const a of e.attachments) md += `- \`${clean(a.name)}\`\n`;
    }
  } else if (e.kind === "assistant") {
    if (e.texts.length) {
      md += `\n**Ассистент · ${stamp(e.time)}**\n\n`;
      md += e.texts.map((t) => clean(t).trim()).join("\n\n") + "\n";
    }
    if (e.tools.length) {
      md += `\n<details><summary>Инструменты: ${e.tools.length} · ${stamp(e.time)}</summary>\n\n`;
      for (const t of e.tools) md += `- ${describeTool(t)}\n`;
      md += `\n</details>\n`;
    }
  } else if (e.kind === "compaction") {
    md += `\n### Конспект контекста (автосохранение) · ${stamp(e.time)}\n\n`;
    md += `<details><summary>Показать конспект</summary>\n\n${clean(e.summary).trim()}\n\n</details>\n`;
  } else if (e.kind === "shell") {
    const first = oneLine(e.text.replace(/<[^>]+>/g, " "), 160);
    md += `\n> ⚙ Фоновый процесс: ${e.state}${e.exit !== undefined ? `, код ${e.exit}` : ""}. ${first}\n`;
  }
}

const head = `# История чата — ${fmt.format(new Date(session.time_created)).split(",")[0]}

> Полная стенограмма рабочей сессии по проекту «Отклик».
> Источник: локальная база OpenCode, сессия \`${session.id}\` («${session.title}»).
> Период: ${stamp(session.time_created)} — ${stamp(session.time_updated)} (UTC+5).
> Сообщений в сессии: ${rows.length}; в стенограмме: ${entries.length}.
>
> Сохранены все реплики пользователя и ассистента. Вызовы инструментов свёрнуты
> до одной строки (команда/файл → результат), внутренние reasoning-блоки опущены.
> Полные тексты вызовов и результатов — в машиночитаемом архиве
> [\`docs/chat/2026-11-11-session.jsonl\`](docs/chat/2026-11-11-session.jsonl).
> Пути пользователя заменены на \`%USERPROFILE%\`, коды авторизации вырезаны.

**Стек сессии:** OpenCode, агент \`${session.agent}\`, модель \`big-pickle\` (opencode).
**Каталог проекта:** \`${session.directory.replace(/\//g, "\\")}\`.

## Оглавление

${toc.join("\n")}

## 0. Служебный контекст

Ниже — только диалог и действия. Инструкции окружения, обновления каталога
инструментов и автоматические конспекты контекста в оглавление не вынесены.
`;

md = head + md;
md += `\n---\n\n*Стенограмма выгружена ${new Date().toISOString()} из локальной базы OpenCode. `;
md += `Сообщения, появившиеся после экспорта, в файл не попадают.*\n`;

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "ИСТОРИЯ-ЧАТА.md"), md, "utf8");

// --- машиночитаемый архив -------------------------------------------------
const rawLines = [];
for (const e of entries) {
  if (e.kind === "user") {
    rawLines.push({
      seq: e.seq,
      role: "user",
      time: new Date(e.time).toISOString(),
      text: clean(e.text),
      attachments: e.attachments.map((a) => ({
        name: clean(a.name),
        mime: a.mime,
      })),
    });
  } else if (e.kind === "assistant") {
    rawLines.push({
      seq: e.seq,
      role: "assistant",
      time: new Date(e.time).toISOString(),
      texts: e.texts.map(clean),
      tools: e.tools.map((t) => ({
        name: t.name,
        status: t.status,
        exit: t.exit,
        input: JSON.parse(clean(JSON.stringify(t.input))),
        output: clean(t.output),
      })),
    });
  } else if (e.kind === "compaction") {
    rawLines.push({
      seq: e.seq,
      role: "compaction",
      time: new Date(e.time).toISOString(),
      summary: clean(e.summary),
    });
  } else if (e.kind === "shell") {
    rawLines.push({
      seq: e.seq,
      role: "shell",
      time: new Date(e.time).toISOString(),
      command: clean(e.command),
      state: e.state,
      exit: e.exit,
    });
  }
}

const rawPath = path.join(rawDir, "2026-11-11-session.jsonl");
fs.writeFileSync(
  rawPath,
  rawLines.map((l) => JSON.stringify(l)).join("\n") + "\n",
  "utf8",
);

console.log("markdown:", path.join(outDir, "ИСТОРИЯ-ЧАТА.md"));
console.log("jsonl:", rawPath);
console.log(
  "записей:",
  rawLines.length,
  "| реплик пользователя:",
  section,
  "| размер JSONL:",
  Math.round(fs.statSync(rawPath).size / 1024),
  "КБ",
);
