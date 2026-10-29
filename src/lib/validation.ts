import { isDateString, type DateString } from "./date";
import { NAME_MAX_LENGTH, type Cycle } from "./subscription";

/** 入力欄に入っている途中の値（金額は入れたままの文字） */
export interface SubscriptionDraft {
  name: string;
  amount: string;
  cycle: Cycle;
  nextDate: string;
}

/** 検査する欄（画面の上からの順） */
export type DraftField = "name" | "amount" | "nextDate";

export const DRAFT_FIELDS: readonly DraftField[] = ["name", "amount", "nextDate"];

export const EMPTY_DRAFT: SubscriptionDraft = { name: "", amount: "", cycle: "monthly", nextDate: "" };

/** エラーの文言（docs/design.md 7.） */
export const ERROR_MESSAGES = {
  nameEmpty: "名前を入れてください",
  amountNotNumber: "金額を数字で入れてください（例：1490）",
  amountNotPositive: "1円以上で入れてください",
  dateEmpty: "次の更新日を選んでください",
  datePast: "今日以降の日付を選んでください",
} as const;

export type DraftErrors = Partial<Record<DraftField, string>>;

/** 検査を通った値 */
export interface ValidDraft {
  name: string;
  amount: number;
  cycle: Cycle;
  nextDate: DateString;
}

export type ValidationResult =
  | { ok: true; value: ValidDraft }
  | { ok: false; errors: DraftErrors; firstInvalid: DraftField };

/** 全角の数字・記号を半角にし、「,」と空白を除く */
function normalizeAmount(raw: string): string {
  return raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－−]/g, "-")
    .replace(/[,，\s]/g, "");
}

/**
 * 金額の文字を整数にする。
 * 数字でない時は "notNumber"、0以下は "notPositive"
 */
export function parseAmount(raw: string): number | "notNumber" | "notPositive" {
  const text = normalizeAmount(raw);
  if (!/^[+-]?\d+$/.test(text)) return "notNumber";
  const value = Number(text);
  if (!Number.isSafeInteger(value)) return "notNumber";
  if (value <= 0) return "notPositive";
  return value;
}

/** 入力を検査する。today は「今日」（YYYY-MM-DD） */
export function validateDraft(draft: SubscriptionDraft, today: DateString): ValidationResult {
  const errors: DraftErrors = {};

  const name = draft.name.trim().slice(0, NAME_MAX_LENGTH);
  if (name === "") errors.name = ERROR_MESSAGES.nameEmpty;

  const amount = parseAmount(draft.amount);
  if (amount === "notNumber") errors.amount = ERROR_MESSAGES.amountNotNumber;
  else if (amount === "notPositive") errors.amount = ERROR_MESSAGES.amountNotPositive;

  const nextDate = draft.nextDate.trim();
  if (nextDate === "" || !isDateString(nextDate)) errors.nextDate = ERROR_MESSAGES.dateEmpty;
  else if (nextDate < today) errors.nextDate = ERROR_MESSAGES.datePast;

  const firstInvalid = DRAFT_FIELDS.find((field) => errors[field] !== undefined);
  if (firstInvalid || typeof amount !== "number") {
    return { ok: false, errors, firstInvalid: firstInvalid ?? "amount" };
  }
  return { ok: true, value: { name, amount, cycle: draft.cycle, nextDate } };
}
