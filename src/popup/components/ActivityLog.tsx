import type { ActivityLogEntry } from "../../shared/types";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  onClear: () => void;
}

const dotColor: Record<ActivityLogEntry["type"], string> = {
  info:    "bg-[var(--accent-100)]",
  warning: "bg-amber-400",
  error:   "bg-red-500",
  action:  "bg-[var(--primary-200)]",
};

const msgColor: Record<ActivityLogEntry["type"], string> = {
  info:    "text-[var(--text-100)]",
  warning: "text-amber-600",
  error:   "text-red-500",
  action:  "text-[var(--primary-100)]",
};

export function ActivityLog({ entries, onClear }: ActivityLogProps) {
  return (
    <div
      className="bg-[var(--bg-200)] rounded-xl border border-[var(--bg-300)] overflow-hidden"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="px-4 py-2.5 border-b border-[var(--bg-300)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-[3px] h-3 rounded-sm bg-[var(--accent-100)]" />
          <h2 className="text-[9px] font-semibold text-[var(--text-200)] uppercase tracking-[0.14em]">
            Activity Log
          </h2>
        </div>
        <button
          onClick={onClear}
          aria-label="Clear activity log"
          className="text-[9px] text-[var(--text-200)] hover:text-[var(--text-100)] transition-colors uppercase tracking-[0.1em] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] rounded px-1"
        >
          Clear
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-[var(--bg-300)]/50">
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--text-200)] opacity-50 text-center py-5 tracking-wide">
            No recent activity
          </p>
        ) : (
          entries.slice(0, 10).map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--bg-300)]/20 transition-colors duration-100">
              <span className={`mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[entry.type]}`} />
              <div className="min-w-0">
                <p className={`text-xs leading-snug ${msgColor[entry.type]}`}>
                  {entry.message}
                </p>
                <p className="text-[9px] text-[var(--text-200)] opacity-50 mt-0.5 font-['JetBrains_Mono',monospace]">
                  {entry.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
