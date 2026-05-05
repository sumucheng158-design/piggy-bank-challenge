import type { Metadata } from "next";
import { Nunito, Baloo_2 } from "next/font/google";
import "./globals.css";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { SITE_URL } from "@/lib/config";

// #9 #10 — 改用 next/font/google，移除 optimizeFonts: false 需求
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const baloo2 = Baloo_2({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
  display: "swap",
});

// #15 #16 — 確保 OG metadata 完整，日曆頁有自己的 metadata（見 calendar/page.tsx）
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "小小大富翁養成計畫 | 我的第一筆夢想基金",
    template: "%s | 小小大富翁養成計畫",
  },
  description:
    "讓孩子透過每日存錢任務，學習等待、規劃與累積，建立理財觀念。完成挑戰可獲得理財小達人證書與展覽門票。",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "小小大富翁養成計畫",
    description: "每日打卡，累積夢想！30天挑戰，從小種下財富的種子。",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "小小大富翁養成計畫 — 每日打卡挑戰",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "小小大富翁養成計畫",
    description: "每日打卡，累積夢想！30天挑戰，從小種下財富的種子。",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW" className={`${nunito.variable} ${baloo2.variable}`}>
      <body>
        {/* #17 — 全域 Error Boundary，防止 Firebase 初始化失敗導致白頁 */}
        <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
