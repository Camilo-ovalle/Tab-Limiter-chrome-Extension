import type { WindowStats } from "../../shared/types";

interface WindowListProps {
  windowStats: WindowStats[];
  tabLimit: number;
}

export function WindowList({ windowStats, tabLimit }: WindowListProps) {
  if (windowStats.length === 0) {
    return (
      <p className="text-xs text-[var(--text-200)] text-center py-5 tracking-wide opacity-60">
        No windows detected
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {windowStats.map((stat, index) => {
        const isOverLimit = stat.tabCount > tabLimit;
        const pct = Math.min((stat.tabCount / tabLimit) * 100, 100);
        const isWarn = !isOverLimit && pct > 75;

        return (
          <div
            key={stat.windowId}
            className={`rounded-lg px-3 py-2.5 border transition-all duration-200 hover:border-[var(--primary-200)] ${
              isOverLimit
                ? "bg-red-50 border-red-200"
                : stat.focused
                  ? "bg-[var(--primary-300)]/20 border-[var(--primary-200)]/40"
                  : "bg-[var(--bg-200)] border-[var(--bg-300)]"
            }`}
            style={{ boxShadow: "var(--shadow)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-[var(--text-200)] tracking-[0.08em] font-['Barlow_Condensed',sans-serif] uppercase">
                  Win {index + 1}
                </span>
                {stat.focused && (
                  <span className="text-[8px] bg-[var(--primary-300)] text-[var(--accent-200)] px-1.5 py-px rounded-full font-semibold tracking-wide uppercase">
                    Active
                  </span>
                )}
                {isOverLimit && (
                  <span className="text-[8px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-px rounded-full font-semibold tracking-wide uppercase">
                    Over
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-semibold font-['JetBrains_Mono',monospace] tabular-nums ${
                  isOverLimit
                    ? "text-red-500"
                    : isWarn
                      ? "text-amber-500"
                      : "text-[var(--primary-100)]"
                }`}
              >
                {stat.tabCount}
                <span className="text-[var(--text-200)] font-normal text-xs opacity-60">
                  /{tabLimit}
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[var(--bg-300)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit
                    ? "bg-red-500"
                    : isWarn
                      ? "bg-amber-400"
                      : "bg-emerald-500"
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
