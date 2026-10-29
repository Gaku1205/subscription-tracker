import { describe, expect, it } from "vitest";
import { ERROR_MESSAGES, parseAmount, validateDraft, type SubscriptionDraft } from "./validation";

const TODAY = "2026-10-29";

function draft(overrides: Partial<SubscriptionDraft> = {}): SubscriptionDraft {
  return { name: "Netflix", amount: "1490", cycle: "monthly", nextDate: "2026-11-03", ...overrides };
}

describe("parseAmount", () => {
  it("整数にする（全角数字・「,」も受け付ける）", () => {
    expect(parseAmount("1490")).toBe(1490);
    expect(parseAmount(" 1,490 ")).toBe(1490);
    expect(parseAmount("１４９０")).toBe(1490);
  });

  it("数字でない・0以下", () => {
    expect(parseAmount("")).toBe("notNumber");
    expect(parseAmount("abc")).toBe("notNumber");
    expect(parseAmount("14.5")).toBe("notNumber");
    expect(parseAmount("0")).toBe("notPositive");
    expect(parseAmount("-100")).toBe("notPositive");
  });
});

describe("validateDraft", () => {
  it("正しい入力は通る（名前の前後の空白は除く）", () => {
    const result = validateDraft(draft({ name: "  Netflix  ", cycle: "yearly" }), TODAY);
    expect(result).toEqual({
      ok: true,
      value: { name: "Netflix", amount: 1490, cycle: "yearly", nextDate: "2026-11-03" },
    });
  });

  it("今日の日付は通る", () => {
    expect(validateDraft(draft({ nextDate: TODAY }), TODAY).ok).toBe(true);
  });

  it("5つの文言どおりに出る", () => {
    const empty = validateDraft(draft({ name: " ", amount: "", nextDate: "" }), TODAY);
    expect(empty).toEqual({
      ok: false,
      firstInvalid: "name",
      errors: {
        name: "名前を入れてください",
        amount: "金額を数字で入れてください（例：1490）",
        nextDate: "次の更新日を選んでください",
      },
    });

    const wrong = validateDraft(draft({ amount: "0", nextDate: "2026-10-28" }), TODAY);
    expect(wrong).toEqual({
      ok: false,
      firstInvalid: "amount",
      errors: { amount: "1円以上で入れてください", nextDate: "今日以降の日付を選んでください" },
    });
  });

  it("最初のエラーの欄を返す", () => {
    const result = validateDraft(draft({ nextDate: "" }), TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.firstInvalid).toBe("nextDate");
      expect(result.errors).toEqual({ nextDate: ERROR_MESSAGES.dateEmpty });
    }
  });
});
