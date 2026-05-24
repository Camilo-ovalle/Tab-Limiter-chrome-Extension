import type { ActivityLogEntry } from "../../shared/types";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  onClear: () => void;
}

const dotColor: Record<ActivityLogEntry["type"], string> = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  action: "bg-emerald-500",
};

export function ActivityLog({ entries, onClear }: ActivityLogProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Activity Log
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="divide-y divide-slate-700/50 max-h-48 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No recent activity
          </p>
        ) : (
          entries.slice(0, 10).map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[entry.type]}`}
              />
              <div className="min-w-0">
                <p className="text-xs text-slate-300 leading-snug">
                  {entry.message}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
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
