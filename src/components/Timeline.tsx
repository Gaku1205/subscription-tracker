import type { DateString } from "@/lib/date";
import { formatLongDate } from "@/lib/format";
import type { UpcomingItem } from "@/lib/subscription";
import { timelineMarks, timelineTicks } from "@/lib/timeline";

interface TimelineProps {
  list: readonly UpcomingItem[];
  today: DateString;
}

/** 線の上の位置（両端は 5px 内側） */
function linePosition(position: number): string {
  return `calc(5px + (100% - 10px) * ${position})`;
}

/** 印の上端（帯の上から。線の中心に印の中心が来る）と、重ねる時にずらす量 */
const MARK_TOP = 32;
const STACK_STEP = 12;

/** これから30日の帯（読み上げない。同じ情報は一覧で伝える） */
export function Timeline({ list, today }: TimelineProps) {
  const marks = timelineMarks(list);
  const ticks = timelineTicks(today);
  const first = list[0];

  return (
    <section className="timeline">
      <h2 className="label">これから30日</h2>
      <div className="band" aria-hidden="true">
        <div className="band-line" />
        {marks.map((mark) => (
          <div key={mark.date} className="band-mark" style={{ left: linePosition(mark.position) }}>
            {Array.from({ length: mark.stack }, (_, i) => (
              <span
                key={i}
                className={mark.soon ? "mark is-soon" : "mark"}
                style={{ top: `${MARK_TOP - STACK_STEP * i}px` }}
              />
            ))}
            {mark.overflow > 0 && (
              <span className="mark-more" style={{ top: `${MARK_TOP - STACK_STEP * (mark.stack - 1) - 5}px` }}>
                +{mark.overflow}
              </span>
            )}
          </div>
        ))}
        {marks.length === 0 && first && <span className="band-beyond">次は{formatLongDate(first.date, today)}</span>}
      </div>
      <div className="ticks" aria-hidden="true">
        {ticks.map((tick) => (
          <span
            key={tick.days}
            className={`num tick tick-${tick.align}`}
            style={tick.align === "center" ? { left: linePosition(tick.position) } : undefined}
          >
            {tick.label}
          </span>
        ))}
      </div>
    </section>
  );
}
