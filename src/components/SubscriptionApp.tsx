"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SAVE_ERROR_MESSAGE, createId } from "@/lib/storage";
import { nextRenewal, upcomingList } from "@/lib/subscription";
import { addSubscription, useSubscriptions, useToday } from "@/lib/subscriptionStore";
import { EMPTY_DRAFT, type DraftErrors, type SubscriptionDraft, type ValidDraft } from "@/lib/validation";
import { AddPanel } from "./AddPanel";
import { AddSheet, type SheetPhase } from "./AddSheet";
import { EmptyState } from "./EmptyState";
import { NextRenewalView } from "./NextRenewalView";
import { SubscriptionForm } from "./SubscriptionForm";
import { SubscriptionList } from "./SubscriptionList";
import { Summary } from "./Summary";
import { Timeline } from "./Timeline";
import { Toast, type ToastMessage } from "./Toast";

/** シートが閉じる動きの時間（docs/design.md 8.） */
const SHEET_CLOSE_MS = 150;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** ページ全体（合計・次の更新・帯・一覧と、追加の入力） */
export function SubscriptionApp() {
  const subs = useSubscriptions();
  const today = useToday();
  const [draft, setDraft] = useState<SubscriptionDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [sheet, setSheet] = useState<SheetPhase | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const toastKey = useRef(0);

  const list = useMemo(() => (subs && today ? upcomingList(subs, today) : []), [subs, today]);
  const next = nextRenewal(list);

  // シートが出ている間は後ろを動かさない
  useEffect(() => {
    if (sheet === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheet]);

  const showToast = useCallback((text: string, persistent: boolean) => {
    toastKey.current += 1;
    setToast({ key: toastKey.current, text, persistent });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  function openSheet() {
    setSheet("open");
  }

  function closeSheet() {
    if (sheet !== "open") return;
    const finish = () => {
      setSheet(null);
      openButtonRef.current?.focus();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    setSheet("closing");
    window.setTimeout(finish, SHEET_CLOSE_MS);
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

  const loading = subs === null || today === null;

  const form = (focusOnMount: boolean | "desktop", refocusAfterAdd: boolean) =>
    today && (
      <SubscriptionForm
        draft={draft}
        onDraftChange={setDraft}
        errors={errors}
        onErrorsChange={setErrors}
        today={today}
        onAdd={onAdd}
        focusOnMount={focusOnMount}
        refocusAfterAdd={refocusAfterAdd}
      />
    );

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
                    <SubscriptionList list={list} today={today} flashId={flashId} />
                  </>
                ) : (
                  <EmptyState />
                )}
              </>
            )}
          </div>
          {!loading && (
            <aside className="side-col">
              <AddPanel>{form(subs.length === 0 ? "desktop" : false, true)}</AddPanel>
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
        <AddSheet phase={sheet} onClose={closeSheet}>
          {form(true, false)}
        </AddSheet>
      )}

      <Toast toast={toast} onDone={clearToast} />
    </>
  );
}
