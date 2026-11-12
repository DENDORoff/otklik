/**
 * Клиент облачного портала Битрикс24 (REST API).
 *
 * Модуль по умолчанию полностью выключен: без BITRIX24_WEBHOOK_URL ни один
 * вызов не уходит в сеть, а функции высокого уровня возвращают null.
 * Поведение приложения при незаполненных переменных окружения не меняется.
 *
 * Переменные окружения:
 *  BITRIX24_WEBHOOK_URL        — https://<portal>/rest/1/<токен>/
 *  BITRIX24_PORTAL_ID          — идентификатор портала для показа в админке
 *  BITRIX24_INTEGRATION_SECRET — общий секрет для входящих вебхуков
 *  BITRIX24_TIMEOUT_MS         — таймаут вызова, по умолчанию 8000 мс
 *
 * Безопасность:
 *  - URL вебхука содержит секретный токен портала: он не попадает ни в логи,
 *    ни в ответы API, ни в тексты ошибок (см. sanitizeSecret);
 *  - ошибки портала (поле error / error_description) разбираются и превращаются
 *    в Bitrix24Error с безопасным описанием;
 *  - каждый вызов ограничен по времени через AbortController;
 *  - реальные данные компании не используются — только синтетический стенд.
 */

/** Ошибка обращения к порталу. Текст уже очищен от секретов. */
export class Bitrix24Error extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "Bitrix24Error";
    this.code = code;
    this.status = status;
  }
}

export type Bitrix24Config = {
  /** Базовый URL вебхука с токеном. Секретен — не логировать. */
  webhookUrl: string;
  /** Идентификатор портала — только для показа в админке. */
  portalId: string;
  /** Секрет проверки входящих вебхуков. */
  integrationSecret: string;
  /** Таймаут сетевого вызова, мс. */
  timeoutMs: number;
};

export type Bitrix24Task = {
  id: string;
  title?: string;
  description?: string;
  /** 1 — новая, 2 — в работе, 3 — ожидает, 4 — закрыта, 5 — выполнена. */
  status?: number | string;
  responsibleId?: string | number;
  deadline?: string;
  createdBy?: string | number;
  closedDate?: string;
  comment?: string;
};

export type Bitrix24TaskResponse = { task?: Bitrix24Task };

export type Bitrix24User = {
  ID?: string | number;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
  ID_HR?: string | number;
};

export type CreateBitrixTaskInput = {
  title: string;
  comment: string;
  /** Внутренний ID сотрудника портала ( Bitrix24 user ID ). */
  responsibleId?: string;
  deadline?: Date;
};

export type UpdateBitrixTaskInput = {
  title?: string;
  description?: string;
  responsibleId?: string;
  deadline?: Date;
  /** Приоритет задачи портала: 0 — низкий, 1 — средний, 2 — высокий. */
  priority?: number;
  /** Статус задачи портала: 1 — новая, 2 — в работе, 3 — ожидает. */
  status?: number;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_TIMEOUT_MS = 30_000;
const TITLE_LIMIT = 250;
const DESCRIPTION_LIMIT = 4_000;

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** Конфигурация модуля. null — интеграция выключена. */
export function getBitrix24Config(): Bitrix24Config | null {
  const webhookUrl = readEnv("BITRIX24_WEBHOOK_URL");
  if (!webhookUrl) return null;

  const rawTimeout = Number(readEnv("BITRIX24_TIMEOUT_MS"));
  const timeoutMs =
    Number.isFinite(rawTimeout) && rawTimeout > 0
      ? Math.min(Math.round(rawTimeout), MAX_TIMEOUT_MS)
      : DEFAULT_TIMEOUT_MS;

  return {
    webhookUrl,
    portalId: readEnv("BITRIX24_PORTAL_ID"),
    integrationSecret: readEnv("BITRIX24_INTEGRATION_SECRET"),
    timeoutMs,
  };
}

/** Настроена ли интеграция. Без этой проверки сеть не трогается. */
export function isBitrix24Configured(): boolean {
  return getBitrix24Config() !== null;
}

/** Секрет проверки входящих вебхуков (или null, если не задан). */
export function getBitrix24IntegrationSecret(): string | null {
  const secret = readEnv("BITRIX24_INTEGRATION_SECRET");
  return secret ? secret : null;
}

/**
 * Удаляет из текста секретные фрагменты (URL вебхука и сам токен).
 * Используется для всех сообщений, которые могут попасть в лог или UI.
 */
export function sanitizeSecret(text: string): string {
  let safe = text;
  const config = getBitrix24Config();
  const secrets: string[] = [];
  if (config) {
    secrets.push(config.webhookUrl);
    // Токен — последний непустой сегмент пути вебхука.
    const token = config.webhookUrl.split("/").filter(Boolean).pop();
    if (token) secrets.push(token);
  }
  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue;
    safe = safe.split(secret).join("***");
  }
  return safe;
}

