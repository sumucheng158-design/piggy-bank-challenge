"use client";

import { CHALLENGE_TOTAL_DAYS } from "@/lib/config";

interface ProgressBarProps {
  completed: number;
  streak: number; // #7 — 連續打卡天數
  total?: number;
}

export default function ProgressBar({
  completed,
  streak,
  total = CHALLENGE_TOTAL_DAYS,
}: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const color =
    pct === 100
      ? "from-yellow-400 to-amber-500"
      : pct >= 50
      ? "from-amber-400 to-yellow-400"
      : "from-amber-300 to-amber-400";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold text-stone-400">
        <span>0 天</span>
        <span className="text-amber-600 font-bold">{pct}%</span>
        <span>{total} 天</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden border border-amber-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} progress-fill transition-all duration-700`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`完成進度 ${pct}%`}
        />
      </div>
      {/* Milestone markers */}
      <div className="relative h-2">
        {[25, 50, 75, 100].map((m) => (
          <div
            key={m}
            className={`absolute top-0 transform -translate-x-1/2 w-1 h-1 rounded-full ${
              pct >= m ? "bg-amber-500" : "bg-amber-200"
            }`}
            style={{ left: `${m}%` }}
          />
        ))}
      </div>
      {/* #7 — 連續打卡天數徽章 */}
      {streak > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-orange-500">
            <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold text-orange-500">
            連續 {streak} 天打卡！
          </span>
        </div>
      )}
    </div>
  );
}
