import type { ReactNode } from "react";

/** PC の右列の入力欄（足す／直す） */
export function AddPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel" aria-labelledby="add-panel-title">
      <h2 id="add-panel-title" className="panel-title">
        {title}
      </h2>
      {children}
    </section>
  );
}
