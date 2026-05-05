"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCheckins, toggleCheckin } from "@/lib/firestore";
import { signOutAnonymous } from "@/lib/auth";
import { CHALLENGE_TOTAL_DAYS, CHALLENGE_YEAR, CHALLENGE_MONTH, TZ } from "@/lib/config";
import CalendarGrid from "@/components/CalendarGrid";
import ProgressBar from "@/components/ProgressBar";
import CalendarSkeleton from "@/components/CalendarSkeleton";

export const dynamic = "force-dynamic";

// ── 每日理財金句 (#9) ────────────────────────────────────────────────────────
const DAILY_QUOTES = [
  "不要把所有雞蛋放在同一個籃子裡。",
  "每天省下一點，累積起來就是一大筆！",
  "錢是賺來的，也是存出來的。",
  "先付錢給自己，再花剩下的錢。",
  "複利是世界第八大奇蹟。",
  "小小習慣，決定大大未來。",
  "今天的節省，是明天的自由。",
  "記帳是理財的第一步。",
  "設定目標，才能知道努力的方向。",
  "花錢之前，先想想：這是需要還是想要？",
  "財富不是一夜累積的，是每天一點點存出來的。",
  "有計畫的花錢，才是真正的富有。",
  "學會等待，才能得到更好的東西。",
  "比起花錢買東西，不如存錢買自由。",
  "聰明的人賺錢，更聰明的人讓錢幫他賺錢。",
  "今天努力存錢，未來夢想成真！",
  "錢要用在刀口上，每一分都要花得有意義。",
  "養成好習慣，比賺大錢更重要。",
  "小豬撲滿是理財的起點。",
  "積少成多，滴水穿石。",
  "你的消費習慣，決定你的財務未來。",
  "延遲享樂，換來更大的滿足。",
  "理財要趁早，時間是最好的朋友。",
  "節儉不是省吃儉用，而是把錢花在值得的地方。",
  "每一塊錢都有它的任務：存、花、分享。",
  "看看你的存款，就知道你的未來。",
  "財務自由，從了解自己的錢開始。",
  "預算是你的理財地圖，帶你到達目的地。",
  "讓錢為你工作，而不是你為錢工作。",
  "30天的堅持，是改變一生的開始！",
];

// 根據今天是活動第幾天取對應金句
function getDailyQuote(): string {
  const todayTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
  const startDay = new Date(CHALLENGE_YEAR, CHALLENGE_MONTH - 1, 1);
  const diffDays = Math.floor(
    (todayTW.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)
  );
  const idx = Math.max(0, Math.min(diffDays, DAILY_QUOTES.length - 1));
  return DAILY_QUOTES[idx];
}

// ── 里程碑設定 (#10) ─────────────────────────────────────────────────────────
const MILESTONES: Record<number, { emoji: string; msg: string }> = {
  7:  { emoji: "🔥", msg: "連續一週！習慣正在形成中！" },
  14: { emoji: "⭐", msg: "兩週達成！你超級厲害！" },
  21: { emoji: "🏆", msg: "三週完成！勝利就在眼前！" },
  30: { emoji: "👑", msg: "30天全勤！你是真正的理財小達人！" },
};

