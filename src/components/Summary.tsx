import { formatNumber, formatYen } from "@/lib/format";
import { hasYearly, monthlyTotal, yearlyTotal, type Subscription } from "@/lib/subscription";

interface SummaryProps {
  /** 読み込み中は null */
  subs: readonly Subscription[] | null;
}

/** 毎月の支払い合計・年間 */
export function Summary({ subs }: SummaryProps) {
  if (subs === null) {
    return (
      <section className="summary" aria-live="polite">
        <p className="loading">読み込み中…</p>
      </section>
    );
  }

  return (
    <section className="summary" aria-live="polite">
      <h2 className="label">毎月の支払い</h2>
      <p className="total">
        <span className="num total-number">{formatNumber(monthlyTotal(subs))}</span>
        <span className="total-yen">円</span>
      </p>
      {subs.length > 0 && (
        <>
          <p className="note">
            年間 <span className="num">{formatYen(yearlyTotal(subs))}</span>
          </p>
          {hasYearly(subs) && <p className="note">年払いは12で割って足しています</p>}
        </>
      )}
    </section>
  );
}
