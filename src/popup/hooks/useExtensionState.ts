import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ActivityLogEntry,
  ExtensionConfig,
  WindowStats,
} from "../../shared/types";

interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

const INITIAL_CONFIG: ExtensionConfig = {
  enabled: true,
  tabLimit: 5,
  windowLimit: 3,
  autoClose: true,
  autoCloseWindows: true,
  windowGracePeriod: 5000,
  notifications: true,
  pauseBetweenClosures: 1000,
  adminRole: false,
};

async function sendMsg(message: object): Promise<Record<string, unknown>> {
  return (await chrome.runtime.sendMessage(message)) as Record<string, unknown>;
}

export function useExtensionState() {
  const [config, setConfig] = useState<ExtensionConfig>(INITIAL_CONFIG);
  const [managedKeys, setManagedKeys] = useState<Array<keyof ExtensionConfig>>(
    [],
  );
  const [windowStats, setWindowStats] = useState<WindowStats[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const enabledRef = useRef(config.enabled);
  const configRef = useRef(config);

  useEffect(() => {
    enabledRef.current = config.enabled;
    configRef.current = config;
  }, [config]);

  const showNotification = useCallback(
    (message: string, type: Notification["type"]) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    [],
  );

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, logRes] = await Promise.all([
        sendMsg({ action: "getWindowStats" }),
        sendMsg({ action: "getActivityLog" }),
      ]);
      if (statsRes.success)
        setWindowStats(statsRes.windowStats as WindowStats[]);
      if (logRes.success)
        setActivityLog(logRes.activityLog as ActivityLogEntry[]);
    } catch {
      // Background may not be ready yet — silently ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [configRes, statsRes, logRes] = await Promise.all([
          sendMsg({ action: "getMergedConfig" }),
          sendMsg({ action: "getWindowStats" }),
          sendMsg({ action: "getActivityLog" }),
        ]);
        if (configRes.success) {
          setConfig(configRes.values as ExtensionConfig);
          setManagedKeys(configRes.managedKeys as Array<keyof ExtensionConfig>);
        }
        if (statsRes.success)
          setWindowStats(statsRes.windowStats as WindowStats[]);
        if (logRes.success)
          setActivityLog(logRes.activityLog as ActivityLogEntry[]);
      } catch (e) {
        console.error("Tab Monitor Popup: Init error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Real-time update every 2 seconds when extension is enabled
  useEffect(() => {
    const interval = setInterval(() => {
      if (enabledRef.current) fetchStats();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const updateConfig = useCallback(
    (
      key: keyof ExtensionConfig,
      value: ExtensionConfig[keyof ExtensionConfig],
    ) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Enabled toggle saves immediately
  const handleEnabledChange = useCallback(
    async (enabled: boolean) => {
      setConfig((prev) => ({ ...prev, enabled }));
      try {
        const res = await sendMsg({
          action: "saveConfig",
          config: { enabled },
        });
        if (res.success) {
          showNotification(
            enabled ? "Tab monitoring enabled" : "Tab monitoring disabled",
            "success",
          );
          if (enabled) await fetchStats();
        } else {
          throw new Error();
        }
      } catch {
        setConfig((prev) => ({ ...prev, enabled: !enabled }));
        showNotification("Failed to save configuration", "error");
      }
    },
    [showNotification, fetchStats],
  );

  const saveConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      const { adminRole: _adminRole, ...configToSave } = configRef.current;
      const res = await sendMsg({
        action: "saveConfig",
        config: configToSave,
      });
      if (res.success) {
        showNotification("Configuration saved successfully", "success");
        await fetchStats();
      } else {
        showNotification("Failed to save configuration", "error");
      }
    } catch {
      showNotification("Failed to save configuration", "error");
    } finally {
      setIsSaving(false);
    }
  }, [showNotification, fetchStats]);

  const forceCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await sendMsg({ action: "forceCheck" });
      if (res.success) {
        showNotification("Manual verification completed", "success");
        await fetchStats();
      } else {
        showNotification("Force check failed", "error");
      }
    } catch {
      showNotification("Force check failed", "error");
    } finally {
      setIsChecking(false);
    }
  }, [showNotification, fetchStats]);

  const clearLog = useCallback(async () => {
    try {
      const res = await sendMsg({ action: "clearLog" });
      if (res.success) {
        setActivityLog([]);
        showNotification("Activity log cleared", "success");
      }
    } catch {
      showNotification("Failed to clear log", "error");
    }
  }, [showNotification]);

  return {
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
  };
}
