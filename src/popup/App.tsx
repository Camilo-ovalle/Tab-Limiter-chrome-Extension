import { useEffect, useState } from "react";
import iconUrl from "../../icons/icon32.png";
import { useExtensionState } from "./hooks/useExtensionState";
import { StatsCard } from "./components/StatsCard";
import { WindowList } from "./components/WindowList";
import { ConfigPanel } from "./components/ConfigPanel";
import { ActivityLog } from "./components/ActivityLog";
import { Notification } from "./components/Notification";

type Theme = "light" | "dark";

function SunIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

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

  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("popup-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("popup-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const totalTabs = windowStats.reduce((s, w) => s + w.tabCount, 0);
  const windowsOverLimit = windowStats.length > config.windowLimit;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-36 bg-[var(--bg-100)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--bg-300)] border-t-[var(--primary-200)] rounded-full animate-spin" />
          <span className="text-[9px] text-[var(--text-200)] tracking-[0.16em] uppercase font-semibold">
            Loading
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-100)] min-h-full fade-up">
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}

      {/* Header */}
      <div className="px-5 pt-4 pb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg border border-[var(--bg-300)] bg-[var(--bg-200)] flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <img src={iconUrl} alt="" className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold text-[var(--text-100)] tracking-tight font-['Barlow_Condensed',sans-serif] uppercase leading-tight">
              Tab Monitor
            </h1>
            <p className="text-[9px] text-[var(--text-200)] tracking-[0.1em] uppercase font-medium leading-tight">
              Tab &amp; Window Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {config.enabled && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-200)] opacity-60" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  config.enabled
                    ? "bg-[var(--primary-200)]"
                    : "bg-[var(--bg-300)]"
                }`}
              />
            </span>
            <span
              className={`text-[9px] font-semibold tracking-[0.12em] uppercase ${
                config.enabled
                  ? "text-[var(--primary-200)]"
                  : "text-[var(--text-200)]"
              }`}
            >
              {config.enabled ? "Active" : "Off"}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-200)] hover:text-[var(--text-100)] hover:bg-[var(--bg-200)] border border-transparent hover:border-[var(--bg-300)] transition-all duration-150 active:scale-95"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>

      <div className="mx-5 h-px bg-[var(--bg-300)]" />

      {/* Stats */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3">
        <StatsCard
          value={totalTabs}
          label="Open Tabs"
          sub="across all windows"
        />
        <StatsCard
          value={windowStats.length}
          label="Windows"
          sub={`limit: ${config.windowLimit}`}
          isWarning={windowsOverLimit}
        />
      </div>

      {/* Per-window breakdown */}
      <div className="px-5 pb-4">
        <p className="text-[9px] font-semibold text-[var(--text-200)] uppercase tracking-[0.14em] mb-2.5">
          Per Window
        </p>
        <WindowList windowStats={windowStats} tabLimit={config.tabLimit} />
      </div>

      {/* Admin sections — only visible when adminRole: true in DEFAULT_CONFIG */}
      {config.adminRole && (
        <>
          <div className="mx-5 h-px bg-[var(--bg-300)]" />
          <div className="px-5 py-4 flex flex-col gap-3">
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
