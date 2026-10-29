"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import type { DateString } from "@/lib/date";
import { formatYen } from "@/lib/format";
import { NAME_MAX_LENGTH, type Cycle } from "@/lib/subscription";
import {
  parseAmount,
  validateDraft,
  type DraftErrors,
  type DraftField,
  type SubscriptionDraft,
  type ValidDraft,
} from "@/lib/validation";

export const DESKTOP_QUERY = "(min-width: 1024px)";

interface SubscriptionFormProps {
  draft: SubscriptionDraft;
  onDraftChange: (draft: SubscriptionDraft) => void;
  errors: DraftErrors;
  onErrorsChange: (errors: DraftErrors) => void;
  today: DateString;
  /** 検査を通った値を保存する。保存できたら true */
  onAdd: (value: ValidDraft) => boolean;
  /** 出した時に名前の欄へフォーカスするか（"desktop" は PC の幅の時だけ） */
  focusOnMount?: boolean | "desktop";
  /** 追加できた後、名前の欄へフォーカスを戻すか（PC の右列で続けて入れるため） */
  refocusAfterAdd?: boolean;
}

const CYCLE_OPTIONS: readonly { value: Cycle; label: string }[] = [
  { value: "monthly", label: "毎月" },
  { value: "yearly", label: "毎年" },
];

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <span className="error-mark" aria-hidden="true">
        !
      </span>
      {message}
    </p>
  );
}

/** サブスクを足す入力欄（スマホのシートと PC の右列で使う） */
export function SubscriptionForm({
  draft,
  onDraftChange,
  errors,
  onErrorsChange,
  today,
  onAdd,
  focusOnMount = false,
  refocusAfterAdd = false,
}: SubscriptionFormProps) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const cycleRefs = useRef<Record<Cycle, HTMLButtonElement | null>>({ monthly: null, yearly: null });
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    if (focusOnMount === false) return;
    if (focusOnMount === "desktop" && !window.matchMedia(DESKTOP_QUERY).matches) return;
    nameRef.current?.focus();
    // 出した時の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refs: Record<DraftField, RefObject<HTMLInputElement | null>> = {
    name: nameRef,
    amount: amountRef,
    nextDate: dateRef,
  };

  function update(field: keyof SubscriptionDraft, value: string) {
    onDraftChange({ ...draft, [field]: value });
    if (field !== "cycle" && errors[field]) {
      const rest = { ...errors };
      delete rest[field];
      onErrorsChange(rest);
    }
  }

  function selectCycle(cycle: Cycle, moveFocus: boolean) {
    onDraftChange({ ...draft, cycle });
    if (moveFocus) cycleRefs.current[cycle]?.focus();
  }

  function onCycleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    selectCycle(draft.cycle === "monthly" ? "yearly" : "monthly", true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateDraft(draft, today);
    if (!result.ok) {
      onErrorsChange(result.errors);
      refs[result.firstInvalid].current?.focus();
      return;
    }
    onErrorsChange({});
    const saved = onAdd(result.value);
    if (saved && refocusAfterAdd) nameRef.current?.focus();
  }

  const amount = parseAmount(draft.amount);
  const showReadback = !amountFocused && !errors.amount && typeof amount === "number";
  const nameErrorId = `${id}-name-error`;
  const amountErrorId = `${id}-amount-error`;
  const amountReadbackId = `${id}-amount-readback`;
  const dateErrorId = `${id}-date-error`;
  const cycleLabelId = `${id}-cycle-label`;

  return (
    <form className="form" noValidate onSubmit={onSubmit}>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-name`}>
          名前
        </label>
        <input
          ref={nameRef}
          id={`${id}-name`}
          className="input"
          type="text"
          autoComplete="off"
          maxLength={NAME_MAX_LENGTH}
          placeholder="例：Netflix"
          value={draft.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
        />
        <FieldError id={nameErrorId} message={errors.name} />
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`${id}-amount`}>
          金額
        </label>
        <div className="amount-wrap">
          <input
            ref={amountRef}
            id={`${id}-amount`}
            className="input num input-amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="例：1490"
            value={draft.amount}
            onChange={(e) => update("amount", e.target.value)}
            onFocus={() => setAmountFocused(true)}
            onBlur={() => setAmountFocused(false)}
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? amountErrorId : showReadback ? amountReadbackId : undefined}
          />
          <span className="amount-unit" aria-hidden="true">
            円
          </span>
        </div>
        <FieldError id={amountErrorId} message={errors.amount} />
        {showReadback && (
          <p id={amountReadbackId} className="num amount-readback">
            {formatYen(amount)}
          </p>
        )}
      </div>

      <div className="field">
        <span id={cycleLabelId} className="field-label">
          支払いの周期
        </span>
        <div className="cycle" role="radiogroup" aria-labelledby={cycleLabelId}>
          {CYCLE_OPTIONS.map((option) => {
            const checked = draft.cycle === option.value;
            return (
              <button
                key={option.value}
                ref={(el) => {
                  cycleRefs.current[option.value] = el;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className={checked ? "cycle-option is-checked" : "cycle-option"}
                onClick={() => selectCycle(option.value, false)}
                onKeyDown={onCycleKeyDown}
              >
                {checked && (
                  <span className="cycle-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor={`${id}-date`}>
          次の更新日
        </label>
        <input
          ref={dateRef}
          id={`${id}-date`}
          className="input num input-date"
          type="date"
          min={today}
          value={draft.nextDate}
          onChange={(e) => update("nextDate", e.target.value)}
          aria-invalid={errors.nextDate ? true : undefined}
          aria-describedby={errors.nextDate ? dateErrorId : undefined}
        />
        <FieldError id={dateErrorId} message={errors.nextDate} />
      </div>

      <button type="submit" className="btn-primary form-submit">
        追加する
      </button>
    </form>
  );
}
