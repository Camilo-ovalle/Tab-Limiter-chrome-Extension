import type { ExtensionConfig } from "../../shared/types";
import { ConfigInput } from "./ConfigInput";

interface ConfigPanelProps {
  config: ExtensionConfig;
  managedKeys: Array<keyof ExtensionConfig>;
  onChange: (
    key: keyof ExtensionConfig,
    value: ExtensionConfig[keyof ExtensionConfig],
  ) => void;
  onEnabledChange: (enabled: boolean) => void;
  onSave: () => void;
  onForceCheck: () => void;
  isSaving: boolean;
  isChecking: boolean;
}

export function ConfigPanel({
  config,
  managedKeys,
  onChange,
  onEnabledChange,
  onSave,
  onForceCheck,
  isSaving,
  isChecking,
}: ConfigPanelProps) {
  const m = (key: keyof ExtensionConfig) => managedKeys.includes(key);
  const notificationsDisabled =
    !config.enabled || (!config.autoClose && !config.autoCloseWindows);
  const pauseDisabled =
    !config.enabled || (!config.autoClose && !config.autoCloseWindows);
  const graceDisabled = !config.enabled || !config.autoCloseWindows;

  return (
    <div
      className="bg-[var(--bg-200)] rounded-xl border border-[var(--bg-300)] overflow-hidden"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="px-4 py-2.5 border-b border-[var(--bg-300)] flex items-center gap-2">
        <span className="w-[3px] h-3 rounded-sm bg-[var(--primary-200)]" />
        <h2 className="text-[9px] font-semibold text-[var(--text-200)] uppercase tracking-[0.14em]">
          Configuration
        </h2>
      </div>

      <div className="px-4">
        <ConfigInput
          label="Enable monitoring"
          value={config.enabled}
          type="checkbox"
          isManaged={m("enabled")}
          onChange={(v) => onEnabledChange(v as boolean)}
        />
        <ConfigInput
          label="Tab limit per window"
          value={config.tabLimit}
          type="number"
          isManaged={m("tabLimit")}
          disabled={!config.enabled}
          min={1}
          max={100}
          onChange={(v) => onChange("tabLimit", v as number)}
        />
        <ConfigInput
          label="Window limit"
          value={config.windowLimit}
          type="number"
          isManaged={m("windowLimit")}
          disabled={!config.enabled}
          min={1}
          max={10}
          onChange={(v) => onChange("windowLimit", v as number)}
        />
        <ConfigInput
          label="Auto-close excess tabs"
          value={config.autoClose}
          type="checkbox"
          isManaged={m("autoClose")}
          disabled={!config.enabled}
          onChange={(v) => onChange("autoClose", v as boolean)}
        />
        <ConfigInput
          label="Auto-close excess windows"
          value={config.autoCloseWindows}
          type="checkbox"
          isManaged={m("autoCloseWindows")}
          disabled={!config.enabled}
          onChange={(v) => onChange("autoCloseWindows", v as boolean)}
        />
        <ConfigInput
          label="Notifications"
          value={config.notifications}
          type="checkbox"
          isManaged={m("notifications")}
          disabled={notificationsDisabled}
          onChange={(v) => onChange("notifications", v as boolean)}
        />
        <ConfigInput
          label="Pause between closures"
          value={Math.round(config.pauseBetweenClosures / 1000)}
          type="number"
          unit="s"
          isManaged={m("pauseBetweenClosures")}
          disabled={pauseDisabled}
          min={0}
          onChange={(v) =>
            onChange("pauseBetweenClosures", (v as number) * 1000)
          }
        />
        <ConfigInput
          label="Window grace period"
          value={Math.round(config.windowGracePeriod / 1000)}
          type="number"
          unit="s"
          isManaged={m("windowGracePeriod")}
          disabled={graceDisabled}
          min={1}
          onChange={(v) => onChange("windowGracePeriod", (v as number) * 1000)}
        />
      </div>

      <div className="px-4 py-3 border-t border-[var(--bg-300)] flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          aria-label="Save configuration"
          className="flex-1 py-2 px-3 text-[10px] font-semibold rounded-lg bg-[var(--primary-100)] hover:bg-[var(--primary-200)] disabled:opacity-50 text-white tracking-[0.06em] uppercase transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] focus-visible:ring-offset-1"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onForceCheck}
          disabled={isChecking}
          aria-label="Force tab check"
          className="py-2 px-3 text-[10px] font-semibold rounded-lg bg-[var(--bg-100)] hover:bg-[var(--bg-300)]/50 disabled:opacity-50 text-[var(--text-100)] border border-[var(--bg-300)] tracking-[0.06em] uppercase transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-100)] focus-visible:ring-offset-1"
        >
          {isChecking ? "…" : "Check"}
        </button>
      </div>
    </div>
  );
}
