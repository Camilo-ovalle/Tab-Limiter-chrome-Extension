import type { WindowStats } from "../../shared/types";

interface WindowListProps {
  windowStats: WindowStats[];
  tabLimit: number;
}

export function WindowList({ windowStats, tabLimit }: WindowListProps) {
  if (windowStats.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        No windows detected
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {windowStats.map((stat, index) => {
        const isOverLimit = stat.tabCount > tabLimit;
        const pct = Math.min((stat.tabCount / tabLimit) * 100, 100);

        return (
          <div
            key={stat.windowId}
            className={`rounded-xl p-3 border ${
              isOverLimit
                ? "bg-red-950/60 border-red-800/60"
                : stat.focused
                  ? "bg-slate-700/80 border-slate-600/80"
                  : "bg-slate-800/60 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">
                  Window {index + 1}
                </span>
                {stat.focused && (
                  <span className="text-[10px] bg-blue-600/80 text-blue-100 px-1.5 py-0.5 rounded font-semibold tracking-wide">
                    ACTIVE
                  </span>
                )}
                {isOverLimit && (
                  <span className="text-[10px] bg-red-800/80 text-red-200 px-1.5 py-0.5 rounded font-semibold tracking-wide">
                    OVER LIMIT
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-bold tabular-nums ${
                  isOverLimit ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {stat.tabCount}
                <span className="text-slate-500 font-normal">/{tabLimit}</span>
              </span>
            </div>
            <div className="h-1 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit ? "bg-red-500" : "bg-emerald-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
