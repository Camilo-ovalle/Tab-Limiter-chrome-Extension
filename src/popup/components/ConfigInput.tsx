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

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">{label}</span>
        {isManaged && (
          <span
            title="Managed by your organization (GPO)"
            className="text-[10px] text-slate-500 font-semibold border border-slate-600 rounded px-1 py-px tracking-wide"
          >
            GPO
          </span>
        )}
      </div>

      {type === "checkbox" ? (
        <input
          type="checkbox"
          checked={value as boolean}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-blue-500 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        />
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value as number}
            disabled={isDisabled}
            min={min}
            max={max}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 py-1 px-2 text-center text-sm rounded-lg bg-slate-900 border border-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:border-blue-500 transition-colors"
          />
          {unit && (
            <span className="text-xs text-slate-500 w-4">{unit}</span>
          )}
        </div>
      )}
    </div>
  );
}
