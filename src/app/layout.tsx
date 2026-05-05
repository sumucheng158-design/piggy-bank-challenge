import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "小小大富翁養成計畫 | 我的第一筆夢想基金",
  description:
    "讓孩子透過每日存錢任務，學習等待、規劃與累積，建立理財觀念。完成挑戰可獲得理財小達人證書與展覽門票。",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "小小大富翁養成計畫",
    description: "每日打卡，累積夢想！30天挑戰，從小種下財富的種子 🐷💰",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "小小大富翁養成計畫",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "小小大富翁養成計畫",
    description: "每日打卡，累積夢想！30天挑戰，從小種下財富的種子 🐷💰",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <head>
        {/* preconnect 讓字體請求更快 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* optimizeFonts: false 已在 next.config.js 關閉，不再被 inline 處理 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
