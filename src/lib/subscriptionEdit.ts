import type { DateString } from "./date";
import { nextRenewalDate, type Subscription } from "./subscription";
import type { SubscriptionDraft, ValidDraft } from "./validation";

/** 削除した1件と、消す前に並んでいた位置（元に戻す時に使う） */
export interface RemovedSubscription {
  sub: Subscription;
  index: number;
}

/** 直す時に入力欄へ入れる値。次の更新日は、一覧に出している日（過ぎていたら進めた後）にする */
export function draftFromSubscription(sub: Subscription, today: DateString): SubscriptionDraft {
  return {
    name: sub.name,
    amount: String(sub.amount),
    cycle: sub.cycle,
    nextDate: nextRenewalDate(sub.nextDate, sub.cycle, today),
  };
}

/** 1件を直す。id は変えず、並びの位置も変えない。見つからなければ null */
export function updateSubscription(
  subs: readonly Subscription[],
  id: string,
  value: ValidDraft,
): Subscription[] | null {
  if (!subs.some((sub) => sub.id === id)) return null;
  return subs.map((sub) => (sub.id === id ? { id, ...value } : sub));
}

/** 1件を消す。消した物と位置を一緒に返す。見つからなければ null */
export function removeSubscription(
  subs: readonly Subscription[],
  id: string,
): { subs: Subscription[]; removed: RemovedSubscription } | null {
  const index = subs.findIndex((sub) => sub.id === id);
  const target = subs[index];
  if (!target) return null;
  return {
    subs: subs.filter((sub) => sub.id !== id),
    removed: { sub: target, index },
  };
}

/** 消した物を元の位置に戻す。位置が範囲外なら末尾。すでに同じ id があれば何もしない */
export function restoreSubscription(subs: readonly Subscription[], removed: RemovedSubscription): Subscription[] {
  if (subs.some((sub) => sub.id === removed.sub.id)) return [...subs];
  const index = Math.min(Math.max(removed.index, 0), subs.length);
  return [...subs.slice(0, index), removed.sub, ...subs.slice(index)];
}
