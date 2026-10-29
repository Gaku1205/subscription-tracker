"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAVE_ERROR_MESSAGE, createId } from "@/lib/storage";
import { nextRenewal, upcomingList } from "@/lib/subscription";
import { draftFromSubscription, type RemovedSubscription } from "@/lib/subscriptionEdit";
import {
  addSubscription,
  deleteSubscription,
  saveSubscription,
  undeleteSubscription,
  useSubscriptions,
  useToday,
} from "@/lib/subscriptionStore";
import { EMPTY_DRAFT, type DraftErrors, type SubscriptionDraft, type ValidDraft } from "@/lib/validation";
import { AddPanel } from "./AddPanel";
import { AddSheet, type SheetPhase } from "./AddSheet";
import { EmptyState } from "./EmptyState";
import { NextRenewalView } from "./NextRenewalView";
import { DESKTOP_QUERY, SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionList } from "./SubscriptionList";
import { Summary } from "./Summary";
import { Timeline } from "./Timeline";
import { Toast, UNDO_SHOW_MS, type ToastMessage } from "./Toast";

/** シートが閉じる動きの時間（docs/design.md 8.） */
const SHEET_CLOSE_MS = 150;

/** 足した・直した行の地が戻る時間（docs/design.md 8.）。終わったら印を外して、続けて直しても動くようにする */
const FLASH_MS = 1200;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface ToastExtras {
  action?: ToastMessage["action"];
  showMs?: number;
}

