interface StatsCardProps {
  value: string | number;
  label: string;
  sub?: string;
  isWarning?: boolean;
}

export function StatsCard({
  value,
  label,
  sub,
  isWarning = false,
}: StatsCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        isWarning
          ? "bg-red-950/60 border-red-800/60"
          : "bg-slate-800/80 border-slate-700/60"
      }`}
    >
      <div
        className={`text-3xl font-bold tracking-tight ${
          isWarning ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="text-xs font-semibold text-slate-300 mt-1.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
