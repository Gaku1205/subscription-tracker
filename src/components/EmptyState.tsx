/** 1件も無い時の文（docs/design.md 7.） */
export function EmptyState() {
  return (
    <section className="empty">
      <p className="empty-title">まだサブスクが登録されていません</p>
      <p className="empty-text">
        契約中のサブスクの名前・金額・次の更新日を入れると、毎月の合計と、次に更新が来るものがここに出ます。
      </p>
      <p className="empty-text only-mobile">下の「サブスクを足す」から入れられます</p>
      <p className="empty-text only-desktop">右の欄から入れられます</p>
    </section>
  );
}
