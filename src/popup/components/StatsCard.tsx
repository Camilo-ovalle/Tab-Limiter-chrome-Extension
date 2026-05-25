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
      className={`relative rounded-xl p-4 border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        isWarning
          ? "border-red-500/30 bg-red-500/10"
          : "border-[var(--bg-300)] bg-[var(--bg-200)]"
      }`}
      style={{
        boxShadow: isWarning
          ? "0 1px 3px rgba(239,68,68,0.1)"
          : "var(--shadow)",
      }}
    >
      {/* Top accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${
          isWarning ? "bg-red-500" : "bg-[var(--primary-200)]"
        }`}
      />

      <div
        className={`text-[2rem] font-semibold leading-none tracking-tight font-['JetBrains_Mono',monospace] mt-1 ${
          isWarning ? "text-red-500" : "text-[var(--primary-100)]"
        }`}
        style={{ color: isWarning ? undefined : "var(--primary-100)" }}
      >
        {value}
      </div>

      <div className="text-[9px] font-semibold text-[var(--text-200)] uppercase tracking-[0.12em] mt-2">
        {label}
      </div>
      {sub && (
        <div className="text-[9px] text-[var(--text-200)] opacity-60 mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
