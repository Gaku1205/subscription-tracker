import { describe, expect, it } from "vitest";
import type { Subscription } from "./subscription";
import {
  draftFromSubscription,
  removeSubscription,
  restoreSubscription,
  updateSubscription,
} from "./subscriptionEdit";
import type { ValidDraft } from "./validation";

const a: Subscription = { id: "a", name: "Netflix", amount: 1490, cycle: "monthly", nextDate: "2026-11-03" };
const b: Subscription = { id: "b", name: "Spotify", amount: 980, cycle: "monthly", nextDate: "2026-11-08" };
const c: Subscription = { id: "c", name: "Cloud", amount: 15600, cycle: "yearly", nextDate: "2026-12-01" };
const all = [a, b, c];

const changed: ValidDraft = { name: "Spotify Duo", amount: 1280, cycle: "yearly", nextDate: "2026-12-25" };

describe("draftFromSubscription", () => {
  it("入力欄に入れる文字にする", () => {
    expect(draftFromSubscription(a, "2026-10-29")).toEqual({
      name: "Netflix",
      amount: "1490",
      cycle: "monthly",
      nextDate: "2026-11-03",
    });
  });

  it("過ぎた更新日は、一覧に出している日に進める", () => {
    const old: Subscription = { ...a, nextDate: "2026-09-03" };
    expect(draftFromSubscription(old, "2026-10-29").nextDate).toBe("2026-11-03");
  });
});

describe("updateSubscription", () => {
  it("その1件だけを直し、id と位置は変えない", () => {
    expect(updateSubscription(all, "b", changed)).toEqual([a, { id: "b", ...changed }, c]);
  });

  it("元の配列は変えない", () => {
    updateSubscription(all, "a", changed);
    expect(all).toEqual([a, b, c]);
  });

  it("無い id なら null", () => {
    expect(updateSubscription(all, "x", changed)).toBeNull();
  });
});

describe("removeSubscription", () => {
  it("消した物と位置を返す", () => {
    const result = removeSubscription(all, "b");
    expect(result?.subs).toEqual([a, c]);
    expect(result?.removed).toEqual({ sub: b, index: 1 });
  });

  it("無い id なら null", () => {
    expect(removeSubscription(all, "x")).toBeNull();
  });
});

describe("restoreSubscription", () => {
  it("どの位置でも元の位置に戻す", () => {
    for (const id of ["a", "b", "c"]) {
      const result = removeSubscription(all, id);
      if (!result) throw new Error("消せなかった");
      expect(restoreSubscription(result.subs, result.removed)).toEqual(all);
    }
  });

  it("件数が減っていて位置が範囲外なら末尾に戻す", () => {
    expect(restoreSubscription([a], { sub: c, index: 5 })).toEqual([a, c]);
  });

  it("すでにあれば増やさない", () => {
    expect(restoreSubscription(all, { sub: a, index: 0 })).toEqual(all);
  });
});
