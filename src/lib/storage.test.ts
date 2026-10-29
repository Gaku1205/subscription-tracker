import { describe, expect, it } from "vitest";
import {
  parseSubscriptions,
  readSubscriptions,
  STORAGE_KEY,
  writeSubscriptions,
  type KeyValueStorage,
} from "./storage";
import type { Subscription } from "./subscription";

const netflix: Subscription = { id: "1", name: "Netflix", amount: 1490, cycle: "monthly", nextDate: "2026-11-03" };
const adobe: Subscription = { id: "2", name: "Adobe", amount: 15600, cycle: "yearly", nextDate: "2026-12-20" };

function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("parseSubscriptions", () => {
  it("保存した配列を読む", () => {
    expect(parseSubscriptions(JSON.stringify([netflix, adobe]))).toEqual([netflix, adobe]);
  });

  it("無い・壊れている時は空", () => {
    expect(parseSubscriptions(null)).toEqual([]);
    expect(parseSubscriptions("{broken")).toEqual([]);
    expect(parseSubscriptions(JSON.stringify({ a: 1 }))).toEqual([]);
  });

  it("形の合わない1件だけ捨てる", () => {
    const raw = JSON.stringify([netflix, { ...adobe, amount: "15600" }, { ...adobe, nextDate: "2026-02-30" }, null]);
    expect(parseSubscriptions(raw)).toEqual([netflix]);
  });
});

describe("読み書き", () => {
  it("書いた物を読める", () => {
    const storage = memoryStorage();
    expect(writeSubscriptions(storage, [netflix, adobe])).toBe(true);
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(readSubscriptions(storage)).toEqual([netflix, adobe]);
  });

  it("読めない時は空、保存できない時は false", () => {
    expect(readSubscriptions(brokenStorage)).toEqual([]);
    expect(writeSubscriptions(brokenStorage, [netflix])).toBe(false);
    expect(readSubscriptions(null)).toEqual([]);
    expect(writeSubscriptions(null, [netflix])).toBe(false);
  });
});
