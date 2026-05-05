import type { MetadataRoute } from "next";

// #14 — PWA manifest，讓手機用戶可加入主畫面
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "小小大富翁養成計畫",
    short_name: "小大富翁",
    description: "每日打卡，累積夢想！30天挑戰，從小種下財富的種子。",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbeb",
    theme_color: "#f59e0b",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["education", "finance", "lifestyle"],
  };
}
