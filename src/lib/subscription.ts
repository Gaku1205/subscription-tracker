import { addMonths, daysBetween, parseDate, type DateString } from "./date";

/** 支払いの周期 */
export type Cycle = "monthly" | "yearly";

/** サブスク1件 */
export interface Subscription {
  id: string;
  name: string;
  /** 1回に払う金額（円・整数） */
  amount: number;
  cycle: Cycle;
  /** 保存した次の更新日。過ぎていたら表示の時に周期ぶん進める */
  nextDate: DateString;
}

/** 名前の最大の長さ */
export const NAME_MAX_LENGTH = 30;

/** 「あと3日以内」の境目 */
export const SOON_DAYS = 3;

/** 周期の月数 */
function cycleMonths(cycle: Cycle): number {
  return cycle === "yearly" ? 12 : 1;
}

/**
 * 次の更新日。保存した日が今日より前なら、周期ぶん進めて今日以降になる最初の日を返す。
 * 毎回「保存した日」から数えるので、月末に丸めても次の周期で元の日に戻る。
 */
export function nextRenewalDate(nextDate: DateString, cycle: Cycle, today: DateString): DateString {
  if (nextDate >= today) return nextDate;
  const step = cycleMonths(cycle);
  const from = parseDate(nextDate);
  const to = parseDate(today);
  if (!from || !to) return nextDate;
  // 月の差から当たりを付けて、少し手前から数え始める
  const monthGap = (to.year - from.year) * 12 + (to.month - from.month);
  let k = Math.max(1, Math.floor(monthGap / step) - 1);
  let candidate = addMonths(nextDate, k * step);
  while (candidate < today) {
    k += 1;
    candidate = addMonths(nextDate, k * step);
  }
  return candidate;
}

/** 年払いの月あたり（1円未満は四捨五入）。毎月ならそのままの金額 */
export function monthlyAmount(sub: Pick<Subscription, "amount" | "cycle">): number {
  return sub.cycle === "yearly" ? Math.round(sub.amount / 12) : sub.amount;
}

/** 毎月の支払い合計（年払いは月あたりを足す） */
export function monthlyTotal(subs: readonly Subscription[]): number {
  return subs.reduce((sum, sub) => sum + monthlyAmount(sub), 0);
}

/** 年間の支払い合計（毎月は ×12、毎年はそのまま） */
export function yearlyTotal(subs: readonly Subscription[]): number {
  return subs.reduce((sum, sub) => sum + (sub.cycle === "yearly" ? sub.amount : sub.amount * 12), 0);
}

/** 年払いが1件でもあるか */
export function hasYearly(subs: readonly Subscription[]): boolean {
  return subs.some((sub) => sub.cycle === "yearly");
}

/** 一覧の1行に出す物 */
export interface UpcomingItem {
  sub: Subscription;
  /** 次の更新日（過ぎていたら進めた後） */
  date: DateString;
  /** 今日から何日後か */
  days: number;
}

/** 次の更新日が近い順に並べる。同じ日は渡した順（追加した順）のまま */
export function upcomingList(subs: readonly Subscription[], today: DateString): UpcomingItem[] {
  return subs
    .map((sub) => {
      const date = nextRenewalDate(sub.nextDate, sub.cycle, today);
      return { sub, date, days: daysBetween(today, date) };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** あと3日以内（今日を含む）か */
export function isSoon(days: number): boolean {
  return days >= 0 && days <= SOON_DAYS;
}

/** 「次の更新」に出す物 */
export interface NextRenewal {
  date: DateString;
  days: number;
  /** その日に更新が来る物（一覧の順） */
  items: UpcomingItem[];
  /** その日の金額の合計 */
  total: number;
}

/** いちばん近い更新日と、その日に更新が来る物。並べた一覧を渡す */
export function nextRenewal(list: readonly UpcomingItem[]): NextRenewal | null {
  const first = list[0];
  if (!first) return null;
  const items = list.filter((item) => item.date === first.date);
  return {
    date: first.date,
    days: first.days,
    items,
    total: items.reduce((sum, item) => sum + item.sub.amount, 0),
  };
}
