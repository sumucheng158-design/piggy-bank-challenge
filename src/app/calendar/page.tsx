"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCheckins, toggleCheckin, getUser } from "@/lib/firestore";
import CalendarGrid from "@/components/CalendarGrid";
import ProgressBar from "@/components/ProgressBar";

const TOTAL_DAYS = 30;

export default function CalendarPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName");
    if (!id) {
      router.replace("/");
      return;
    }
    setUserId(id);
    setUserName(name ?? "小挑戰者");
  }, [router]);

  // Load checkins from Firestore
  const loadCheckins = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getCheckins(userId);
      const completed = new Set(
        data.filter((c) => c.completed).map((c) => c.date)
      );
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

    // Optimistic UI update
    setCheckedDates((prev) => {
      const next = new Set(prev);
      if (isCompleted) next.delete(date);
      else next.add(date);
      return next;
    });

    try {
      await toggleCheckin(userId, date, !isCompleted);
    } catch {
      // Revert on failure
      setCheckedDates((prev) => {
        const next = new Set(prev);
        if (isCompleted) next.add(date);
        else next.delete(date);
        return next;
      });
    } finally {
      setToggling(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    router.push("/");
  }

  const completedCount = checkedDates.size;

  return (
    <main className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <span className="font-display font-extrabold text-amber-700 text-lg leading-tight">
              小小大富翁
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-600 font-semibold text-sm hidden sm:block">
              👋 {userName}
            </span>
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
          <p className="text-stone-500">
            2026 年 6 月 1 日 – 6 月 30 日
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-3xl p-6 shadow-md shadow-amber-100 border border-amber-50 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-stone-500 text-sm font-semibold uppercase tracking-wide">
                完成進度
              </p>
              <p className="font-display text-4xl font-extrabold text-amber-600">
                {completedCount}
                <span className="text-stone-400 text-2xl font-bold">/{TOTAL_DAYS}</span>
              </p>
            </div>
            <div className="text-right">
              {completedCount === TOTAL_DAYS ? (
                <div className="text-center">
                  <div className="text-4xl mb-1">🏆</div>
                  <p className="text-amber-600 font-bold text-sm">挑戰完成！</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-1">
                    {completedCount >= 20 ? "🔥" : completedCount >= 10 ? "⭐" : "💪"}
                  </div>
                  <p className="text-stone-500 text-sm font-semibold">
                    還剩 {TOTAL_DAYS - completedCount} 天
                  </p>
                </div>
              )}
            </div>
          </div>
          <ProgressBar completed={completedCount} total={TOTAL_DAYS} />
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-md shadow-amber-100 border border-amber-50">
            <div className="text-4xl mb-3 float">⏳</div>
            <p className="text-stone-500 font-semibold">載入中…</p>
          </div>
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
              <span className="text-white text-xs">✓</span>
            </div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-stone-100 border-2 border-stone-200 opacity-50" />
            <span>未開放</span>
          </div>
        </div>

        {/* Motivation message */}
        {completedCount > 0 && completedCount < TOTAL_DAYS && (
          <div className="mt-6 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-2xl p-4 text-center text-amber-900">
            <p className="font-bold text-lg">
              {completedCount >= 25
                ? "🎉 太厲害了！快到終點了！"
                : completedCount >= 15
                ? "🔥 超過一半了，繼續加油！"
                : completedCount >= 7
                ? "⭐ 已經連續一週，你做到了！"
                : "💪 很好的開始，每天一小步！"}
            </p>
          </div>
        )}
        {completedCount === TOTAL_DAYS && (
          <div className="mt-6 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl p-6 text-center text-amber-900 shadow-lg">
            <div className="text-5xl mb-2">🏆🎉🥇</div>
            <p className="font-display font-extrabold text-2xl mb-1">挑戰完成！</p>
            <p className="font-semibold">你已成為真正的理財小達人！請憑此頁面兌換你的獎勵。</p>
          </div>
        )}
      </div>
    </main>
  );
}
