import { isDateString } from "./date";
import { NAME_MAX_LENGTH, type Subscription } from "./subscription";

/** localStorage のキー */
export const STORAGE_KEY = "subscription-tracker.subscriptions";

/** 保存できなかった時のお知らせ（docs/design.md 7.） */
export const SAVE_ERROR_MESSAGE =
  "保存できませんでした。ブラウザの設定で、このサイトの保存が許可されているか確かめてください";

/** localStorage のうち使う所だけ（テストで差し替えられるように） */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 保存した1件の形が合っているか */
export function isSubscription(value: unknown): value is Subscription {
  if (!isRecord(value)) return false;
  const { id, name, amount, cycle, nextDate } = value;
  return (
    typeof id === "string" &&
    id !== "" &&
    typeof name === "string" &&
    name.trim() !== "" &&
    name.length <= NAME_MAX_LENGTH &&
    typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    (cycle === "monthly" || cycle === "yearly") &&
    typeof nextDate === "string" &&
    isDateString(nextDate)
  );
}

/** 保存した文字を読む。壊れていたら空。形の合わない1件だけは捨てる */
export function parseSubscriptions(raw: string | null): Subscription[] {
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.filter(isSubscription);
}

/** 端末から読む。読めない時は空 */
export function readSubscriptions(storage: KeyValueStorage | null): Subscription[] {
  return parseSubscriptions(readRaw(storage));
}

/** 端末から保存した文字をそのまま読む。読めない時は null */
export function readRaw(storage: KeyValueStorage | null): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 端末に保存する。保存できたら true */
export function writeSubscriptions(storage: KeyValueStorage | null, subs: readonly Subscription[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(subs));
    return true;
  } catch {
    return false;
  }
}

/** 新しい id を作る */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