// ── 計算連續打卡天數 (#7) ─────────────────────────────────────────────────────
function calcStreak(checkedDates: Set<string>): number {
  if (checkedDates.size === 0) return 0;
  const todayTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
  todayTW.setHours(0, 0, 0, 0);

  let streak = 0;
  const cur = new Date(todayTW);

  while (true) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (checkedDates.has(key)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userGoal, setUserGoal] = useState<string>("");      // #11
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [lastUnchecked, setLastUnchecked] = useState<string | null>(null); // #8
  const [shareMsg, setShareMsg] = useState("");
  const [milestone, setMilestone] = useState<{ emoji: string; msg: string } | null>(null); // #10

  // #3 — sessionStorage 二層快取
  const SESSION_KEY = useRef<string | null>(null);
  const cache = useRef<Set<string> | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");
    const goal = localStorage.getItem("userGoal");
    if (!id) {
      router.replace("/");
      return;
    }
    SESSION_KEY.current = `checkins_${id}`;
    setUserId(id);
    setUserName(name ?? "小小挑戰者");
    setUserGoal(goal ?? "");
  }, [router]);

  const loadCheckins = useCallback(async () => {
    if (!userId) return;

    // 1. 記憶體快取
    if (cache.current !== null) {
      setCheckedDates(new Set(cache.current));
      setLoading(false);
      return;
    }

    // 2. #3 — sessionStorage 快取
    try {
      const raw = sessionStorage.getItem(SESSION_KEY.current!);
      if (raw) {
        const dates = new Set<string>(JSON.parse(raw));
        cache.current = dates;
        setCheckedDates(new Set(dates));
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    // 3. Firestore
    setLoading(true);
    try {
      const data = await getCheckins(userId);
      const completed = new Set(
        data.filter((c) => c.completed).map((c) => c.date)
      );
      cache.current = completed;
      try { sessionStorage.setItem(SESSION_KEY.current!, JSON.stringify([...completed])); } catch { /* ignore */ }
      setCheckedDates(completed);
    } catch (err) {
      console.error("Failed to load checkins:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  async function handleDayClick(date: string) {
    if (!userId || toggling) return;
    const isCompleted = checkedDates.has(date);
    setToggling(date);

    const nextDates = new Set(checkedDates);
    if (isCompleted) nextDates.delete(date);
    else nextDates.add(date);

    // Optimistic update
    setCheckedDates(nextDates);
    cache.current = nextDates;
    try { sessionStorage.setItem(SESSION_KEY.current!, JSON.stringify([...nextDates])); } catch { /* ignore */ }

    try {
      await toggleCheckin(userId, date, !isCompleted);
      if (!isCompleted) {
        setLastChecked(date);
        // #10 — 檢查是否達到里程碑
        const newCount = nextDates.size;
        if (MILESTONES[newCount]) {
          setMilestone(MILESTONES[newCount]);
        }
      } else {
        // #8 — 取消打卡也有提示
        setLastUnchecked(date);
      }
    } catch {
      // Revert on failure
      const revert = new Set(checkedDates);
      setCheckedDates(revert);
      cache.current = revert;
      try { sessionStorage.setItem(SESSION_KEY.current!, JSON.stringify([...revert])); } catch { /* ignore */ }
    } finally {
      setToggling(null);
    }
  }

  // Toast 自動清除
  useEffect(() => {
    if (!lastChecked) return;
    const t = setTimeout(() => setLastChecked(null), 2500);
    return () => clearTimeout(t);
  }, [lastChecked]);

  useEffect(() => {
    if (!lastUnchecked) return;
    const t = setTimeout(() => setLastUnchecked(null), 2000);
    return () => clearTimeout(t);
  }, [lastUnchecked]);

  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(() => setMilestone(null), 4000);
    return () => clearTimeout(t);
  }, [milestone]);

  // #4 — 登出時同時清除 Firebase Auth session
  async function handleLogout() {
    cache.current = null;
    if (SESSION_KEY.current) {
      try { sessionStorage.removeItem(SESSION_KEY.current); } catch { /* ignore */ }
    }
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userGoal");
    await signOutAnonymous();
    router.push("/");
  }

  async function handleShare() {
    const text = `我在「小小大富翁養成計畫」已完成 ${completedCount}／${CHALLENGE_TOTAL_DAYS} 天打卡！${userGoal ? `我的目標：${userGoal}` : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "小小大富翁養成計畫", text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setShareMsg("已複製到剪貼簿！");
      setTimeout(() => setShareMsg(""), 2500);
    }
  }

  const completedCount = checkedDates.size;
  const streak = calcStreak(checkedDates); // #7
  const dailyQuote = getDailyQuote(); // #9

  // 動態激勵訊息（依進度段落）
  function getMotivationMsg() {
    if (completedCount >= 25) return "太厲害了！快到終點了！";
    if (completedCount >= 21) return "21天了！已養成存錢習慣！";
    if (completedCount >= 15) return "超過一半了，繼續加油！";
    if (completedCount >= 14) return "兩週達成！你做到了！";
    if (completedCount >= 7)  return "已經連續一週，你做到了！";
    return "很好的開始，每天一小步！";
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-amber-50">
        <div className="h-[57px] bg-white border-b border-amber-100 shadow-sm" />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <CalendarSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50">
      {/* ── #10 里程碑慶祝 overlay ── */}
      {milestone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          aria-live="assertive"
        >
          <div className="bg-white border-4 border-amber-400 rounded-3xl shadow-2xl px-10 py-8 text-center animate-pop max-w-xs mx-4">
            <div className="text-6xl mb-3">{milestone.emoji}</div>
            <p className="font-display text-2xl font-extrabold text-amber-700 mb-1">里程碑達成！</p>
            <p className="font-bold text-stone-700">{milestone.msg}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-600">
                <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-display font-extrabold text-amber-700 text-lg leading-tight">小小大富翁</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-600 font-semibold text-sm">{userName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-stone-400 hover:text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              切換用戶
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title block */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-800 mb-1">
            我的挑戰日曆
          </h1>
          <p className="text-stone-500">2026年6月1日 – 6月30日</p>
        </div>

        {/* #11 — 存錢目標橫幅 */}
        {userGoal && (
          <div className="mb-5 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs font-semibold text-sky-500 uppercase tracking-wide">我的夢想目標</p>
              <p className="font-bold text-sky-800">{userGoal}</p>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-3xl p-6 shadow-md shadow-amber-100 border border-amber-50 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-stone-500 text-sm font-semibold uppercase tracking-wide">完成進度</p>
              <p className="font-display text-4xl font-extrabold text-amber-600">
                {completedCount}
                <span className="text-stone-400 text-2xl font-bold">/{CHALLENGE_TOTAL_DAYS}</span>
              </p>
            </div>
            <div className="text-right">
              {completedCount === CHALLENGE_TOTAL_DAYS ? (
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-1 text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-amber-600 font-bold text-sm">挑戰完成！</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-1 text-amber-500">
                    {completedCount >= 20 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" /></svg>
                    ) : completedCount >= 10 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.818a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .845-.143Z" clipRule="evenodd" /></svg>
                    )}
                  </div>
                  <p className="text-stone-500 text-sm font-semibold">還剩 {CHALLENGE_TOTAL_DAYS - completedCount} 天</p>
                </div>
              )}
            </div>
          </div>
          {/* #7 — streak 傳入 ProgressBar */}
          <ProgressBar completed={completedCount} streak={streak} />
        </div>

        {/* #9 — 每日理財金句 */}
        <div className="mb-5 bg-white border border-amber-100 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-sm">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-0.5">今日理財小知識</p>
            <p className="text-stone-700 font-semibold text-sm leading-relaxed">{dailyQuote}</p>
          </div>
        </div>

        {/* #8 — 打卡成功 toast */}
        {lastChecked && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 bg-green-100 border border-green-300 text-green-800 font-bold text-center py-3 rounded-2xl text-lg animate-pop flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            太棒了！打卡完成！
          </div>
        )}

        {/* #8 — 取消打卡 toast */}
        {lastUnchecked && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 bg-stone-100 border border-stone-300 text-stone-600 font-semibold text-center py-2.5 rounded-2xl text-sm animate-pop flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-stone-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
            </svg>
            已取消打卡紀錄
          </div>
        )}

        {/* Calendar */}
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <CalendarGrid
            checkedDates={checkedDates}
            onDayClick={handleDayClick}
            toggling={toggling}
          />
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-100 border-2 border-amber-200" />
            <span>未完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-400 border-2 border-amber-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-white">
                <path fillRule="evenodd" d="M9.312 2.532a.563.563 0 0 1 .156.781l-3.75 5.625a.563.563 0 0 1-.866.085l-2.25-2.25a.563.563 0 1 1 .795-.795l1.765 1.765 3.37-5.055a.563.563 0 0 1 .78-.156Z" clipRule="evenodd" />
              </svg>
            </div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-stone-100 border-2 border-stone-200 opacity-50" />
            <span>未開放</span>
          </div>
        </div>

        {/* Motivation message */}
        {completedCount > 0 && completedCount < CHALLENGE_TOTAL_DAYS && (
          <div className="mt-6 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl p-4 text-center text-amber-900">
            <p className="font-bold text-lg">{getMotivationMsg()}</p>
          </div>
        )}

        {/* 完成區塊 + 分享 */}
        {completedCount === CHALLENGE_TOTAL_DAYS && (
          <div className="mt-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl p-6 text-center text-amber-900 shadow-lg">
            <div className="flex justify-center gap-3 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-amber-700">
                <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-display font-extrabold text-2xl mb-1">挑戰完成！</p>
            <p className="font-semibold mb-4">你已成為真正的理財小達人！請憑此頁面兌換你的獎勵。</p>
            <button
              onClick={handleShare}
              className="bg-white text-amber-700 font-extrabold px-6 py-2.5 rounded-xl shadow hover:bg-amber-50 transition-colors text-base flex items-center gap-2 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
              </svg>
              分享我的成就
            </button>
            {shareMsg && <p className="mt-2 text-sm font-semibold text-amber-800">{shareMsg}</p>}
          </div>
        )}

        {/* 非完成時也提供分享 */}
        {completedCount > 0 && completedCount < CHALLENGE_TOTAL_DAYS && (
          <div className="mt-4 text-center">
            <button
              onClick={handleShare}
              className="text-stone-400 hover:text-amber-600 text-sm font-semibold underline underline-offset-2 transition-colors flex items-center gap-1 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.5 3.5a2.5 2.5 0 1 1 .563 1.589L6.25 7.677a2.502 2.502 0 0 1 0 .646l4.813 2.588a2.5 2.5 0 1 1-.537 1.269L5.713 9.592a2.5 2.5 0 1 1 0-3.184l4.813-2.588A2.513 2.513 0 0 1 10.5 3.5Z" />
              </svg>
              分享我的進度
            </button>
            {shareMsg && <p className="mt-1 text-xs text-stone-400">{shareMsg}</p>}
          </div>
        )}
      </div>
    </main>
  );
}
