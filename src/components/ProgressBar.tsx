"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
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
        <span>30 天</span>
      </div>
      <div className="h-4 bg-amber-100 rounded-full overflow-hidden border border-amber-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} progress-fill transition-all duration-700`}
          style={{ width: `${pct}%` }}
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
    </div>
  );
}
