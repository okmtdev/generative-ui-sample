import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiiTel Generative UI サンプル",
  description: "LLM がツールを選び、結果に応じてUIが動的に描画される Generative UI のデモ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
