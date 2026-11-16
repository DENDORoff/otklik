"use client";

import { useCallback, useEffect, useState } from "react";

/** Через сколько миллисекунд ожидания считаем, что сервер не ответил. */
export const STUCK_AFTER_MS = 20_000;

/**
 * Сторожевой таймер для server actions.
 *
 * Server action уходит обычным `fetch` без таймаута. Если сервер не ответил
 * (холодный старт функции, недоступная база, разрыв соединения), React держит
 * `useFormStatus().pending === true` бесконечно: кнопка остаётся заблокированной
 * с многоточием, и повторить действие нельзя. Именно это наблюдали организаторы —
 * «кнопки зависали на …».
 *
 * Через `stuckAfterMs` хук снимает блокировку и разрешает повторить действие.
 *
 * Особенность React 19, из-за которой устроено именно так: значение
 * `useFormStatus().pending` живёт в контексте перехода, и любая перерисовка
 * компонента вне этого перехода сбрасывает его в false. Поэтому во время
 * ожидания состояние не трогаем — единственное изменение происходит по таймеру,
 * когда блокировку и нужно снять.
 */
export function usePendingWatchdog(
  pending: boolean,
  { stuckAfterMs = STUCK_AFTER_MS }: { stuckAfterMs?: number } = {},
): { stuck: boolean; restart: () => void } {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setStuck(true), stuckAfterMs);
    return () => clearTimeout(timer);
  }, [pending, stuckAfterMs]);

  /** Повтор действия: сбрасываем состояние, чтобы таймер пошёл заново. */
  const restart = useCallback(() => setStuck(false), []);

  return { stuck, restart };
}
