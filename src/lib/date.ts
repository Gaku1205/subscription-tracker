/** 日付は `YYYY-MM-DD` の文字列で扱う（時刻やタイムゾーンを持ち込まないため） */
export type DateString = string;

interface DateParts {
  year: number;
  month: number; // 1〜12
  day: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** その月の日数 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** `YYYY-MM-DD` を年・月・日に分ける。形が違う・存在しない日付なら null */
export function parseDate(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** 正しい `YYYY-MM-DD` か */
export function isDateString(value: string): boolean {
  return parseDate(value) !== null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 年・月・日から `YYYY-MM-DD` を作る */
export function toDateString(year: number, month: number, day: number): DateString {
  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

/** この端末の日付で「今日」を返す */
export function todayString(now: Date = new Date()): DateString {
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function toUtcMs(value: DateString): number {
  const parts = parseDate(value);
  if (!parts) throw new Error(`日付の形が違います: ${value}`);
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/** from から to までの日数（to が先なら正） */
export function daysBetween(from: DateString, to: DateString): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** n 日後 */
export function addDays(value: DateString, n: number): DateString {
  const d = new Date(toUtcMs(value) + n * DAY_MS);
  return toDateString(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** n か月後。その月に同じ日が無い時は月の最終日にする */
export function addMonths(value: DateString, n: number): DateString {
  const parts = parseDate(value);
  if (!parts) throw new Error(`日付の形が違います: ${value}`);
  const index = parts.year * 12 + (parts.month - 1) + n;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toDateString(year, month, Math.min(parts.day, daysInMonth(year, month)));
}

/** n 年後。2月29日は、うるう年でなければ2月28日にする */
export function addYears(value: DateString, n: number): DateString {
  return addMonths(value, n * 12);
}
