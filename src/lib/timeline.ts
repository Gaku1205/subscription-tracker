import { addDays, type DateString } from "./date";
import { formatShortDate } from "./format";
import { isSoon, type UpcomingItem } from "./subscription";

/** 帯の長さ（日） */
export const TIMELINE_DAYS = 30;

/** 同じ日に重ねる印の最大数 */
export const MAX_STACK = 3;

/** 帯の印（同じ日の更新を1つにまとめた物） */
export interface TimelineMark {
  date: DateString;
  days: number;
  /** 線の左端を 0、右端を 1 とした位置 */
  position: number;
  /** その日の件数 */
  count: number;
  /** 重ねて描く印の数（最大3） */
  stack: number;
  /** 3つより多い分（「+2」など。無ければ 0） */
  overflow: number;
  /** あと3日以内なら四角い印 */
  soon: boolean;
}

/** 帯の位置（今日から何日後か ÷ 30。0〜1 に収める） */
export function timelinePosition(days: number): number {
  return Math.min(1, Math.max(0, days / TIMELINE_DAYS));
}

/** 今日から30日後までの更新を、日ごとの印にする。並べた一覧を渡す */
export function timelineMarks(list: readonly UpcomingItem[]): TimelineMark[] {
  const marks: TimelineMark[] = [];
  for (const item of list) {
    if (item.days < 0 || item.days > TIMELINE_DAYS) continue;
    const last = marks[marks.length - 1];
    if (last && last.date === item.date) {
      last.count += 1;
      last.stack = Math.min(MAX_STACK, last.count);
      last.overflow = Math.max(0, last.count - MAX_STACK);
      continue;
    }
    marks.push({
      date: item.date,
      days: item.days,
      position: timelinePosition(item.days),
      count: 1,
      stack: 1,
      overflow: 0,
      soon: isSoon(item.days),
    });
  }
  return marks;
}

/** 目盛り */
export interface TimelineTick {
  days: number;
  position: number;
  label: string;
  align: "start" | "center" | "end";
}

const TICK_DAYS = [0, 7, 14, 21, 30] as const;

/** 下の目盛り（今日・7日後・14日後・21日後・30日後） */
export function timelineTicks(today: DateString): TimelineTick[] {
  return TICK_DAYS.map((days, index) => ({
    days,
    position: timelinePosition(days),
    label: days === 0 ? "今日" : formatShortDate(addDays(today, days), today),
    align: index === 0 ? "start" : index === TICK_DAYS.length - 1 ? "end" : "center",
  }));
}
