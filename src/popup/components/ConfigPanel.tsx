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
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
          onChange={(v) => onChange("pauseBetweenClosures", (v as number) * 1000)}
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

      <div className="px-4 py-3 border-t border-slate-700/60 flex gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 py-2 px-3 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white transition-colors"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onForceCheck}
          disabled={isChecking}
          className="py-2 px-3 text-sm font-medium rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 transition-colors"
        >
          {isChecking ? "…" : "Force Check"}
        </button>
      </div>
    </div>
  );
}
