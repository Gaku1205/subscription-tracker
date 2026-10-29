import { describe, expect, it } from "vitest";
import { upcomingList, type Subscription } from "./subscription";
import { timelineMarks, timelinePosition, timelineTicks } from "./timeline";

const TODAY = "2026-10-29";

function sub(id: string, nextDate: string): Subscription {
  return { id, name: id, amount: 100, cycle: "monthly", nextDate };
}

describe("timelinePosition", () => {
  it("今日から何日後か ÷ 30", () => {
    expect(timelinePosition(0)).toBe(0);
    expect(timelinePosition(15)).toBe(0.5);
    expect(timelinePosition(30)).toBe(1);
  });
});

describe("timelineMarks", () => {
  it("30日後までの更新を日ごとにまとめる", () => {
    const list = upcomingList(
      [
        sub("a", "2026-10-29"), // 今日
        sub("b", "2026-11-01"), // 3日後
        sub("c", "2026-11-02"), // 4日後
        sub("d", "2026-11-28"), // 30日後
        sub("e", "2026-11-29"), // 31日後（入らない）
      ],
      TODAY,
    );
    const marks = timelineMarks(list);
    expect(marks.map((m) => m.days)).toEqual([0, 3, 4, 30]);
    expect(marks.map((m) => m.position)).toEqual([0, 0.1, 4 / 30, 1]);
  });

  it("3日以内は四角い印", () => {
    const marks = timelineMarks(upcomingList([sub("a", "2026-11-01"), sub("b", "2026-11-02")], TODAY));
    expect(marks.map((m) => m.soon)).toEqual([true, false]);
  });

  it("同じ日は最大3つまで重ね、残りを数える", () => {
    const marks = timelineMarks(
      upcomingList(["a", "b", "c", "d", "e"].map((id) => sub(id, "2026-11-10")), TODAY),
    );
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({ count: 5, stack: 3, overflow: 2 });
  });

  it("30日より先しか無い時は空", () => {
    expect(timelineMarks(upcomingList([sub("a", "2026-12-20")], TODAY))).toEqual([]);
  });
});

describe("timelineTicks", () => {
  it("今日・7日後・14日後・21日後・30日後", () => {
    const ticks = timelineTicks(TODAY);
    expect(ticks.map((t) => t.label)).toEqual(["今日", "11/5", "11/12", "11/19", "11/28"]);
    expect(ticks.map((t) => t.align)).toEqual(["start", "center", "center", "center", "end"]);
  });

  it("年をまたぐ時は年を付ける", () => {
    expect(timelineTicks("2026-12-20").map((t) => t.label)).toEqual([
      "今日",
      "12/27",
      "2027/1/3",
      "2027/1/10",
      "2027/1/19",
    ]);
  });
});
