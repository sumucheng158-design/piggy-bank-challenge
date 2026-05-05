"use client";

import { useMemo, useState } from "react";
import { CHALLENGE_YEAR, CHALLENGE_MONTH, TZ, BACKDATING_DAYS } from "@/lib/config";

interface CalendarGridProps {
  checkedDates: Set<string>;
  onDayClick: (date: string) => void;
  toggling: string | null;
  year?: number;
  month?: number;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MONTH_NAMES = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTodayTW(year: number, month: number): string | null {
  const nowTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
  if (nowTW.getFullYear() === year && nowTW.getMonth() + 1 === month) {
    return `${year}-${pad(month)}-${pad(nowTW.getDate())}`;
  }
  return null;
}

/** 判斷某天是否在台灣時區今日之後（未來，不可打卡） */
function isFutureTW(year: number, month: number, day: number): boolean {
  const nowTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
  nowTW.setHours(0, 0, 0, 0);
  const cellDate = new Date(year, month - 1, day);
  return cellDate > nowTW;
}

/**
 * #2 — 判斷某天是否超過補打上限（太久以前，不可補打）
 * 超過 BACKDATING_DAYS 天前的日期為 locked
 */
function isLockedTW(year: number, month: number, day: number): boolean {
  const nowTW = new Date(
    new Date().toLocaleString("en-US", { timeZone: TZ })
  );
  nowTW.setHours(0, 0, 0, 0);
  const earliest = new Date(nowTW);
  earliest.setDate(earliest.getDate() - BACKDATING_DAYS);
  const cellDate = new Date(year, month - 1, day);
  return cellDate < earliest;
}

// ── 取消打卡確認 Dialog ──────────────────────────────────────────────────────

interface ConfirmDialogProps {
  day: number;
  month: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ day, month, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-amber-100 p-8 max-w-xs w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </div>
        <h2 id="confirm-title" className="font-display text-xl font-extrabold text-stone-800 mb-2">
          取消 {month} 月 {day} 日的打卡？
        </h2>
        <p className="text-stone-500 text-sm mb-6">這個動作會移除這天的打卡紀錄，確定要繼續嗎？</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-stone-200 text-stone-600 font-bold py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-red-100"
          >
            確定移除
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CalendarGrid ─────────────────────────────────────────────────────────────

export default function CalendarGrid({
  checkedDates,
  onDayClick,
  toggling,
  year = CHALLENGE_YEAR,
  month = CHALLENGE_MONTH,
}: CalendarGridProps) {
  const [confirmDay, setConfirmDay] = useState<number | null>(null);

  const { days, offset } = useMemo(() => {
    const monthIdx = month - 1;
    const firstDay = new Date(year, monthIdx, 1).getDay();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    return { days: daysInMonth, offset: firstDay };
  }, [year, month]);

  const today = useMemo(() => getTodayTW(year, month), [year, month]);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < offset; i++) result.push(null);
    for (let d = 1; d <= days; d++) result.push(d);
    return result;
  }, [days, offset]);

  function dateStr(day: number) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function handleCellClick(day: number) {
    const date = dateStr(day);
    const completed = checkedDates.has(date);
    if (completed) {
      setConfirmDay(day);
    } else {
      onDayClick(date);
    }
  }

  function handleConfirm() {
    if (confirmDay !== null) {
      onDayClick(dateStr(confirmDay));
      setConfirmDay(null);
    }
  }

  return (
    <>
      {confirmDay !== null && (
        <ConfirmDialog
          day={confirmDay}
          month={month}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDay(null)}
        />
      )}

      <div className="bg-white rounded-3xl shadow-md shadow-amber-100 border border-amber-50 overflow-hidden">
        {/* Month header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-4 text-white">
          <p className="font-display font-extrabold text-2xl">
            {year} 年 {MONTH_NAMES[month - 1]}
          </p>
          <p className="text-amber-100 text-sm tracking-wide">30-Day Challenge</p>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-amber-100">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center py-3 text-xs font-bold uppercase tracking-wide ${
                i === 0 ? "text-red-400" : i === 6 ? "text-sky-500" : "text-stone-400"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day cells — #6 確保最小觸控尺寸，使用 min-h/min-w 明確保障 */}
        <div className="grid grid-cols-7 gap-1 p-3">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const date = dateStr(day);
            const completed = checkedDates.has(date);
            const isToday = date === today;
            const future = isFutureTW(year, month, day);
            const locked = isLockedTW(year, month, day); // #2 — 超過補打期限
            const disabled = future || locked;
            const isToggling = toggling === date;

            return (
              <button
                key={date}
                onClick={() => !disabled && handleCellClick(day)}
                disabled={isToggling || disabled}
                aria-label={`${month}月${day}日 ${
                  completed ? "已完成（點擊取消）" :
                  future ? "尚未開放" :
                  locked ? "已超過補打期限" : "未完成，點擊打卡"
                }`}
                aria-pressed={completed}
                title={locked && !completed ? `超過 ${BACKDATING_DAYS} 天不可補打` : undefined}
                className={[
                  // #6 — min-h 和 min-w 同時設定，確保小螢幕不被擠壓
                  "day-cell relative min-h-[44px] min-w-[36px] aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-bold border-2 select-none",
                  future
                    ? "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed"
                    : locked
                    ? "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed opacity-50"
                    : completed
                    ? "bg-amber-400 border-amber-500 text-white cursor-pointer shadow-md shadow-amber-200 completed"
                    : "bg-amber-50 border-amber-200 text-stone-700 cursor-pointer hover:border-amber-400 hover:bg-amber-100",
                  isToday && !completed ? "ring-2 ring-sky-400 ring-offset-1" : "",
                  isToggling ? "opacity-60 scale-95" : "",
                ].join(" ")}
              >
                <span className={completed ? "text-xs" : "text-sm"}>{day}</span>
                {completed && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
                {isToday && !completed && !future && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* #2 — 補打說明 */}
        <p className="text-center text-xs text-stone-400 pb-3">
          可補打最近 {BACKDATING_DAYS} 天內的打卡紀錄
        </p>
      </div>
    </>
  );
}
