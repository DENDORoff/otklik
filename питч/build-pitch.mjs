/**
 * Генератор питч-презентации «Отклик» (.pptx).
 * Данные — из документов репозитория (ОТЧЁТ, ТЕХНИЧЕСКАЯ-КОНЦЕПЦИЯ, ИСТОРИЯ-РАБОТЫ,
 * ДИЗАЙН-КОД, КОНЦЕПЦИЯ). Фирменный стиль: #082742 / #ED1111 / Montserrat.
 *
 * Запуск: node build-pitch.mjs  (из папки `питч/`, где установлен pptxgenjs)
 * Результат: ../ПИТЧ-ПРЕЗЕНТАЦИЯ.pptx
 */
import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SHOT = (name) => path.join(ROOT, "screenshots", name);
const OUT = path.join(ROOT, "ПИТЧ-ПРЕЗЕНТАЦИЯ.pptx");

const NAVY = "082742";
const RED = "ED1111";
const RED_ACTION = "E10F0F";
const RED_DARK = "C00000";
const GRAPHITE = "323A47";
const MUTED = "64748D";
const LINE = "D1D5DD";
const SOFT = "F4F4F4";
const INFO = "EFF6FD";
const WHITE = "FFFFFF";
const CARD = "141F2B";
const CARD_LINE = "2A3848";
const GOOD = "198754";

const F = { name: "Montserrat", head: "Montserrat" };

const pptx = new pptxgen();
pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
pptx.layout = "W16x9";
pptx.author = "Hackathon Team";
pptx.company = "ГК «Модус Трейд»";
pptx.title = "Отклик — питч для жюри";
pptx.lang = "ru-RU";

const TOTAL = 16;

/** Фирменный знак: линза/глаз + красная точка. */
function logo(slide, { x, y, scale = 1, onDark = true } = {}) {
  const ink = onDark ? WHITE : NAVY;
  const w = 0.92 * scale;
  const h = 0.5 * scale;
  slide.addShape("blockArc", {
    x, y, w, h,
    fill: { color: ink, transparency: 100 },
    line: { color: ink, width: 2.4 * scale },
    angleRange: [180, 360],
  });
  slide.addShape("blockArc", {
    x, y: y + 0.5 * scale, w, h,
    fill: { color: ink, transparency: 100 },
    line: { color: ink, width: 2.4 * scale },
    angleRange: [0, 180],
  });
  slide.addShape("ellipse", {
    x: x + w / 2 - 0.11 * scale,
    y: y + 0.34 * scale,
    w: 0.22 * scale,
    h: 0.22 * scale,
    fill: { color: RED },
    line: { color: RED },
  });
}

/** Шапка страницы со знаком и номером слайда. */
function chrome(slide, page, label) {
  logo(slide, { x: 0.55, y: 0.32, scale: 0.42, onDark: false });
  slide.addText("отклик", {
    x: 1.08, y: 0.34, w: 2.2, h: 0.3,
    fontFace: F.name, fontSize: 13, bold: true, color: NAVY, align: "left",
  });
  slide.addText(label, {
    x: 7.4, y: 0.36, w: 4.6, h: 0.28,
    fontFace: F.name, fontSize: 8.5, bold: true, color: MUTED,
    align: "right", charSpacing: 1.6,
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: 12.35, y: 0.34, w: 0.55, h: 0.3,
    fontFace: F.name, fontSize: 12, bold: true, color: RED, align: "right",
  });
  slide.addShape("line", { x: 0.55, y: 0.78, w: 12.23, h: 0, line: { color: LINE, width: 0.75 } });
}

function footer(slide, page, text) {
  slide.addText(text, {
    x: 0.55, y: 7.04, w: 9.6, h: 0.3,
    fontFace: F.name, fontSize: 8, color: MUTED,
  });
  slide.addText("ГК «Модус Трейд» · Хакатон 2026", {
    x: 9.6, y: 7.04, w: 3.2, h: 0.3,
    fontFace: F.name, fontSize: 8, color: MUTED, align: "right",
  });
}

function label(slide, text, { y = 0.98, x = 0.55 } = {}) {
  slide.addText(text.toUpperCase(), {
    x, y, w: 6, h: 0.26,
    fontFace: F.name, fontSize: 9, bold: true, color: RED, charSpacing: 1.8,
  });
}

function h1(slide, text, { y = 1.24, size = 26, x = 0.55, w = 12.2, color = NAVY } = {}) {
  slide.addText(text, {
    x, y, w, h: 0.85,
    fontFace: F.head, fontSize: size, bold: true, color,
    lineSpacingMultiple: 1.05,
  });
}

/** Небольшой блок-карточка. */
function card(slide, { x, y, w, h, fill = WHITE, line = LINE, radius = 0.06 }) {
  slide.addShape("roundRect", {
    x, y, w, h, rectRadius: radius,
    fill: { color: fill },
    line: { color: line, width: 1 },
  });
}

function notes(slide, text) {
  if (text) slide.addNotes(text);
}

