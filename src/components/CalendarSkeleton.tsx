"use client";

/** 日曆頁骨架屏，在資料載入前顯示，避免版面跳動 (#18) */
export default function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-md shadow-amber-100 border border-amber-50 overflow-hidden animate-pulse">
      {/* Month header placeholder */}
      <div className="bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-4">
        <div className="h-7 w-36 bg-white/40 rounded-lg mb-1" />
        <div className="h-4 w-24 bg-white/30 rounded" />
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 border-b border-amber-100 py-3 px-3 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-4 rounded skeleton mx-auto w-4" />
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 p-3">
        {/* June 2026 starts on Monday (offset 1) */}
        <div />
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="skeleton aspect-square min-h-[44px] rounded-xl"
            style={{ animationDelay: `${i * 20}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
