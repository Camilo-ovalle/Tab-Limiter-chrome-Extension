interface ConfigInputProps {
  label: string;
  value: number | boolean;
  type: "number" | "checkbox";
  isManaged: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (value: number | boolean) => void;
}

export function ConfigInput({
  label,
  value,
  type,
  isManaged,
  disabled = false,
  min,
  max,
  unit,
  onChange,
}: ConfigInputProps) {
  const isDisabled = isManaged || disabled;
  const isOn = value as boolean;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--bg-300)]/60 last:border-0">
      <div className="flex items-center gap-2">
        <span
          className={`text-xs text-[var(--text-100)] transition-opacity ${isDisabled ? "opacity-40" : ""}`}
        >
          {label}
        </span>
        {isManaged && (
          <span
            title="Managed by your organization (GPO)"
            className="text-[8px] text-[var(--text-200)] font-semibold border border-[var(--bg-300)] rounded px-1 py-px tracking-[0.08em] uppercase"
          >
            GPO
          </span>
        )}
      </div>

      {type === "checkbox" ? (
        /* Custom toggle switch */
        <button
          role="switch"
          aria-checked={isOn}
          aria-disabled={isDisabled}
          disabled={isDisabled}
          onClick={() => !isDisabled && onChange(!isOn)}
          className={`relative w-9 h-5 rounded-full border transition-all duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] focus-visible:ring-offset-1 ${
            isOn && !isDisabled
              ? "bg-[var(--primary-200)] border-[var(--primary-200)]"
              : "bg-[var(--bg-200)] border-[var(--bg-300)]"
          } ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all duration-200 ${
              isOn ? "left-[18px]" : "left-[3px]"
            }`}
          />
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value as number}
            disabled={isDisabled}
            min={min}
            max={max}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 py-1 px-2 text-center text-xs font-['JetBrains_Mono',monospace] rounded-md bg-[var(--bg-100)] border border-[var(--bg-300)] text-[var(--text-100)] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] focus-visible:border-[var(--primary-200)] transition-colors"
          />
          {unit && (
            <span className="text-[10px] text-[var(--text-200)] opacity-60 w-4">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
