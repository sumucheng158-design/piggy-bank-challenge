import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";

/** #16 — 日曆頁獨立 metadata，分享連結時語意清晰 */
export const metadata: Metadata = {
  title: "我的挑戰日曆",
  description:
    "追蹤你的「小小大富翁養成計畫」30 天打卡進度，每日完成存錢任務，累積夢想！",
  openGraph: {
    title: "我的挑戰日曆 | 小小大富翁養成計畫",
    description: "追蹤你的 30 天打卡進度，每日完成存錢任務，累積夢想！",
    type: "website",
    url: `${SITE_URL}/calendar`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "小小大富翁養成計畫 — 挑戰日曆",
      },
    ],
  },
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
