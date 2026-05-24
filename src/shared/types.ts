export interface ExtensionConfig {
  enabled: boolean;
  tabLimit: number;
  windowLimit: number;
  autoClose: boolean;
  autoCloseWindows: boolean;
  windowGracePeriod: number; // en milisegundos
  notifications: boolean;
  pauseBetweenClosures: number; // en milisegundos
  adminRole: boolean;
}

export interface ActivityLogEntry {
  timestamp: string;
  type: "info" | "warning" | "error" | "action";
  message: string;
  windowId: number | null;
}

export interface WindowStats {
  windowId: number;
  tabCount: number;
  focused: boolean;
}

export type MessageRequest =
  | { action: "getConfig" }
  | { action: "getMergedConfig" }
  | { action: "saveConfig"; config: Partial<ExtensionConfig> }
  | { action: "getWindowStats" }
  | { action: "getActivityLog" }
  | { action: "forceCheck" }
  | { action: "clearLog" }
  | { action: "closeWindowConfirmed"; windowId: number };

export interface SystemStats {
  totalWindows: number;
  totalTabs: number;
  violationsCount: number;
  windows: WindowStats[];
}

export interface ConfigState {
  values: ExtensionConfig;
  managedKeys: Array<keyof ExtensionConfig>;
}
