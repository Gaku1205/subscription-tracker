import type { Metadata, Viewport } from "next";
import { BIZ_UDGothic, BIZ_UDPGothic } from "next/font/google";
import "./globals.css";

/** 見出し・本文 */
const bodyFont = BIZ_UDPGothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

/** 金額・日付・あと何日の数字（等幅） */
const numberFont = BIZ_UDGothic({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-number",
});

export const metadata: Metadata = {
  title: "サブスクの支払い",
  description: "契約中のサブスクの毎月の支払い合計と、次に更新が来るサブスクがひと目で分かるページ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F2F4F3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${bodyFont.variable} ${numberFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