/** ページ全体（合計・次の更新・帯・一覧と、追加・直す・削除の入力） */
export function SubscriptionApp() {
  const subs = useSubscriptions();
  const today = useToday();
  const [draft, setDraft] = useState<SubscriptionDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SubscriptionDraft>(EMPTY_DRAFT);
  const [editErrors, setEditErrors] = useState<DraftErrors>({});
  const [sheet, setSheet] = useState<SheetPhase | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  // 出すたびに新しい物を入れる（同じ行が続いてもフォーカスを移せるように）
  const [focusRow, setFocusRow] = useState<{ id: string } | null>(null);
  const [focusNameTick, setFocusNameTick] = useState(0);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const toastKey = useRef(0);

  const list = useMemo(() => (subs && today ? upcomingList(subs, today) : []), [subs, today]);
  const next = nextRenewal(list);

  // 直している間にそのサブスクが無くなったら（ほかのタブで消した時など）、足す状態に戻る
  const editingSub = editId && subs ? subs.find((sub) => sub.id === editId) : undefined;
  const editing = editingSub !== undefined;

  // シートが出ている間は後ろを動かさない
  useEffect(() => {
    if (sheet === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  // 地を戻す動きが終わったら印を外す
  useEffect(() => {
    if (flashId === null) return;
    const timer = window.setTimeout(() => setFlashId(null), FLASH_MS + 50);
    return () => window.clearTimeout(timer);
  }, [flashId]);

  // 元に戻した行へフォーカスを移す（押したお知らせのボタンは消えるため）
  useEffect(() => {
    if (focusRow === null) return;
    document.querySelector<HTMLElement>(`[data-sub-id="${CSS.escape(focusRow.id)}"]`)?.focus();
  }, [focusRow]);

  // PC：削除のあと、右列の名前の欄へフォーカスを移す
  useEffect(() => {
    if (focusNameTick === 0) return;
    document.querySelector<HTMLElement>(".side-col input")?.focus();
  }, [focusNameTick]);

  const showToast = useCallback((text: string, persistent: boolean, extras: ToastExtras = {}) => {
    toastKey.current += 1;
    setToast({ key: toastKey.current, text, persistent, ...extras });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  function openSheet() {
    setSheet("open");
  }

  /** シートを閉じ、直す状態も終える。フォーカスは target（無ければ「サブスクを足す」）へ戻す */
  function closeSheet(target: HTMLElement | null = null) {
    if (sheet !== "open") return;
    const finish = () => {
      setSheet(null);
      setEditId(null);
      (target ?? openButtonRef.current)?.focus();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setSheet("closing");
    window.setTimeout(finish, SHEET_CLOSE_MS);
  }

  /** 押した行（まだ一覧にあれば） */
  function triggerRow(): HTMLElement | null {
    const trigger = triggerRef.current;
    return trigger && trigger.isConnected ? trigger : null;
  }

  /** 直す状態を終える。スマホはシートを閉じ、PC は右列を「足す」に戻す */
  function leaveEdit(target: HTMLElement | null) {
    if (sheet !== null) {
      closeSheet(target);
      return;
    }
    setEditId(null);
    if (target) target.focus();
    else setFocusNameTick((tick) => tick + 1);
  }

  function onAdd(value: ValidDraft): boolean {
    const sub = { id: createId(), ...value };
    if (!addSubscription(sub)) {
      showToast(SAVE_ERROR_MESSAGE, true);
      return false;
    }
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setFlashId(sub.id);
    showToast(`「${sub.name}」を追加しました`, false);
    closeSheet();
    return true;
  }

  function onSelect(id: string, trigger: HTMLButtonElement) {
    const sub = subs?.find((item) => item.id === id);
    if (!sub || !today) return;
    triggerRef.current = trigger;
    setEditId(id);
    setEditDraft(draftFromSubscription(sub, today));
    setEditErrors({});
    if (!window.matchMedia(DESKTOP_QUERY).matches) setSheet("open");
  }

  function onSave(value: ValidDraft): boolean {
    if (!editingSub) return false;
    if (!saveSubscription(editingSub.id, value)) {
      showToast(SAVE_ERROR_MESSAGE, true);
      return false;
    }
    setFlashId(editingSub.id);
    showToast(`「${value.name}」の変更を保存しました`, false);
    leaveEdit(triggerRow());
    return true;
  }

  function onCancel() {
    leaveEdit(triggerRow());
  }

  function undo(removed: RemovedSubscription) {
    if (!undeleteSubscription(removed)) {
      showToast(SAVE_ERROR_MESSAGE, true);
      return;
    }
    setFlashId(removed.sub.id);
    setFocusRow({ id: removed.sub.id });
    showToast(`「${removed.sub.name}」を元に戻しました`, false);
  }

  function onDelete() {
    if (!editingSub) return;
    const removed = deleteSubscription(editingSub.id);
    if (!removed) {
      showToast(SAVE_ERROR_MESSAGE, true);
      return;
    }
    showToast(`「${removed.sub.name}」を削除しました`, false, {
      action: { label: "元に戻す", onClick: () => undo(removed) },
      showMs: UNDO_SHOW_MS,
    });
    leaveEdit(null);
  }

  const loading = subs === null || today === null;

  const form = (focusOnMount: boolean | "desktop", refocusAfterAdd: boolean) =>
    today && (
      <SubscriptionForm
        key={editing ? `edit-${editId}` : "add"}
        draft={editing ? editDraft : draft}
        onDraftChange={editing ? setEditDraft : setDraft}
        errors={editing ? editErrors : errors}
        onErrorsChange={editing ? setEditErrors : setErrors}
        today={today}
        onAdd={editing ? onSave : onAdd}
        edit={editing ? { onDelete, onCancel } : undefined}
        focusOnMount={focusOnMount}
        refocusAfterAdd={editing ? false : refocusAfterAdd}
      />
    );

  const title = editing ? "サブスクを直す" : "サブスクを足す";

  return (
    <>
      <main className="page">
        <h1 className="title">サブスクの支払い</h1>
        <div className="layout">
          <div className="main-col">
            <div className="overview">
              <Summary subs={loading ? null : subs} />
              {!loading && next && (
                <>
                  <hr className="divider overview-divider" />
                  <NextRenewalView next={next} today={today} />
                </>
              )}
            </div>
            {!loading && (
              <>
                <hr className="divider" />
                {next ? (
                  <>
                    <Timeline list={list} today={today} />
                    <SubscriptionList
                      list={list}
                      today={today}
                      flashId={flashId}
                      editingId={editingSub?.id ?? null}
                      onSelect={onSelect}
                    />
                  </>
                ) : (
                  <EmptyState />
                )}
              </>
            )}
          </div>
          {!loading && (
            <aside className="side-col">
              <AddPanel title={title}>{form(editing ? "desktop" : subs.length === 0 ? "desktop" : false, true)}</AddPanel>
            </aside>
          )}
        </div>
      </main>

      {!loading && (
        <div className="add-bar">
          <div className="add-bar-inner">
            <button ref={openButtonRef} type="button" className="btn-primary add-bar-button" onClick={openSheet}>
              サブスクを足す
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <AddSheet phase={sheet} title={title} onClose={() => closeSheet(editing ? triggerRow() : null)}>
          {form(true, false)}
        </AddSheet>
      )}

      <Toast toast={toast} onDone={clearToast} />
    </>
  );
}
