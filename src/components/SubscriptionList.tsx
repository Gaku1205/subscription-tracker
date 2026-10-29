import type { DateString } from "@/lib/date";
import { formatCycleSuffix, formatDaysLeft, formatShortDate, formatYen } from "@/lib/format";
import { isSoon, monthlyAmount, type UpcomingItem } from "@/lib/subscription";

interface SubscriptionListProps {
  list: readonly UpcomingItem[];
  today: DateString;
  /** 足した直後で、地を戻す動きを付ける行 */
  flashId: string | null;
}

/** 全部のサブスクの一覧（次の更新日が近い順） */
export function SubscriptionList({ list, today, flashId }: SubscriptionListProps) {
  return (
    <ul className="list" aria-label="サブスクの一覧">
      {list.map((item, index) => {
        const { sub } = item;
        const classes = ["row"];
        if (index === 0) classes.push("is-next");
        if (sub.id === flashId) classes.push("is-flash");
        return (
          <li key={sub.id} className={classes.join(" ")}>
            <span className="row-when">
              <span className="num row-date">{formatShortDate(item.date, today)}</span>
              <span className={isSoon(item.days) ? "num row-days is-soon" : "num row-days"}>
                {formatDaysLeft(item.days)}
              </span>
            </span>
            <span className="row-main">
              <span className="row-name">{sub.name}</span>
              {sub.cycle === "yearly" && (
                <span className="row-per-month">
                  月あたり <span className="num">{formatYen(monthlyAmount(sub))}</span>
                </span>
              )}
            </span>
            <span className="row-amount">
              <span className="num row-price">{formatYen(sub.amount)}</span>
              <span className="row-cycle">{formatCycleSuffix(sub.cycle)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
