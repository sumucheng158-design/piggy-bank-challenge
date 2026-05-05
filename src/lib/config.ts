/**
 * 活動全域設定 — 所有和挑戰相關的常數集中在此。
 * 修改活動年份 / 月份 / 天數只需改這一個檔案。
 */
export const CHALLENGE_YEAR = 2026;
export const CHALLENGE_MONTH = 6; // 1-indexed
export const CHALLENGE_TOTAL_DAYS = 30;

/** 允許補打卡的天數（往前幾天內可以補打） */
export const BACKDATING_DAYS = 7;

/** 活動開始日（台灣時間） */
export const CHALLENGE_START = new Date(
  CHALLENGE_YEAR,
  CHALLENGE_MONTH - 1,
  1
);

/** 活動結束日（台灣時間，包含當天） */
export const CHALLENGE_END = new Date(
  CHALLENGE_YEAR,
  CHALLENGE_MONTH - 1,
  CHALLENGE_TOTAL_DAYS
);

/** 站台 base URL，供 metadata 使用 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** 台灣時區字串 */
export const TZ = "Asia/Taipei";
