"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  /** 同じ文言が続いても出し直せるように、出すたびに変える */
  key: number;
  text: string;
  /** true なら消さずに残し、「閉じる」を付ける */
  persistent: boolean;
}

/** 出ている時間と、消える動きの時間（docs/design.md 6.・8.） */
const SHOW_MS = 4000;
const FADE_MS = 150;

interface ToastProps {
  toast: ToastMessage | null;
  onDone: () => void;
}

function ToastBody({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (toast.persistent) return;
    const hide = window.setTimeout(() => setLeaving(true), SHOW_MS);
    const done = window.setTimeout(onDone, SHOW_MS + FADE_MS);
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
