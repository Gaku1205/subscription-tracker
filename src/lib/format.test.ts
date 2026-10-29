import { describe, expect, it } from "vitest";
import { formatCycleSuffix, formatDaysLeft, formatLongDate, formatShortDate, formatYen } from "./format";

describe("formatYen", () => {
  it("3桁ごとに「,」を入れ、後ろに「円」", () => {
    expect(formatYen(0)).toBe("0円");
    expect(formatYen(980)).toBe("980円");
    expect(formatYen(1490)).toBe("1,490円");
    expect(formatYen(148080)).toBe("148,080円");
    expect(formatYen(1234567)).toBe("1,234,567円");
  });
});

describe("日付", () => {
  const today = "2026-10-29";

  it("一覧・目盛りは「11/3」、年が違う時だけ年を付ける", () => {
    expect(formatShortDate("2026-11-03", today)).toBe("11/3");
    expect(formatShortDate("2027-01-05", today)).toBe("2027/1/5");
  });

  it("次の更新は「11月3日」、年が違う時だけ年を付ける", () => {
    expect(formatLongDate("2026-11-03", today)).toBe("11月3日");
    expect(formatLongDate("2027-01-05", today)).toBe("2027年1月5日");
  });
});

describe("formatDaysLeft", () => {
  it("今日・明日・あと○日", () => {
    expect(formatDaysLeft(0)).toBe("今日");
    expect(formatDaysLeft(1)).toBe("明日");
    expect(formatDaysLeft(5)).toBe("あと5日");
  });
});

describe("formatCycleSuffix", () => {
  it("／月・／年", () => {
    expect(formatCycleSuffix("monthly")).toBe("／月");
    expect(formatCycleSuffix("yearly")).toBe("／年");
  });
});
