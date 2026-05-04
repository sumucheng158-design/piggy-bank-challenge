import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小小大富翁養成計畫 | 我的第一筆夢想基金",
  description:
    "讓孩子透過每日存錢任務，學習等待、規劃與累積，建立理財觀念。完成挑戰可獲得理財小達人證書與展覽門票。",
  openGraph: {
    title: "小小大富翁養成計畫",
    description: "每日打卡，累積夢想！",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