/** Человекочитаемое описание ошибки без секретов. */
export function describeBitrix24Error(error: unknown): string {
  if (error instanceof Bitrix24Error) {
    return sanitizeSecret(error.message || error.code);
  }
  if (error instanceof Error) {
    return sanitizeSecret(error.message || "Неизвестная ошибка обращения к порталу.");
  }
  return "Неизвестная ошибка обращения к порталу.";
}

/** Формирует полный URL вызова REST-метода. Секретен — не логировать. */
function methodUrl(config: Bitrix24Config, method: string): string {
  const base = config.webhookUrl.endsWith("/") ? config.webhookUrl : `${config.webhookUrl}/`;
  return `${base}${method}`;
}

/** Дата в формате, который принимает портал: локальное время сервера. */
export function formatBitrixDeadline(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join("");
}

/**
 * Вызов REST-метода портала.
 *
 * Бросает Bitrix24Error: NOT_CONFIGURED — интеграция выключена;
 * иначе код ошибки портала (QUERY_LIMIT_EXCEEDED, ACCESS_DENIED и т. п.).
 * Сеть не трогается, если интеграция не настроена.
 */
export async function bitrix24Request<T>(
  method: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const config = getBitrix24Config();
  if (!config) {
    throw new Bitrix24Error("NOT_CONFIGURED", "Интеграция с Битрикс24 не настроена.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(methodUrl(config, method), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
      signal: controller.signal,
      cache: "no-store",
    });

    const raw = await response.text();
    let data: unknown = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
      const payload = data as { error?: unknown; error_description?: unknown };
      const code = String(payload.error ?? "UNKNOWN_ERROR");
      const description = String(payload.error_description ?? "").trim();
      throw new Bitrix24Error(
        code,
        sanitizeSecret(description || `Портал вернул ошибку ${code}.`),
        response.status,
      );
    }

    if (!response.ok) {
      throw new Bitrix24Error(
        `HTTP_${response.status}`,
        sanitizeSecret(`Портал вернул HTTP ${response.status}.`),
        response.status,
      );
    }

    return (data ?? {}) as T;
  } catch (error) {
    if (error instanceof Bitrix24Error) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new Bitrix24Error(
        "TIMEOUT",
        sanitizeSecret(`Портал не ответил за ${config.timeoutMs} мс.`),
      );
    }
    throw new Bitrix24Error(
      "NETWORK_ERROR",
      sanitizeSecret(
        error instanceof Error
          ? `Не удалось связаться с порталом: ${error.message}`
          : "Не удалось связаться с порталом.",
      ),
    );
  } finally {
    clearTimeout(timer);
  }
}

function toTaskFields(fields: UpdateBitrixTaskInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (fields.title) payload["fields[title]"] = fields.title.slice(0, TITLE_LIMIT);
  if (fields.description) {
    payload["fields[description]"] = fields.description.slice(0, DESCRIPTION_LIMIT);
  }
  if (fields.responsibleId) payload["fields[responsibleId]"] = fields.responsibleId;
  if (fields.deadline) payload["fields[deadline]"] = formatBitrixDeadline(fields.deadline);
  if (typeof fields.priority === "number") payload["fields[priority]"] = fields.priority;
  if (typeof fields.status === "number") payload["fields[status]"] = fields.status;
  return payload;
}

/**
 * Создание задачи в портале. Возвращает null, если интеграция выключена.
 * Ошибки портала пробрасываются вызывающему коду (там они логируются).
 */
export async function createBitrixTask(
  input: CreateBitrixTaskInput,
): Promise<Bitrix24Task | null> {
  if (!isBitrix24Configured()) return null;

  const fields: Record<string, unknown> = {
    "fields[title]": input.title.slice(0, TITLE_LIMIT),
    "fields[description]": input.comment.slice(0, DESCRIPTION_LIMIT),
  };
  if (input.responsibleId) fields["fields[responsibleId]"] = input.responsibleId;
  if (input.deadline) fields["fields[deadline]"] = formatBitrixDeadline(input.deadline);

  const response = await bitrix24Request<Bitrix24TaskResponse>("tasks.task.add", fields);
  return response?.task ?? null;
}

