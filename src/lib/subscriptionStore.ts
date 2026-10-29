"use client";

import { useSyncExternalStore } from "react";
import { todayString, type DateString } from "./date";
import { parseSubscriptions, readRaw, STORAGE_KEY, writeSubscriptions, type KeyValueStorage } from "./storage";
import type { Subscription } from "./subscription";

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedList: Subscription[] = [];

function getStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Subscription[] {
  const raw = readRaw(getStorage());
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseSubscriptions(raw);
  }
  return cachedList;
}

/** サーバーと最初の描画では「読み込み中」 */
function getServerSnapshot(): null {
  return null;
}

/** 端末に保存したサブスク。読み終わるまでは null */
export function useSubscriptions(): Subscription[] | null {
  return useSyncExternalStore<Subscription[] | null>(subscribe, getSnapshot, getServerSnapshot);
}

/** 1件足して保存する。保存できたら true */
export function addSubscription(sub: Subscription): boolean {
  const ok = writeSubscriptions(getStorage(), [...getSnapshot(), sub]);
  if (ok) notify();
  return ok;
}

function subscribeToday(): () => void {
  return () => {};
}

/** この端末の「今日」。読み終わるまでは null */
export function useToday(): DateString | null {
  return useSyncExternalStore<DateString | null>(subscribeToday, () => todayString(), () => null);
}
