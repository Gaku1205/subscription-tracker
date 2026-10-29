import { parseDate, type DateString } from "./date";
import type { Cycle } from "./subscription";

/** 3桁ごとの「,」だけを入れる（「円」は付けない） */
export function formatNumber(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 金額：「1,490円」 */
export function formatYen(n: number): string {
  return `${formatNumber(n)}円`;
}

/** 一覧・目盛りの日付：「11/3」。年が今年と違う時だけ「2027/1/5」 */
export function formatShortDate(date: DateString, today: DateString): string {
  const d = parseDate(date);
  const t = parseDate(today);
  if (!d) return date;
  if (t && d.year === t.year) return `${d.month}/${d.day}`;
  return `${d.year}/${d.month}/${d.day}`;
}

/** 次の更新の日付：「11月3日」。年が今年と違う時だけ「2027年1月5日」 */
export function formatLongDate(date: DateString, today: DateString): string {
  const d = parseDate(date);
  const t = parseDate(today);
  if (!d) return date;
  if (t && d.year === t.year) return `${d.month}月${d.day}日`;
  return `${d.year}年${d.month}月${d.day}日`;
}

/** あと何日：「今日」「明日」「あと5日」 */
export function formatDaysLeft(days: number): string {
  if (days <= 0) return "今日";
  if (days === 1) return "明日";
  return `あと${days}日`;
}

/** 一覧の金額の下：「／月」「／年」 */
export function formatCycleSuffix(cycle: Cycle): string {
  return cycle === "yearly" ? "／年" : "／月";
}