/** Обновление задачи портала. null — интеграция выключена. */
export async function updateBitrixTask(
  taskId: string,
  fields: UpdateBitrixTaskInput,
): Promise<Bitrix24Task | null> {
  if (!isBitrix24Configured()) return null;

  const response = await bitrix24Request<Bitrix24TaskResponse>("tasks.task.update", {
    taskId,
    ...toTaskFields(fields),
  });
  return response?.task ?? null;
}

/**
 * Завершение задачи портала. Комментарий добавляется отдельным вызовом:
 * метод complete не во всех версиях портала принимает текст комментария.
 */
export async function completeBitrixTask(
  taskId: string,
  comment?: string,
): Promise<Bitrix24Task | null> {
  if (!isBitrix24Configured()) return null;

  const response = await bitrix24Request<Bitrix24TaskResponse>("tasks.task.complete", {
    taskId,
  });

  if (comment && comment.trim()) {
    await addBitrixTaskComment(taskId, comment.trim());
  }

  return response?.task ?? null;
}

/** Чтение задачи портала (read-only). */
export async function getBitrixTask(taskId: string): Promise<Bitrix24Task | null> {
  if (!isBitrix24Configured()) return null;

  const response = await bitrix24Request<Bitrix24TaskResponse>("tasks.task.get", { taskId });
  return response?.task ?? null;
}

/**
 * Комментарий к задаче портала. Имя метода отличается в разных редакциях
 * портала, поэтому при «метод не найден» делается одна попытка запасным именем.
 */
export async function addBitrixTaskComment(taskId: string, text: string): Promise<boolean> {
  if (!isBitrix24Configured()) return false;
  const comment = text.slice(0, DESCRIPTION_LIMIT);

  try {
    await bitrix24Request("tasks.task.addComment", { taskId, text: comment });
    return true;
  } catch (error) {
    const code = error instanceof Bitrix24Error ? error.code : "";
    if (code === "METHOD_NOT_FOUND" || code === "ERROR_METHOD_NOT_FOUND") {
      try {
        await bitrix24Request("task.addComment", { taskId, text: comment });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

const userCache = new Map<string, { id: string; expiresAt: number }>();
const USER_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Поиск сотрудника портала по рабочему e-mail.
 * Нужен, чтобы назначить задачу исполнителю из «Отклика».
 */
export async function findBitrixUserIdByEmail(email: string): Promise<string | null> {
  if (!isBitrix24Configured()) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const cached = userCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return cached.id;

  const response = await bitrix24Request<{ result?: Bitrix24User[] }>("user.get", {
    FILTER: { EMAIL: normalized },
  });
  const user = response?.result?.[0];
  const id = user?.ID ? String(user.ID) : null;
  if (id) {
    userCache.set(normalized, { id, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  }
  return id;
}

/** Базовый адрес портала без секретного пути — для ссылок на задачи. */
export function bitrix24PortalBaseUrl(): string | null {
  const config = getBitrix24Config();
  if (!config) return null;
  try {
    const url = new URL(config.webhookUrl);
    return `${url.origin}${url.pathname.split("/rest")[0]}`;
  } catch {
    return null;
  }
}

/** Прямая ссылка на задачу портала (без секретов). */
export function bitrix24TaskUrl(taskId: string): string | null {
  const base = bitrix24PortalBaseUrl();
  if (!base || !taskId) return null;
  return `${base}/tasks/?id=${encodeURIComponent(taskId)}`;
}

/**
 * Безопасная проверка связи с порталом: read-only вызов без параметров.
 * Возвращает краткий отчёт без секретов — для карточки в админке.
 */
export async function checkBitrix24Connection(): Promise<{
  ok: boolean;
  configured: boolean;
  message: string;
  portalUserId?: string;
}> {
  if (!isBitrix24Configured()) {
    return {
      ok: false,
      configured: false,
      message: "Интеграция не настроена: не задан BITRIX24_WEBHOOK_URL.",
    };
  }

  try {
    const response = await bitrix24Request<{ ID?: string | number; NAME?: string; LAST_NAME?: string }>(
      "user.current",
      {},
    );
    const id = response?.ID ? String(response.ID) : undefined;
    const name = [response?.NAME, response?.LAST_NAME].filter(Boolean).join(" ");
    return {
      ok: true,
      configured: true,
      message: name
        ? `Соединение установлено, портал отвечает: ${name}.`
        : "Соединение установлено, портал отвечает.",
      portalUserId: id,
    };
  } catch (error) {
    const code = error instanceof Bitrix24Error ? error.code : "NETWORK_ERROR";
    return {
      ok: false,
      configured: true,
      message: `Портал не ответил (${code}): ${describeBitrix24Error(error)}`,
    };
  }
}
