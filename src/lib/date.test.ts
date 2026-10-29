import { describe, expect, it } from "vitest";
import { addDays, addMonths, addYears, daysBetween, isDateString, parseDate, todayString } from "./date";

describe("parseDate / isDateString", () => {
  it("正しい日付を分ける", () => {
    expect(parseDate("2026-11-03")).toEqual({ year: 2026, month: 11, day: 3 });
  });

  it("存在しない日付・形の違う文字は受け付けない", () => {
    expect(isDateString("2026-02-29")).toBe(false);
    expect(isDateString("2028-02-29")).toBe(true);
    expect(isDateString("2026-13-01")).toBe(false);
    expect(isDateString("2026/11/03")).toBe(false);
    expect(isDateString("")).toBe(false);
  });
});

describe("todayString", () => {
  it("端末の日付を YYYY-MM-DD にする", () => {
    expect(todayString(new Date(2026, 9, 29, 23, 59))).toBe("2026-10-29");
    expect(todayString(new Date(2027, 0, 5, 0, 0))).toBe("2027-01-05");
  });
});

describe("daysBetween / addDays", () => {
  it("今日からの日数を数える", () => {
    expect(daysBetween("2026-10-29", "2026-10-29")).toBe(0);
    expect(daysBetween("2026-10-29", "2026-11-03")).toBe(5);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("n 日後", () => {
    expect(addDays("2026-10-29", 30)).toBe("2026-11-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("addMonths / addYears", () => {
  it("月を進める", () => {
    expect(addMonths("2026-10-29", 1)).toBe("2026-11-29");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });

  it("月末は月の最終日に丸める", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
    expect(addMonths("2026-08-31", 1)).toBe("2026-09-30");
  });

  it("2月29日は、うるう年でない年は2月28日", () => {
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYears("2028-02-29", 4)).toBe("2032-02-29");
  });
});
