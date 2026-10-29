import { describe, expect, it } from "vitest";
import {
  hasYearly,
  isSoon,
  monthlyAmount,
  monthlyTotal,
  nextRenewal,
  nextRenewalDate,
  upcomingList,
  yearlyTotal,
  type Subscription,
} from "./subscription";

const TODAY = "2026-10-29";

function sub(id: string, name: string, amount: number, cycle: Subscription["cycle"], nextDate: string): Subscription {
  return { id, name, amount, cycle, nextDate };
}

describe("nextRenewalDate", () => {
  it("今日以降ならそのまま", () => {
    expect(nextRenewalDate("2026-10-29", "monthly", TODAY)).toBe("2026-10-29");
    expect(nextRenewalDate("2026-11-03", "yearly", TODAY)).toBe("2026-11-03");
  });

  it("過ぎた毎月は月を進める", () => {
    expect(nextRenewalDate("2026-10-28", "monthly", TODAY)).toBe("2026-11-28");
    expect(nextRenewalDate("2026-09-30", "monthly", TODAY)).toBe("2026-10-30");
    expect(nextRenewalDate("2024-03-29", "monthly", TODAY)).toBe("2026-10-29");
  });

  it("過ぎた毎月の月末は、その月の最終日に丸め、次の月は元の日に戻る", () => {
    expect(nextRenewalDate("2026-01-31", "monthly", "2026-02-10")).toBe("2026-02-28");
    expect(nextRenewalDate("2026-01-31", "monthly", "2026-03-01")).toBe("2026-03-31");
    expect(nextRenewalDate("2026-08-31", "monthly", TODAY)).toBe("2026-10-31");
    expect(nextRenewalDate("2026-08-31", "monthly", "2026-11-01")).toBe("2026-11-30");
  });

  it("過ぎた毎年は年を進める", () => {
    expect(nextRenewalDate("2025-11-03", "yearly", TODAY)).toBe("2026-11-03");
    expect(nextRenewalDate("2024-10-01", "yearly", TODAY)).toBe("2027-10-01");
    expect(nextRenewalDate("2028-02-29", "yearly", "2028-03-01")).toBe("2029-02-28");
  });
});

describe("合計", () => {
  const subs = [
    sub("1", "Netflix", 1490, "monthly", "2026-11-03"),
    sub("2", "Spotify", 980, "monthly", "2026-11-08"),
    sub("3", "Adobe", 15600, "yearly", "2026-12-20"),
  ];

  it("年払いは12で割って足す", () => {
    expect(monthlyAmount(subs[2])).toBe(1300);
    expect(monthlyTotal(subs)).toBe(1490 + 980 + 1300);
  });

  it("月あたりは1円未満を四捨五入", () => {
    expect(monthlyAmount({ amount: 1000, cycle: "yearly" })).toBe(83);
    expect(monthlyAmount({ amount: 1010, cycle: "yearly" })).toBe(84);
    expect(monthlyAmount({ amount: 6, cycle: "yearly" })).toBe(1);
  });

  it("年間は毎月×12＋毎年", () => {
    expect(yearlyTotal(subs)).toBe((1490 + 980) * 12 + 15600);
  });

  it("0件は0円", () => {
    expect(monthlyTotal([])).toBe(0);
    expect(yearlyTotal([])).toBe(0);
  });

  it("年払いがあるか", () => {
    expect(hasYearly(subs)).toBe(true);
    expect(hasYearly(subs.slice(0, 2))).toBe(false);
  });
});

describe("upcomingList", () => {
  it("次の更新日が近い順。同じ日は追加した順", () => {
    const list = upcomingList(
      [
        sub("a", "Adobe", 15600, "yearly", "2026-12-20"),
        sub("b", "Spotify", 980, "monthly", "2026-11-08"),
        sub("c", "Netflix", 1490, "monthly", "2026-11-03"),
        sub("d", "iCloud", 130, "monthly", "2026-10-03"), // 過ぎている → 11/3
      ],
      TODAY,
    );
    expect(list.map((item) => item.sub.id)).toEqual(["c", "d", "b", "a"]);
    expect(list.map((item) => item.days)).toEqual([5, 5, 10, 52]);
  });
});

describe("nextRenewal", () => {
  it("1件だけの日", () => {
    const list = upcomingList([sub("1", "Netflix", 1490, "monthly", "2026-11-03")], TODAY);
    const next = nextRenewal(list);
    expect(next?.date).toBe("2026-11-03");
    expect(next?.days).toBe(5);
    expect(next?.items).toHaveLength(1);
    expect(next?.total).toBe(1490);
  });

  it("同じ日が複数なら合計する", () => {
    const list = upcomingList(
      [
        sub("1", "Netflix", 1490, "monthly", "2026-11-03"),
        sub("2", "Spotify", 980, "monthly", "2026-11-03"),
        sub("3", "Hulu", 1026, "monthly", "2026-11-04"),
      ],
      TODAY,
    );
    const next = nextRenewal(list);
    expect(next?.items.map((item) => item.sub.name)).toEqual(["Netflix", "Spotify"]);
    expect(next?.total).toBe(2470);
  });

  it("0件なら null", () => {
    expect(nextRenewal([])).toBeNull();
  });
});

describe("isSoon", () => {
  it("今日を含めあと3日以内", () => {
    expect(isSoon(0)).toBe(true);
    expect(isSoon(3)).toBe(true);
    expect(isSoon(4)).toBe(false);
  });
});
