import iconUrl from "../../icons/icon32.png";
import { useExtensionState } from "./hooks/useExtensionState";
import { StatsCard } from "./components/StatsCard";
import { WindowList } from "./components/WindowList";
import { ConfigPanel } from "./components/ConfigPanel";
import { ActivityLog } from "./components/ActivityLog";
import { Notification } from "./components/Notification";

export function App() {
  const {
    config,
    managedKeys,
    windowStats,
    activityLog,
    isLoading,
    isSaving,
    isChecking,
    notification,
    updateConfig,
    handleEnabledChange,
    saveConfig,
    forceCheck,
    clearLog,
  } = useExtensionState();

  const totalTabs = windowStats.reduce((s, w) => s + w.tabCount, 0);
  const windowsOverLimit = windowStats.length > config.windowLimit;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-slate-500 text-xs">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={iconUrl} alt="" className="w-7 h-7 rounded-lg" />
          <div>
            <h1 className="text-[15px] font-bold text-white leading-tight">
              Tab Monitor
            </h1>
            <p className="text-[10px] text-slate-500 leading-tight">
              Tab &amp; Window Control
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium ${
            config.enabled ? "text-emerald-400" : "text-slate-500"
          }`}
        >
          {config.enabled ? "Active" : "Off"}
        </span>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <StatsCard value={totalTabs} label="Open Tabs" sub="across all windows" />
        <StatsCard
          value={windowStats.length}
          label="Windows"
          sub={`limit: ${config.windowLimit}`}
          isWarning={windowsOverLimit}
        />
      </div>

      {/* Per-window breakdown */}
      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Per Window
        </p>
        <WindowList windowStats={windowStats} tabLimit={config.tabLimit} />
      </div>

      {/* Admin sections — only visible when adminRole: true in DEFAULT_CONFIG */}
      {config.adminRole && (
        <>
          <div className="h-px bg-slate-800" />
          <div className="px-4 py-3 flex flex-col gap-3">
            <ConfigPanel
              config={config}
              managedKeys={managedKeys}
              onChange={updateConfig}
              onEnabledChange={handleEnabledChange}
              onSave={saveConfig}
              onForceCheck={forceCheck}
              isSaving={isSaving}
              isChecking={isChecking}
            />
            <ActivityLog entries={activityLog} onClear={clearLog} />
          </div>
        </>
      )}
    </div>
  );
}
