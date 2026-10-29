import type { DateString } from "@/lib/date";
import { formatCycleSuffix, formatDaysLeft, formatLongDate, formatYen } from "@/lib/format";
import { isSoon, type NextRenewal } from "@/lib/subscription";

interface NextRenewalViewProps {
  next: NextRenewal;
  today: DateString;
}

/** 次の更新（日付・あと何日・名前・金額） */
export function NextRenewalView({ next, today }: NextRenewalViewProps) {
  const first = next.items[0];
  const others = next.items.length - 1;
  const soon = isSoon(next.days);

  return (
    <section className="next">
      <h2 className="label">次の更新</h2>
      <p className="next-date">
        <span className={soon ? "num next-date-text is-soon" : "num next-date-text"}>
          {formatLongDate(next.date, today)}（{formatDaysLeft(next.days)}）
        </span>
      </p>
      <p className="next-detail">
        <span className="next-name">{others > 0 ? `${first.sub.name} ほか${others}件` : first.sub.name}</span>
        <span className="next-price">
          <span className="num next-amount">{formatYen(next.total)}</span>
          {others === 0 && <span className="next-cycle">{formatCycleSuffix(first.sub.cycle)}</span>}
        </span>
      </p>
    </section>
  );
}
