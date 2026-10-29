"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export type SheetPhase = "open" | "closing";

interface AddSheetProps {
  phase: SheetPhase;
  onClose: () => void;
  /** 題名（「サブスクを足す」か「サブスクを直す」） */
  title: string;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** スマホの入力シート（下から出る） */
export function AddSheet({ phase, onClose, title, children }: AddSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);

  // フォーカスをシートの中に留める。Esc で閉じる
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !sheetRef.current) return;
    const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={`sheet-root is-${phase}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <div className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button type="button" className="btn-weak" onClick={onClose}>
            閉じる
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
