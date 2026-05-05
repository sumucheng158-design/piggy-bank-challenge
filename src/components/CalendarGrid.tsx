"use client";

import { useMemo } from "react";

interface CalendarGridProps {
  checkedDates: Set<string>;
  onDayClick: (date: string) => void;
  toggling: string | null;
  /** 挑戰年份，預設 2026 */
  year?: number;
  /** 挑戰月份（1-indexed），預設 6 */
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

export default function CalendarGrid({
  checkedDates,
  onDayClick,
  toggling,
  year = 2026,
  month = 6,
}: CalendarGridProps) {
  const { days, offset } = useMemo(() => {
    const monthIdx = month - 1; // 0-indexed
    const firstDay = new Date(year, monthIdx, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    return { days: daysInMonth, offset: firstDay };
  }, [year, month]);

  const monthIdx = month - 1;

  const today = useMemo(() => {
    const d = new Date();
    if (d.getFullYear() === year && d.getMonth() === monthIdx) {
      return `${year}-${pad(month)}-${pad(d.getDate())}`;
    }
    return null;
  }, [year, month, monthIdx]);

  const cells = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < offset; i++) result.push(null);
    for (let d = 1; d <= days; d++) result.push(d);
    return result;
  }, [days, offset]);

  function dateStr(day: number) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function isFuture(day: number) {
    const cellDate = new Date(year, monthIdx, day);
    return cellDate > new Date();
  }

  return (
    <div className="bg-white rounded-3xl shadow-md shadow-amber-100 border border-amber-50 overflow-hidden">
      {/* Month header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-4 text-white">
        <p className="font-display font-extrabold text-2xl">
          {year}年 {MONTH_NAMES[monthIdx]}
        </p>
        <p className="text-amber-100 text-sm">30-Day Challenge</p>
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

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 p-3">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const date = dateStr(day);
          const completed = checkedDates.has(date);
          const isToday = date === today;
          const future = isFuture(day);
          const isToggling = toggling === date;

          return (
            <button
              key={date}
              onClick={() => !future && onDayClick(date)}
              disabled={isToggling || future}
              aria-label={`${month}月${day}日 ${completed ? "已完成" : future ? "尚未開放" : "未完成"}`}
              aria-pressed={completed}
              className={[
                "day-cell relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm font-bold border-2 select-none",
                future
                  ? "bg-stone-50 border-stone-100 text-stone-300 cursor-not-allowed"
                  : completed
                  ? "bg-amber-400 border-amber-500 text-white cursor-pointer shadow-md shadow-amber-200 completed"
                  : "bg-amber-50 border-amber-200 text-stone-700 cursor-pointer hover:border-amber-400 hover:bg-amber-100",
                isToday && !completed
                  ? "ring-2 ring-sky-400 ring-offset-1"
                  : "",
                isToggling ? "opacity-60 scale-95" : "",
              ].join(" ")}
            >
              <span className={completed ? "text-xs" : "text-sm"}>{day}</span>
              {completed && (
                <span className="text-base leading-none">✓</span>
              )}
              {isToday && !completed && !future && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full border border-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
