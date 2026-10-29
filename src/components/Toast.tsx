"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  /** 同じ文言が続いても出し直せるように、出すたびに変える */
  key: number;
  text: string;
  /** true なら消さずに残し、「閉じる」を付ける */
  persistent: boolean;
  /** 付ける弱いボタン（「元に戻す」）。押すとお知らせは消える */
  action?: { label: string; onClick: () => void };
  /** 出ている時間。省くと 4秒 */
  showMs?: number;
}

/** 出ている時間と、消える動きの時間（docs/design.md 6.・8.） */
export const SHOW_MS = 4000;
export const UNDO_SHOW_MS = 8000;
const FADE_MS = 150;

interface ToastProps {
  toast: ToastMessage | null;
  onDone: () => void;
}

function ToastBody({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (toast.persistent) return;
    const showMs = toast.showMs ?? SHOW_MS;
    const hide = window.setTimeout(() => setLeaving(true), showMs);
    const done = window.setTimeout(onDone, showMs + FADE_MS);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [toast, onDone]);

  function close() {
    setLeaving(true);
    window.setTimeout(onDone, FADE_MS);
  }

  return (
    <div className={leaving ? "toast is-leaving" : "toast"}>
      <span className="toast-text">{toast.text}</span>
      {toast.action && (
        <button
          type="button"
          className="btn-weak toast-button"
          onClick={() => {
            toast.action?.onClick();
          }}
        >
          {toast.action.label}
        </button>
      )}
      {toast.persistent && (
        <button type="button" className="btn-weak toast-button" onClick={close}>
          閉じる
        </button>
      )}
    </div>
  );
}

/** 下に出るお知らせ。読み上げのために入れ物はいつも置いておく */
export function Toast({ toast, onDone }: ToastProps) {
  return (
    <div className="toast-region" role="status">
      {toast && <ToastBody key={toast.key} toast={toast} onDone={onDone} />}
    </div>
  );
}