/* ====================== Слайд 1. Титул ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  // декоративные дуги
  s.addShape("ellipse", { x: 9.4, y: -2.1, w: 5.4, h: 5.4, fill: { color: NAVY, transparency: 100 }, line: { color: "123A54", width: 1.25 } });
  s.addShape("ellipse", { x: 10.6, y: -0.9, w: 3.0, h: 3.0, fill: { color: NAVY, transparency: 100 }, line: { color: RED, width: 1.25, dashType: "solid" } });

  logo(s, { x: 0.75, y: 0.7, scale: 1.0, onDark: true });
  s.addText("отклик", {
    x: 2.05, y: 0.79, w: 3.4, h: 0.6,
    fontFace: F.head, fontSize: 30, bold: true, color: WHITE,
  });

  s.addText("ХАКАТОН ГК «МОДУС ТРЕЙД» · НОЯБРЬ 2026", {
    x: 0.78, y: 2.15, w: 8, h: 0.3,
    fontFace: F.name, fontSize: 10, bold: true, color: "9AA9BC", charSpacing: 2.2,
  });

  s.addText([
    { text: "Каждый отклик —\n", options: {} },
    { text: "до результата.", options: { color: RED } },
  ], {
    x: 0.75, y: 2.5, w: 9.6, h: 1.8,
    fontFace: F.head, fontSize: 54, bold: true, color: WHITE,
    lineSpacingMultiple: 1.0, align: "left",
  });

  s.addText("«Отклик» — внутренняя система обратной связи и предложений сотрудников:\nот подачи обращения до внедрённого улучшения и оценки автора.", {
    x: 0.78, y: 4.35, w: 8.6, h: 0.85,
    fontFace: F.name, fontSize: 15, color: "D6DEE8", lineSpacingMultiple: 1.15,
  });

  // CTA-плашка
  s.addShape("roundRect", { x: 0.78, y: 5.45, w: 4.6, h: 0.62, rectRadius: 0.07, fill: { color: RED_ACTION }, line: { color: RED_ACTION } });
  s.addText("ОТКРЫТЬ РЕПОЗИТОРИЙ  →", {
    x: 0.78, y: 5.45, w: 4.6, h: 0.62,
    fontFace: F.name, fontSize: 12, bold: true, color: WHITE,
    align: "center", valign: "middle", charSpacing: 1.4,
  });
  s.addText("github.com/DENDORoff/otklik", {
    x: 5.55, y: 5.45, w: 4.2, h: 0.62,
    fontFace: F.name, fontSize: 11.5, color: "9AA9BC", valign: "middle",
  });

  s.addText("Запуск за 5 минут: npm install → npm run db:reset → npm run build → http://localhost:3000", {
    x: 0.78, y: 6.35, w: 11.8, h: 0.3,
    fontFace: F.name, fontSize: 9, color: "64748D",
  });
  s.addText("01", { x: 12.45, y: 6.95, w: 0.5, h: 0.35, fontFace: F.name, fontSize: 13, bold: true, color: RED, align: "right" });
  notes(s, "«Каждый отклик — до результата». Название продукта — «Отклик», «Сигнал» не используем по условиям хакатона. Проект — портфолио; данные синтетические; запуск локальный.");
}

/* ====================== Слайд 2. Проблема ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 2, "ПРОБЛЕМА");
  label(s, "Почему это важно");
  h1(s, "Компания не слышит сотрудников", { y: 1.22, size: 30 });

  const pains = [
    ["Идеи уходят в чаты", "Обращение тонет в переписке: нет номера, истории и того, кто обязан ответить."],
    ["Нет владельца и срока", "Непонятно, кто ведёт обращение, в каком оно статусе и когда будет итог."],
    ["Руководитель слеп", "Поток обращений и повторяющиеся темы не видны никому — проблемы повторяются."],
    ["Эффект не считается", "Внедрённые улучшения не фиксируются, их отдача не попадает в цифры."],
  ];
  pains.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.55 + col * 6.35, y = 2.15 + row * 1.42;
    card(s, { x, y, w: 5.95, h: 1.26, fill: SOFT, line: "E5E5E5" });
    s.addShape("rect", { x, y: y + 0.18, w: 0.07, h: 0.9, fill: { color: RED }, line: { color: RED } });
    s.addText(t, { x: x + 0.28, y: y + 0.12, w: 5.4, h: 0.3, fontFace: F.name, fontSize: 14, bold: true, color: NAVY });
    s.addText(d, { x: x + 0.28, y: y + 0.42, w: 5.4, h: 0.72, fontFace: F.name, fontSize: 10.5, color: GRAPHITE, lineSpacingMultiple: 1.15 });
  });

  s.addShape("roundRect", { x: 0.55, y: 5.15, w: 12.25, h: 1.0, rectRadius: 0.06, fill: { color: INFO }, line: { color: "2F80ED", width: 1 } });
  s.addText([
    { text: "Цена вопроса — не только время. ", options: { bold: true, color: NAVY } },
    { text: "Компания теряет решения, которые уже созрели внутри: их некому довести до внедрения.", options: { color: GRAPHITE } },
  ], {
    x: 0.85, y: 5.15, w: 11.7, h: 1.0,
    fontFace: F.name, fontSize: 12.5, valign: "middle",
  });

  footer(s, 2, "Источник проблематики — ТЗ п. 1.3 и датасет обращений");
  notes(s, "Говорим о цене: идеи теряются не потому, что сотрудники молчат, а потому что нет процесса.");
}

/* ====================== Слайд 3. Решение ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 3, "РЕШЕНИЕ");
  label(s, "Что мы сделали");
  h1(s, "Замкнутый контур вместо переписки", { y: 1.2, size: 30 });

  // Схема процесса
  const steps = [
    ["Подача", "3 шага, категория"],
    ["Маршрутизация", "категория → отдел"],
    ["Начальник", "принять, срок"],
    ["Исполнитель", "итог и действия"],
    ["Оценка автора", "1–5"],
    ["Аналитика", "метрики и дубли"],
  ];
  const sw = 1.72, gap = 0.19, totalW = steps.length * sw + (steps.length - 1) * gap;
  let x = (13.333 - totalW) / 2;
  steps.forEach(([t, d], i) => {
    s.addShape("roundRect", { x, y: 2.15, w: sw, h: 0.95, rectRadius: 0.06, fill: { color: i % 2 ? NAVY : "FFFFFF" }, line: { color: i % 2 ? NAVY : LINE, width: 1.25 } });
    s.addText(t, { x: x + 0.08, y: 2.25, w: sw - 0.16, h: 0.4, fontFace: F.name, fontSize: 10.5, bold: true, color: i % 2 ? WHITE : NAVY, align: "center" });
    s.addText(d, { x: x + 0.08, y: 2.62, w: sw - 0.16, h: 0.35, fontFace: F.name, fontSize: 7.5, color: i % 2 ? "C9D4E0" : MUTED, align: "center" });
    if (i < steps.length - 1) {
      s.addText("→", { x: x + sw - 0.06, y: 2.24, w: gap + 0.14, h: 0.6, fontFace: F.name, fontSize: 15, bold: true, color: RED, align: "center" });
    }
    x += sw + gap;
  });

  // Жизненный цикл
  s.addText("Жизненный цикл обращения", {
    x: 0.55, y: 3.35, w: 6, h: 0.3,
    fontFace: F.name, fontSize: 10, bold: true, color: MUTED, charSpacing: 1.2,
  });
  const life = ["Новое", "На рассмотрении", "Ожидает уточнения", "В работе", "Реализовано", "Закрыто"];
  const lifeAlt = ["Отклонено", "Дубликат"];
  let lx = 0.55;
  life.forEach((t, i) => {
    const w = Math.max(1.05, t.length * 0.088 + 0.28);
    s.addShape("roundRect", { x: lx, y: 3.72, w, h: 0.38, rectRadius: 0.19, fill: { color: i === life.length - 1 ? NAVY : "EEF2F7" }, line: { color: i === life.length - 1 ? NAVY : "D8DEE7" } });
    s.addText(t, { x: lx, y: 3.72, w, h: 0.38, fontFace: F.name, fontSize: 9.5, bold: i === life.length - 1, color: i === life.length - 1 ? WHITE : GRAPHITE, align: "center", valign: "middle" });
    if (i < life.length - 1) {
      s.addText("→", { x: lx + w - 0.02, y: 3.74, w: 0.28, h: 0.34, fontSize: 11, bold: true, color: MUTED, align: "center" });
    }
    lx += w + 0.27;
  });
  s.addText("альтернативы: " + lifeAlt.join(" · "), {
    x: 0.55, y: 4.18, w: 6, h: 0.28, fontFace: F.name, fontSize: 9, color: MUTED,
  });

  // Роли
  const roles = [
    ["Сотрудник", "подаёт, отвечает на уточнения, оценивает итог 1–5"],
    ["Начальник отдела", "принимает, назначает исполнителя и срок, перенаправляет"],
    ["Администратор", "справочники, правила, очередь «Неназначенные», аналитика"],
  ];
  roles.forEach(([t, d], i) => {
    const x = 0.55 + i * 4.18;
    card(s, { x, y: 4.55, w: 3.95, h: 1.05, fill: WHITE, line: LINE });
    s.addText(t, { x: x + 0.18, y: 4.63, w: 3.6, h: 0.3, fontFace: F.name, fontSize: 11.5, bold: true, color: NAVY });
    s.addText(d, { x: x + 0.18, y: 4.92, w: 3.6, h: 0.62, fontFace: F.name, fontSize: 9, color: GRAPHITE, lineSpacingMultiple: 1.15 });
  });

  s.addText("Не ещё один корпоративный чат. Процесс с ответственным, сроком и измеримым итогом.", {
    x: 0.55, y: 6.62, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 11, bold: true, italic: true, color: RED,
  });

  footer(s, 3, "Полный жизненный цикл и возвраты — в КОНЦЕПЦИЯ.md §3–4");
  notes(s, "Слева направо: сотрудник, система, начальник, исполнитель, автор. Обращение заканчивается только оценкой автора.");
}

/* ====================== Слайд 4. Демо за 5 минут ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 4, "КАК ЭТО РАБОТАЕТ");
  label(s, "Демо за 5 минут");
  h1(s, "Кликаешь — и обращение идёт в работу", { y: 1.2, size: 28 });

  const steps = [
    ["01", "Сотрудник подаёт проблему", "тип + категория, описание, файл, согласие — 3 шага мастера"],
    ["02", "Система подсказывает похожие", "дубли отсекаются на входе, а не после назначения"],
    ["03", "Правило «категория → отдел»", "обращение само получает отдел-получатель"],
    ["04", "Начальник принимает", "назначает исполнителя и дедлайн по SLA"],
    ["05", "Исполнитель фиксирует итог", "что сделано + предпринятые действия"],
    ["06", "Автор оценивает 1–5", "оценка закрывает обращение и идёт в аналитику"],
  ];
  steps.forEach(([num, t, d], i) => {
    const y = 2.1 + i * 0.72;
    card(s, { x: 0.55, y, w: 8.15, h: 0.62, fill: i % 2 ? WHITE : SOFT, line: "E5E5E5" });
    s.addText(num, { x: 0.68, y: y + 0.06, w: 0.6, h: 0.44, fontFace: F.head, fontSize: 17, bold: true, color: RED });
    s.addText(t, { x: 1.35, y: y + 0.055, w: 4.4, h: 0.28, fontFace: F.name, fontSize: 11, bold: true, color: NAVY });
    s.addText(d, { x: 1.35, y: y + 0.28, w: 6.9, h: 0.26, fontFace: F.name, fontSize: 8.5, color: MUTED });
  });

  // Скриншот экрана входа
  s.addShape("roundRect", { x: 8.95, y: 2.1, w: 3.85, h: 4.6, rectRadius: 0.08, fill: { color: NAVY }, line: { color: NAVY } });
  s.addImage({ path: SHOT("01-login.jpeg"), x: 9.15, y: 2.28, w: 3.45, h: 3.15, sizing: { type: "cover", w: 3.45, h: 3.15 } });
  s.addText("Экран входа: все 7 отделов, быстрый вход для каждого", {
    x: 9.13, y: 5.5, w: 3.5, h: 0.35,
    fontFace: F.name, fontSize: 8.5, bold: true, color: WHITE, align: "center",
  });
  s.addText("admin@otklik.local · demo1234", {
    x: 9.13, y: 5.85, w: 3.5, h: 0.3,
    fontFace: F.name, fontSize: 8, color: "9AA9BC", align: "center",
  });

  s.addText("Как запустить: npm install → npm run db:reset → npm run build → npm run start", {
    x: 0.55, y: 6.6, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 10.5, bold: true, color: NAVY,
  });
  footer(s, 4, "Сценарии прогона — ДЕМО-СЦЕНАРИЙ.md");
  notes(s, "Нажимаем «Сотрудник — Закупки» на логине и даём подать обращение из категории «Документооборот». Ещё 40 секунд — и оно у начальника.");
}

/* ====================== Слайд 5. Уникальные реализации ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  s.addText("УНИКАЛЬНЫЕ РЕАЛИЗАЦИИ", {
    x: 0.55, y: 0.38, w: 6, h: 0.28,
    fontFace: F.name, fontSize: 9, bold: true, color: "FF6B6B", charSpacing: 2,
  });
  s.addText("Не форма и не чат.\nСистема, которую можно внедрить.", {
    x: 0.55, y: 0.72, w: 12.2, h: 1.25,
    fontFace: F.head, fontSize: 29, bold: true, color: WHITE, lineSpacingMultiple: 1.05,
  });

  const items = [
    ["01", "Структура компании — данные, а не код",
      "Отделы, категории и правила «категория → отдел» — записи в БД. Админ меняет правило — новое обращение той же категории уходит в другой отдел. Без релиза и без программиста."],
    ["02", "«Неназначенные» вместо потери",
      "Правила нет — обращение попадает в очередь администратора + уведомление. Оно не теряется, а эскалируется. Лимит перенаправлений — 3, дальше эскалация админу."],
    ["03", "Дубли отсекаются на входе",
      "«Похожие обращения» при создании; счётчик дубликатов по категориям = повторяющиеся проблемы. Руководитель видит, что чинить нужно системно."],
    ["04", "Замкнутый контур, а не поток жалоб",
      "Обращение закрывает только автор — оценкой 1–5. Оценка идёт в аналитику: измеряем не количество жалоб, а доведённые до результата улучшения."],
    ["05", "Права — на сервере, не в интерфейсе",
      "Проверки в Server Actions, не в UI: чужое обращение по прямой ссылке → 404. Видимость: автор — свои, начальник — свой отдел, админ — все."],
    ["06", "Реально работает, а не макет",
      "24 маршрута, 21 обращение из датасета, светлая и тёмная темы, RU/EN/KZ, WCAG 2.1 AA — 0 нарушений, схема PostgreSQL с миграцией и сидом."],
  ];
  items.forEach(([n, t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.55 + col * 6.42, y = 2.18 + row * 1.32;
    card(s, { x, y, w: 6.05, h: 1.18, fill: CARD, line: CARD_LINE, radius: 0.07 });
    s.addText(n, { x: x + 0.18, y: y + 0.1, w: 0.65, h: 0.45, fontFace: F.head, fontSize: 19, bold: true, color: RED });
    s.addText(t, { x: x + 0.85, y: y + 0.12, w: 5.05, h: 0.28, fontFace: F.name, fontSize: 11.5, bold: true, color: WHITE });
    s.addText(d, { x: x + 0.85, y: y + 0.38, w: 5.05, h: 0.72, fontFace: F.name, fontSize: 8.3, color: "AEBECD", lineSpacingMultiple: 1.12 });
  });

  s.addText("Структура компании — это данные, а не код.", {
    x: 0.55, y: 6.28, w: 12.2, h: 0.35,
    fontFace: F.name, fontSize: 13, bold: true, italic: true, color: "FF6B6B", align: "center",
  });
  s.addText("05", { x: 12.45, y: 6.98, w: 0.5, h: 0.3, fontFace: F.name, fontSize: 12, bold: true, color: RED, align: "right" });
  notes(s, "Ключевой бит демо: админ меняет правило маршрутизации — новое обращение той же категории уже уходит в другой отдел. Структура изменилась без изменения кода.");
}

/* ====================== Слайд 6. Стек и почему ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 6, "СТЕК И ПОЧЕМУ");
  label(s, "Технические решения");
  h1(s, "Осознанный стек, без лишнего", { y: 1.2, size: 28 });

  const rows = [
    [{ text: "Слой", options: { bold: true, color: WHITE, fill: { color: NAVY } } }, { text: "Технология", options: { bold: true, color: WHITE, fill: { color: NAVY } } }, { text: "Почему так", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
    ["Фреймворк", "Next.js 15 · React 19", "Server Components + Server Actions: права и валидация на сервере, без отдельного REST-слоя. First Load JS ~103 кБ"],
    ["Язык", "TypeScript 6", "ошибки на этапе компиляции; TS 7 ломает цепочку — намеренно не обновляем"],
    ["База данных", "Prisma 6 · SQLite → PostgreSQL", "одна схема: локально файл, в бою — любой managed-Postgres; переход одной переменной"],
    ["Авторизация", "jose · JWT в httpOnly-cookie · bcryptjs", "подписанная сессия, sameSite=lax, ноль внешних сервисов"],
    ["Валидация", "zod", "на каждой форме и каждом Server Action, схема — единый источник прав"],
    ["Стили", "Tailwind 3 · Montserrat (self-host, SIL OFL)", "фирменный стиль ГК «Модус Трейд»; без внешних запросов к Google Fonts"],
    ["Инфраструктура", "Vercel + PostgreSQL (например, Neon)", "serverless; автодеплой из main; Neon — один из вариантов, не привязка"],
  ];
  s.addTable(rows, {
    x: 0.55, y: 1.95, w: 12.25, h: 3.6,
    colW: [1.75, 4.1, 6.4],
    rowH: [0.42, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44],
    fontFace: F.name, fontSize: 8.2, color: GRAPHITE,
    border: { type: "solid", color: LINE, pt: 0.5 },
    valign: "middle", margin: [2, 6, 2, 6],
  });

  s.addShape("roundRect", { x: 0.55, y: 5.72, w: 12.25, h: 0.95, rectRadius: 0.06, fill: { color: SOFT }, line: { color: "E5E5E5" } });
  s.addText([
    { text: "MVP не перегружен: ", options: { bold: true, color: NAVY } },
    { text: "один процесс, одна БД, ноль внешних сервисов на демо. Почему не Next 16 / Prisma 7 — следующий слайд.", options: { color: GRAPHITE } },
  ], {
    x: 0.8, y: 5.72, w: 11.8, h: 0.95,
    fontFace: F.name, fontSize: 11.5, valign: "middle", lineSpacingMultiple: 1.1,
  });

  footer(s, 6, "Стек и обоснование — ТЕХНИЧЕСКАЯ-КОНЦЕПЦИЯ.md §7–9");
  notes(s, "Главный вопрос жюри. Коротко: Next.js — Server Actions вместо API; Prisma — одна схема на SQLite и PostgreSQL; отказ от мажорных обновлений до стабилизации.");
}

/* ====================== Слайд 7. Безопасность: аудит закрыт ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 7, "БЕЗОПАСНОСТЬ");
  label(s, "Безопасность и данные");
  h1(s, "Данные закрыты по роли, а не «пара ролей»", { y: 1.18, size: 27 });

  const hardening = [
    "bcrypt + JWT в httpOnly-cookie (sameSite=lax), срок 7 дней",
    "Лимит 5 попыток / 15 мин, rate limit на вход и формы",
    "Права проверяются на сервере в каждом Server Action",
    "CSP, X-Frame-Options: DENY, nosniff, HSTS, Referrer-Policy",
    "Проверка загрузок: размер, MIME, сигнатура, без скриптов",
    "Согласие на ПДн, запрос на доступ / удаление данных",
    "Журнал безопасности: входы, правила, ПДн, CSV-выгрузка",
    ".env, БД и uploads вне Git; чужое обращение → 404",
  ];
  s.addText("Что сделано", {
    x: 0.55, y: 2.0, w: 5, h: 0.3,
    fontFace: F.name, fontSize: 10, bold: true, color: MUTED, charSpacing: 1.2,
  });
  hardening.forEach((t, i) => {
    const y = 2.34 + i * 0.415;
    s.addText("✓", { x: 0.55, y, w: 0.3, h: 0.32, fontFace: F.name, fontSize: 12, bold: true, color: GOOD });
    s.addText(t, { x: 0.9, y: y + 0.015, w: 5.35, h: 0.38, fontFace: F.name, fontSize: 8.6, color: GRAPHITE, lineSpacingMultiple: 1.05 });
  });

  // Карточка «npm audit: 9 → 0»
  card(s, { x: 6.6, y: 2.0, w: 6.2, h: 4.15, fill: NAVY, line: NAVY, radius: 0.08 });
  s.addText("АУДИТ ЗАВИСИМОСТЕЙ", {
    x: 6.85, y: 2.12, w: 6, h: 0.28,
    fontFace: F.name, fontSize: 8.5, bold: true, color: "9AA9BC", charSpacing: 1.6,
  });
  s.addText([
    { text: "9 → 0", options: { bold: true, color: WHITE, fontSize: 42 } },
    { text: " уязвимостей", options: { color: "C9D4E0", fontSize: 15 } },
  ], { x: 6.85, y: 2.4, w: 5.8, h: 0.85, fontFace: F.head, valign: "middle" });
  s.addText("8 высоких · была 1 умеренная → сегодня: found 0 vulnerabilities", {
    x: 6.85, y: 3.25, w: 5.7, h: 0.3, fontFace: F.name, fontSize: 9, color: "FF6B6B",
  });

  const auditRows = [
    ["Уязвимость", "Откуда", "Исправление"],
    ["postcss 8.4.31\n4 advisory", "next (build-time)", "override → 8.5.32"],
    ["deepmerge-ts 7.1.5\nGHSA-ggr8-5vv4-36mx", "prisma CLI", "override → 8.0.2"],
    ["zod 4.1.11\nGHSA-mrhx-c7xc-m3w5", "@vercel/blob", "override → 4.6.7"],
  ];
  const bodyRows = auditRows.slice(1).map((r) => [
    { text: r[0], options: { fontSize: 7.6, color: WHITE, fill: { color: CARD } } },
    { text: r[1], options: { fontSize: 7.6, color: "C9D4E0", fill: { color: CARD }, align: "left" } },
    { text: r[2], options: { fontSize: 7.6, color: "7FE3B0", fill: { color: CARD }, align: "left" } },
  ]);
  s.addTable(
    [
      auditRows[0].map((t) => ({ text: t, options: { bold: true, fontSize: 7.6, color: "082742", fill: { color: "FFFFFF" } } })),
      ...bodyRows,
    ],
    {
      x: 6.85, y: 3.62, w: 5.7, h: 1.85,
      colW: [2.15, 1.75, 1.8],
      rowH: [0.34, 0.5, 0.5, 0.5],
      fontFace: F.name, border: { type: "solid", color: CARD_LINE, pt: 0.5 },
      valign: "middle", margin: [2, 5, 2, 5],
    },
  );
  s.addText("CSS собран байт-в-байт идентично — тот же SHA-256. Мажорные версии стека не тронуты.", {
    x: 6.85, y: 5.48, w: 5.7, h: 0.45,
    fontFace: F.name, fontSize: 8, color: "9AA9BC", lineSpacingMultiple: 1.15,
  });

  s.addText("Данные — только синтетические из датасета. Реальные сведения компании не используются.", {
    x: 0.55, y: 6.42, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 9.5, color: MUTED,
  });
  footer(s, 7, "Разбор advisory и достижимости — ТЕХНИЧЕСКАЯ-КОНЦЕПЦИЯ.md §7.1");
  notes(s, "Если спросят «а что с уязвимостями»: три транзитивные зависимости, закрыты точечными overrides без замены Next и Prisma. CSS — идентичный по SHA-256.");
}

/* ====================== Слайд 8. Надёжность: кнопки не зависают ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 8, "НАДЁЖНОСТЬ");
  label(s, "Отказоустойчивость");
  h1(s, "«Зависающие» загрузки закрыты", { y: 1.18, size: 28 });

  // Было / Стало
  s.addText("БЫЛО", { x: 0.55, y: 2.02, w: 3, h: 0.3, fontFace: F.name, fontSize: 9, bold: true, color: RED, charSpacing: 1.5 });
  card(s, { x: 0.55, y: 2.34, w: 5.9, h: 3.6, fill: "FFF5F5", line: "F5C2C7" });
  const before = [
    "Кнопка могла остаться «…» навсегда: server action уходит fetch без таймаута",
    "React 19: любая перерисовка вне перехода сбрасывает useFormStatus().pending — индикатор пропадал",
    "Сотрудник не понимал, идёт ли действие, и замолкал",
  ];
  before.forEach((t, i) => {
    const y = 2.52 + i * 1.08;
    s.addText("✗", { x: 0.72, y, w: 0.3, h: 0.35, fontFace: F.name, fontSize: 15, bold: true, color: RED });
    s.addText(t, { x: 1.1, y: y + 0.02, w: 5.15, h: 1.0, fontFace: F.name, fontSize: 9.5, color: GRAPHITE, lineSpacingMultiple: 1.28 });
  });

  s.addText("СТАЛО", { x: 6.85, y: 2.02, w: 3, h: 0.3, fontFace: F.name, fontSize: 9, bold: true, color: GOOD, charSpacing: 1.5 });
  card(s, { x: 6.85, y: 2.34, w: 5.9, h: 3.6, fill: "F2FBF6", line: "B9E4CE" });
  const after = [
    ["Сторожевой таймер — 20 секунд", "кнопка освобождается и пишет «Сервер не ответил. Нажмите, чтобы повторить»"],
    ["Таймаут запросов к базе — 10 секунд", "недоступная БД → понятная ошибка и кнопка «Повторить», а не бесконечный спиннер"],
    ["Индикация на каждом действии", "«Входим…», «Выходим…», «Публикуем обращение…» со спиннером и aria-busy"],
  ];
  after.forEach(([t, d], i) => {
    const y = 2.52 + i * 1.08;
    s.addText("✓", { x: 7.02, y, w: 0.3, h: 0.35, fontFace: F.name, fontSize: 15, bold: true, color: GOOD });
    s.addText(t, { x: 7.4, y: y + 0.01, w: 5.1, h: 0.3, fontFace: F.name, fontSize: 10, bold: true, color: NAVY });
    s.addText(d, { x: 7.4, y: y + 0.26, w: 5.15, h: 0.72, fontFace: F.name, fontSize: 8.6, color: GRAPHITE, lineSpacingMultiple: 1.28 });
  });

  s.addShape("roundRect", { x: 0.55, y: 6.15, w: 12.2, h: 0.62, rectRadius: 0.06, fill: { color: INFO }, line: { color: "2F80ED" } });
  s.addText("Проверено на тестовом стенде с неотвечающим server action:  1.5 с — «Ждём…»  ·  10.5 с — «Ждём…»  ·  21.5 с — кнопка снова активна", {
    x: 0.8, y: 6.15, w: 11.7, h: 0.62,
    fontFace: F.name, fontSize: 9.5, bold: true, color: NAVY, valign: "middle",
  });

  footer(s, 8, "Сторожевой таймер — src/lib/pending-watchdog.ts · таймаут БД — src/lib/db.ts");
  notes(s, "Это прямой ответ на замечание организаторов про зависшие кнопки. Воспроизвели стенд, нашли две причины, закрыли обе и проверили тайминги.");
}

/* ====================== Слайд 9. Что в цифрах ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  s.addText("РЕЗУЛЬТАТЫ ДЕМО-СТЕНДА", {
    x: 0.55, y: 0.38, w: 8, h: 0.28,
    fontFace: F.name, fontSize: 9, bold: true, color: "FF6B6B", charSpacing: 2,
  });
  s.addText("Цифры берём не с потолка —\nа из сида и production-сборки", {
    x: 0.55, y: 0.7, w: 12, h: 1.15,
    fontFace: F.head, fontSize: 27, bold: true, color: WHITE, lineSpacingMultiple: 1.05,
  });

  const stats = [
    ["7", "отделов\nиз датасета"],
    ["24", "пользователя\nво всех отделах"],
    ["19", "категорий\nобращений"],
    ["18", "правил маршрутизации\n«категория → отдел»"],
    ["21", "обращение\nс историей и оценками"],
    ["51", "запись истории\n(кто, что, когда)"],
    ["12", "уведомлений\nна демо-аккаунтах"],
    ["24", "маршрута\nв сборке"],
  ];
  const cellW = 2.92, cellH = 1.12, gap = 0.13;
  stats.forEach(([n, d], i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.55 + col * (cellW + gap), y = 2.05 + row * (cellH + gap);
    card(s, { x, y, w: cellW, h: cellH, fill: CARD, line: CARD_LINE, radius: 0.06 });
    s.addText(n, { x: x + 0.18, y: y + 0.08, w: cellW - 0.36, h: 0.55, fontFace: F.head, fontSize: 30, bold: true, color: RED });
    s.addText(d, { x: x + 0.18, y: y + 0.6, w: cellW - 0.36, h: 0.48, fontFace: F.name, fontSize: 7.6, color: "AEBECD", lineSpacingMultiple: 1.1 });
  });

  const quality = [
    ["0", "нарушений контраста\n(10 страниц × 2 темы)"],
    ["~103 кБ", "First Load JS\nсредний вес маршрута"],
    ["232–560 мс", "на прогретой инсталляции\n(замеры в дни хакатона)"],
    ["418 px", "без горизонтального\nскролла"],
  ];
  quality.forEach(([n, d], i) => {
    const x = 0.55 + i * 3.15;
    s.addText(n, { x, y: 5.05, w: 2.9, h: 0.5, fontFace: F.head, fontSize: 22, bold: true, color: WHITE });
    s.addText(d, { x, y: 5.52, w: 2.9, h: 0.62, fontFace: F.name, fontSize: 8, color: "9AA9BC", lineSpacingMultiple: 1.15 });
  });

  s.addText("Данные — только синтетические из датасета ГК «Модус Трейд»", {
    x: 0.55, y: 6.45, w: 12.2, h: 0.28,
    fontFace: F.name, fontSize: 9, color: "64748D",
  });
  s.addText("09", { x: 12.45, y: 6.98, w: 0.5, h: 0.3, fontFace: F.name, fontSize: 12, bold: true, color: RED, align: "right" });
  notes(s, "Обращаю внимание: это не заглушки, а данные датасета — дамп можно пересоздать командой db:reset.");
}

/* ====================== Слайд 10. Сделано / имитация / план ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 10, "ЧЕСТНО О ГРАНИЦАХ");
  label(s, "Что есть и что нет");
  h1(s, "Что сделано. Что имитировано. Что будет.", { y: 1.2, size: 27 });

  const cols = [
    {
      t: "СДЕЛАНО И РАБОТАЕТ", tone: "good",
      items: [
        "Сквозной процесс: подача → итог → оценка",
        "Маршрутизация по правилам из БД, «Неназначенные»",
        "SLA 3 / 7 / 14 дней, просрочка подсвечивается",
        "Похожие обращения при создании",
        "Карточка: история, комментарии, файлы",
        "Аналитика, CSV-выгрузка, лента улучшений",
        "Запрос ПДн → админка → «Обработан»",
        "Админка: категории, правила, журнал",
        "Тёмная тема и языки RU / EN / KZ",
      ],
    },
    {
      t: "ИМИТАЦИЯ (ЧЕСТНО)", tone: "mid",
      items: [
        "Email-канал: только внутрисистемные уведомления",
        "Битрикс24: модуль собран, синхронизация проверена на макете, в сборке выключен",
        "Справочники (отделы, люди, категории) — через сид",
        "Метрики и графики показывают поведение демо-набора, а не компании",
      ],
    },
    {
      t: "ПЛАН РАЗВИТИЯ", tone: "plan",
      items: [
        "Конструктор орг-структуры: дерево отделов, версии правил",
        "Интеграции Битрикс24 и 1С (2–4 недели)",
        "ML: автокатегоризация и похожие обращения",
        "Опросы, NPS, обратная связь клиентов",
        "Мониторинг, бэкапы, юр. проверка и РКН",
      ],
    },
  ];
  cols.forEach((c, i) => {
    const x = 0.55 + i * 4.18;
    const headColor = c.tone === "good" ? GOOD : c.tone === "mid" ? RED : NAVY;
    s.addText(c.t, { x, y: 2.1, w: 4, h: 0.32, fontFace: F.name, fontSize: 10, bold: true, color: headColor, charSpacing: 1.2 });
    card(s, { x, y: 2.46, w: 3.95, h: 3.6, fill: c.tone === "good" ? "F2FBF6" : c.tone === "mid" ? "FFF5F5" : SOFT, line: c.tone === "good" ? "B9E4CE" : c.tone === "mid" ? "F5C2C7" : "E5E5E5" });
    c.items.forEach((it, j) => {
      const y = 2.62 + j * 0.37;
      s.addText(i === 0 ? "✓" : i === 1 ? "~" : "→", { x: x + 0.15, y, w: 0.28, h: 0.3, fontFace: F.name, fontSize: 11, bold: true, color: headColor });
      s.addText(it, { x: x + 0.44, y: y + 0.02, w: 3.38, h: 0.35, fontFace: F.name, fontSize: 7.6, color: GRAPHITE, lineSpacingMultiple: 1.12 });
    });
  });

  s.addText("Мы разделяем «работает» и «запланировано» — это прямое требование ТЗ п. 4.2.", {
    x: 0.55, y: 6.42, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 10, "Что реализовано / имитация / план — ОТЧЁТ.md §5");
  notes(s, "Если спросят «что не сделано»: email — единственный канал, который имитирован; остальное либо сделано, либо в плане.");
}

/* ====================== Слайд 11. Недочёты → как исправляем ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 11, "НЕДОЧЁТЫ И РЕШЕНИЯ");
  label(s, "Честно о слабых местах");
  h1(s, "Каждый недостаток — с планом закрытия", { y: 1.18, size: 27 });

  const closed = [
    ["9 уязвимостей в npm audit", "→ 0: точечные overrides (postcss, deepmerge-ts, zod). Мажорные версии не трогали"],
    ["Кнопки «зависали» на «…»", "→ сторожевой таймер 20 с + таймаут базы 10 с + индикация на каждом действии"],
    ["Нет индикации загрузки", "→ спиннер и «Входим…» / «Выходим…» на входе, на выходе, при публикации обращения"],
    ["Чужое обращение по ссылке", "→ 404 с брендированной страницей вместо утечки данных"],
    ["Интерфейс: только светлая тема, только RU", "→ тёмная тема, 3 языка, WCAG AA — 0 нарушений контраста"],
  ];
  const open = [
    ["Email не отправляется", "→ подключить SMTP / сервис рассылок: очередь уведомлений уже пишется в БД"],
    ["Справочники меняются сидом", "→ визуальный конструктор орг-структуры: дерево отделов + версии правил (этап 2)"],
    ["Холодный старт serverless (~5 с)", "→ прогрев функции или план без scale-to-zero, кэш на чтение (Redis)"],
    ["Нет мониторинга и бэкапов", "→ Sentry + UptimeRobot + ежедневные снапшоты базы, до первого пилота"],
    ["Юридический контур не проверен", "→ проверка юриста + уведомление РКН + назначение ответственного за ПДн"],
  ];

  s.addText("ЗАКРЫТО В ЭТОЙ РАБОТЕ", {
    x: 0.55, y: 2.0, w: 6, h: 0.3,
    fontFace: F.name, fontSize: 9, bold: true, color: GOOD, charSpacing: 1.4,
  });
  card(s, { x: 0.55, y: 2.34, w: 6.0, h: 3.75, fill: "F2FBF6", line: "B9E4CE" });
  closed.forEach(([t, d], i) => {
    const y = 2.48 + i * 0.66;
    s.addText("✓", { x: 0.72, y, w: 0.3, h: 0.3, fontFace: F.name, fontSize: 12, bold: true, color: GOOD });
    s.addText(t, { x: 1.05, y: y + 0.01, w: 5.3, h: 0.24, fontFace: F.name, fontSize: 8.8, bold: true, color: NAVY });
    s.addText(d, { x: 1.05, y: y + 0.21, w: 5.3, h: 0.38, fontFace: F.name, fontSize: 7.6, color: GRAPHITE, lineSpacingMultiple: 1.15 });
  });

  s.addText("ОСТАЛОСЬ — И КАК ИСПРАВИМ", {
    x: 6.9, y: 2.0, w: 6, h: 0.3,
    fontFace: F.name, fontSize: 9, bold: true, color: RED, charSpacing: 1.4,
  });
  card(s, { x: 6.9, y: 2.34, w: 5.85, h: 3.75, fill: "FFF5F5", line: "F5C2C7" });
  open.forEach(([t, d], i) => {
    const y = 2.48 + i * 0.66;
    s.addText("!", { x: 7.07, y, w: 0.3, h: 0.3, fontFace: F.name, fontSize: 13, bold: true, color: RED });
    s.addText(t, { x: 7.4, y: y + 0.01, w: 5.1, h: 0.24, fontFace: F.name, fontSize: 8.8, bold: true, color: NAVY });
    s.addText(d, { x: 7.4, y: y + 0.21, w: 5.15, h: 0.38, fontFace: F.name, fontSize: 7.6, color: GRAPHITE, lineSpacingMultiple: 1.15 });
  });

  s.addText("Ровно это и делает продукт честным: недочёты — с именами и сроками, а не «всё отлично».", {
    x: 0.55, y: 6.3, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 9.5, italic: true, color: MUTED,
  });
  footer(s, 11, "Закрытые пункты — ИСТОРИЯ-РАБОТЫ.md §20 · ОТЧЁТ.md §5");
  notes(s, "Жюри обычно спрашивает про слабые места. Отвечаем первыми: показываем, что закрыто, и называем, что осталось и когда.");
}

/* ====================== Слайд 12. Ценность для компании ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 12, "ЭФФЕКТ");
  label(s, "Зачем это компании");
  h1(s, "От «обратной связи» — к управляемым улучшениям", { y: 1.18, size: 27 });

  const cards = [
    ["Каждый отклик — с владельцем и сроком", "Обращение не теряется и не «всплывёт»: у него всегда есть ответственный и дедлайн, видимый обоим."],
    ["Повторяющиеся проблемы видны по данным", "Счётчик дубликатов по категориям показывает, что чинить костылями нельзя — нужен системный фикс."],
    ["Доверие сотрудников растёт", "Сотрудник видит, что его идея внедрена, и получает итог — это лучшая мотивация писать снова."],
    ["Руководитель управляет по цифрам", "Доля рассмотренных, время до первого ответа, просрочка, удовлетворённость — метрики из ТЗ п. 2.7."],
  ];
  cards.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.55 + col * 6.35, y = 2.15 + row * 1.5;
    card(s, { x, y, w: 5.95, h: 1.36, fill: i % 2 ? WHITE : SOFT, line: "E5E5E5" });
    s.addShape("ellipse", { x: x + 0.18, y: y + 0.2, w: 0.46, h: 0.46, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(String(i + 1), { x: x + 0.18, y: y + 0.2, w: 0.46, h: 0.46, fontFace: F.head, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(t, { x: x + 0.78, y: y + 0.16, w: 4.95, h: 0.28, fontFace: F.name, fontSize: 11.5, bold: true, color: NAVY });
    s.addText(d, { x: x + 0.78, y: y + 0.44, w: 4.95, h: 0.78, fontFace: F.name, fontSize: 8.6, color: GRAPHITE, lineSpacingMultiple: 1.2 });
  });

  s.addText("МЕТРИКИ ПИЛОТА", {
    x: 0.55, y: 5.28, w: 6, h: 0.28,
    fontFace: F.name, fontSize: 9, bold: true, color: MUTED, charSpacing: 1.4,
  });
  const metrics = [
    ["доля рассмотренных", "цель ≥ 80%"],
    ["время первого ответа", "цель ≤ 3 дней"],
    ["время до решения", "цель по приоритету"],
    ["удовлетворённость", "цель ≥ 4 из 5"],
    ["число внедрённых улучшений", "главный результат"],
  ];
  metrics.forEach(([t, d], i) => {
    const x = 0.55 + i * 2.49;
    s.addShape("rect", { x, y: 5.62, w: 0.06, h: 0.75, fill: { color: RED }, line: { color: RED } });
    s.addText(t, { x: x + 0.16, y: 5.62, w: 2.2, h: 0.34, fontFace: F.name, fontSize: 8.6, bold: true, color: NAVY, lineSpacingMultiple: 1.1 });
    s.addText(d, { x: x + 0.16, y: 5.98, w: 2.2, h: 0.28, fontFace: F.name, fontSize: 7.6, color: MUTED });
  });

  footer(s, 12, "Метрики — из ТЗ п. 2.7 и КОНЦЕПЦИЯ.md §7");
  notes(s, "Заканчиваем не фичами, а результатом: сколько обращений довели до внедрения и сколько идей вернули в компанию.");
}

/* ====================== Слайд 13. Дорожная карта ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 13, "ДОРОЖНАЯ КАРТА");
  label(s, "Как внедряем");
  h1(s, "Три волны: от одного отдела — к компании", { y: 1.2, size: 27 });

  const phases = [
    ["ЭТАП 1 · ПИЛОТ", "4 недели · один отдел (Закупки)", [
      "цель: ≥ 80% обращений рассмотрено",
      "время первого ответа ≤ 3 дней",
      "удовлетворённость автора ≥ 4 из 5",
      "аудит ПДн и журнал с первого дня",
    ], "good"],
    ["ЭТАП 2 · В ВСЮ КОМПАНИЮ", "2–3 месяца · волнами по отделам", [
      "2–3 отдела за волну, все 7 датасета",
      "обучение руководителей и авторов",
      "SLA уточняем по реальным данным",
      "интеграция с Битрикс24: задачи и уведомления",
    ], "mid"],
    ["ЭТАП 3 · ЭТАП 2 ПРОДУКТА", "далее · по запросу бизнеса", [
      "визуальный конструктор орг-структуры",
      "версии и история правил маршрутизации",
      "ML: автокатегоризация, поиск похожих",
      "опросы, NPS, клиентская обратная связь",
    ], "plan"],
  ];
  phases.forEach(([t, sub, items, tone], i) => {
    const x = 0.55 + i * 4.18;
    const headColor = tone === "good" ? GOOD : tone === "mid" ? RED : NAVY;
    s.addText(t, { x, y: 2.15, w: 4, h: 0.32, fontFace: F.name, fontSize: 10, bold: true, color: headColor, charSpacing: 1.1 });
    s.addText(sub, { x, y: 2.47, w: 4, h: 0.3, fontFace: F.name, fontSize: 9.5, color: MUTED });
    card(s, { x, y: 2.85, w: 3.95, h: 2.55, fill: i === 0 ? "F2FBF6" : i === 1 ? "FFF5F5" : SOFT, line: i === 0 ? "B9E4CE" : i === 1 ? "F5C2C7" : "E5E5E5" });
    items.forEach((it, j) => {
      const y = 3.05 + j * 0.58;
      s.addText(String(j + 1), { x: x + 0.15, y, w: 0.35, h: 0.3, fontFace: F.head, fontSize: 12, bold: true, color: headColor });
      s.addText(it, { x: x + 0.55, y: y + 0.02, w: 3.3, h: 0.5, fontFace: F.name, fontSize: 8, color: GRAPHITE, lineSpacingMultiple: 1.15 });
    });
  });

  s.addShape("roundRect", { x: 0.55, y: 5.6, w: 12.25, h: 0.8, rectRadius: 0.06, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText([
    { text: "Экономика: ", options: { bold: true, color: WHITE } },
    { text: "один процесс вместо трёх чатов, одна цена внедрения, измеримый результат уже на пилоте.", options: { color: "C9D4E0" } },
  ], {
    x: 0.8, y: 5.6, w: 11.8, h: 0.8,
    fontFace: F.name, fontSize: 11.5, valign: "middle",
  });

  footer(s, 13, "Развернуть заново: РАЗВЁРТЫВАНИЕ.md в репозитории");
  notes(s, "Если жюри спросит про сроки: первый результат измерим через 4 недели в одном отделе.");
}

/* ====================== Слайд 14. Что просим ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  s.addText("ЧТО МЫ ПРОСИМ", {
    x: 0.55, y: 0.5, w: 6, h: 0.3,
    fontFace: F.name, fontSize: 9, bold: true, color: "FF6B6B", charSpacing: 2,
  });
  s.addText("Три вещи, которые решает жюри", {
    x: 0.55, y: 0.85, w: 12, h: 0.75,
    fontFace: F.head, fontSize: 30, bold: true, color: WHITE,
  });

  const asks = [
    ["1", "Пилот на одном отделе", "«Закупки» как первый отдел: 20+ сотрудников, реальные категории, свои правила маршрутизации. Старт — в течение месяца."],
    ["2", "Доступ к интеграции", "Битрикс24 и структура отделов/пользователей для подключения модуля (он уже собран и проверен на макете)."],
    ["3", "Поддержка жюри", "Продвижение до стейкхолдеров: юрист для политик ПДн, РКН, ответственный за ПДн, бэкапы базы."],
  ];
  asks.forEach(([n, t, d], i) => {
    const y = 1.95 + i * 1.35;
    s.addShape("ellipse", { x: 0.55, y, w: 0.62, h: 0.62, fill: { color: RED }, line: { color: RED } });
    s.addText(n, { x: 0.55, y, w: 0.62, h: 0.62, fontFace: F.head, fontSize: 18, bold: true, color: WHITE, align: "center", valign: "middle" });
    s.addText(t, { x: 1.4, y: y + 0.02, w: 10.9, h: 0.32, fontFace: F.name, fontSize: 14, bold: true, color: WHITE });
    s.addText(d, { x: 1.4, y: y + 0.36, w: 10.9, h: 0.6, fontFace: F.name, fontSize: 10.5, color: "AEBECD", lineSpacingMultiple: 1.2 });
  });

  s.addText("Ничего просить, кроме решения, мы не будем: проект работает локально, данные синтетические, лицензии бесплатные (MIT, SIL OFL).", {
    x: 0.55, y: 6.15, w: 12.2, h: 0.3,
    fontFace: F.name, fontSize: 10, italic: true, color: "9AA9BC",
  });
  s.addText("14", { x: 12.45, y: 6.98, w: 0.5, h: 0.3, fontFace: F.name, fontSize: 12, bold: true, color: RED, align: "right" });
  notes(s, "Три просьбы: пилот, доступ к Битрикс24, поддержка до внедрения. Всё остальное уже готово.");
}

/* ====================== Слайд 15. Финал ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  s.addShape("ellipse", { x: -2.2, y: -2.6, w: 5.6, h: 5.6, fill: { color: NAVY, transparency: 100 }, line: { color: "123A54", width: 1.25 } });
  s.addShape("ellipse", { x: 11.2, y: 5.2, w: 3.6, h: 3.6, fill: { color: NAVY, transparency: 100 }, line: { color: RED, width: 1.25 } });

  logo(s, { x: 0.78, y: 0.72, scale: 0.75, onDark: true });

  s.addText("Каждый отклик —\nдо результата.", {
    x: 0.78, y: 1.75, w: 11.8, h: 2.0,
    fontFace: F.head, fontSize: 48, bold: true, color: WHITE, lineSpacingMultiple: 1.0,
  });
  s.addText("Каждый отклик ведёт к результату. Это главная метрика продукта.", {
    x: 0.78, y: 3.75, w: 11, h: 0.4,
    fontFace: F.name, fontSize: 12, italic: true, color: "C9D4E0",
  });

  s.addShape("roundRect", { x: 0.78, y: 4.45, w: 6.0, h: 0.75, rectRadius: 0.07, fill: { color: RED_ACTION }, line: { color: RED_ACTION } });
  s.addText("ОТКРЫТЬ РЕПОЗИТОРИЙ", {
    x: 0.78, y: 4.45, w: 6.0, h: 0.75,
    fontFace: F.name, fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", charSpacing: 1.4,
  });
  s.addText("github.com/DENDORoff/otklik", {
    x: 0.78, y: 5.35, w: 6, h: 0.35,
    fontFace: F.name, fontSize: 13, color: WHITE,
  });

  s.addText([
    { text: "Запуск локально: npm install → npm run db:reset → npm run build → http://localhost:3000\n", options: {} },
    { text: "Репозиторий: github.com/DENDORoff/otklik · документы — в корне репозитория", options: { color: "9AA9BC" } },
  ], {
    x: 0.78, y: 5.9, w: 11.8, h: 0.75,
    fontFace: F.name, fontSize: 9.5, color: "C9D4E0", lineSpacingMultiple: 1.3,
  });
  s.addText("Спасибо!", {
    x: 0.78, y: 6.75, w: 11.8, h: 0.4,
    fontFace: F.head, fontSize: 16, bold: true, color: RED,
  });
  s.addText("15", { x: 12.45, y: 6.98, w: 0.5, h: 0.3, fontFace: F.name, fontSize: 12, bold: true, color: RED, align: "right" });
  notes(s, "Финальный слайд — тишина 3 секунды и URL. Дальше отвечаем на вопросы из ПИТЧ-ВОПРОСЫ.md.");
}

/* ====================== Слайд 16. Приложение: вопросы жюри ====================== */
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  chrome(s, 16, "ПРИЛОЖЕНИЕ · Q&A");
  label(s, "Вероятные вопросы жюри");
  h1(s, "Короткие ответы", { y: 1.2, size: 26 });

  const qaLeft = [
    ["Какой стек и почему?", "Next.js 15 + React 19 + TS 6: Server Actions без отдельного API-слоя, права на сервере, First Load JS ~103 кБ. Prisma 6: одна схема, SQLite локально → PostgreSQL в бою."],
    ["Почему не Next 16 / Prisma 7?", "После аудита: обновление ломает сборку и миграцию, advisory недостижимы из пользовательского ввода. Закрыли глубже — overrides, audit 0."],
    ["Что было в npm audit?", "9 уязвимостей (8 высоких): postcss в Next, deepmerge-ts в Prisma CLI, zod в @vercel/blob. Все — транзитивные, закрыты точечно."],
    ["Почему «зависали» кнопки?", "Server action без таймаута + особенность React 19 (любой ре-рендер сбрасывает pending). Решение: сторожевой таймер 20 с + таймаут БД 10 с."],
    ["Почему у всех ролей такой пароль?", "Демо-аккаунты синтетические (датасет), пароль demo1234 — для воспроизводимости защиты. В бою — хеши и уникальные пароли."],
  ];
  const qaRight = [
    ["Кто назначает исполнителя?", "Только начальник отдела (ТЗ п. 2.2). Система подсказывает, но решение — за руководителем."],
    ["Что если правила нет?", "Обращение уходит в «Неназначенные» + уведомление администратору. Ничего не теряется и не зависает."],
    ["Как считается SLA?", "Дедлайн ставится при переводе в «В работе» по приоритету: высокий 3 дня, средний 7, низкий 14."],
    ["Что с персональными данными?", "Данные синтетические. В бою: вход по учёткам компании, согласие, запросы на доступ/удаление, журнал, HTTPS и бэкапы."],
    ["Что дальше после хакатона?", "Пилот в «Закупках» за 4 недели, затем волнами по остальным отделам; интеграции Битрикс24 / 1С — этапом 2."],
  ];

  const qaCol = (x, rows, offset = 0) => {
    rows.forEach(([q, a], i) => {
      const y = 2.05 + i * 1.02;
      s.addText(q, { x, y, w: 5.85, h: 0.26, fontFace: F.name, fontSize: 8.8, bold: true, color: NAVY });
      s.addText(a, { x, y: y + 0.23, w: 5.85, h: 0.68, fontFace: F.name, fontSize: 7.6, color: GRAPHITE, lineSpacingMultiple: 1.15 });
    });
  };
  qaCol(0.55, qaLeft);
  qaCol(6.95, qaRight);
  s.addShape("line", { x: 6.68, y: 2.05, w: 0, h: 5.0, line: { color: LINE, width: 0.75 } });

  s.addText("Полный разбор вопросов — ПИТЧ-ВОПРОСЫ.md · сценарий демонстрации — ДЕМО-СЦЕНАРИЙ.md", {
    x: 0.55, y: 7.05, w: 12.2, h: 0.25,
    fontFace: F.name, fontSize: 8, color: MUTED,
  });
  notes(s, "Оставляем этот слайд открытым на случай вопросов. Подробные ответы — в ПИТЧ-ВОПРОСЫ.md.");
}

/* ====================== Завершение ====================== */
pptx.writeFile({ fileName: OUT }).then(() => {
  const stat = fs.statSync(OUT);
  console.log("Сохранено:", OUT);
  console.log("Размер:", (stat.size / 1024).toFixed(1), "КБ");
  console.log("Слайдов:", pptx.slides ? pptx._slides.length : "—");
}).catch((e) => {
  console.error("Ошибка генерации:", e);
  process.exit(1);
});
