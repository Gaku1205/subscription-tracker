import type { ReactNode } from "react";

/** PC の右列の入力欄 */
export function AddPanel({ children }: { children: ReactNode }) {
  return (
    <section className="panel" aria-labelledby="add-panel-title">
      <h2 id="add-panel-title" className="panel-title">
        サブスクを足す
      </h2>
      {children}
    </section>
  );
}
