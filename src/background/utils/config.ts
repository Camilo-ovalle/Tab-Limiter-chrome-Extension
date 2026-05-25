import { ConfigState, ExtensionConfig } from "../../shared/types";

// Configuration management
export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  tabLimit: 6,
  windowLimit: 2,
  autoClose: true,
  autoCloseWindows: true,
  windowGracePeriod: 5000, // Countdown duration (ms) for warning page
  notifications: true,
  pauseBetweenClosures: 1000,
  adminRole: false, // Set to true to show config/activity sections in popup
};

export async function getConfig(): Promise<ExtensionConfig> {
  try {
    const [syncResult, managedResult] = await Promise.all([
      chrome.storage.sync.get(
        DEFAULT_CONFIG as unknown as Record<string, unknown>,
      ),
      chrome.storage.managed.get(null),
    ]);
    // GPO (managed) wins over local, adminRole is never persisted
    return {
      ...DEFAULT_CONFIG,
      ...(syncResult as Partial<ExtensionConfig>),
      ...(managedResult as Partial<ExtensionConfig>),
      adminRole: DEFAULT_CONFIG.adminRole,
    };
  } catch (error) {
    console.error("Tab Monitor: Error loading config:", error);
    return DEFAULT_CONFIG;
  }
}

export async function getMergedConfig(): Promise<ConfigState> {
  const [syncResult, managedResult] = await Promise.all([
    chrome.storage.sync.get(
      DEFAULT_CONFIG as unknown as Record<string, unknown>,
    ),
    chrome.storage.managed.get(null),
  ]);

  const localConfig = syncResult as Partial<ExtensionConfig>;
  const managedConfig = managedResult as Partial<ExtensionConfig>;
  const managedKeys = Object.keys(managedConfig) as Array<
    keyof ExtensionConfig
  >;

  const values: ExtensionConfig = {
    ...DEFAULT_CONFIG,
    ...localConfig,
    ...managedConfig, // GPO wins over local
    adminRole: false,
  };

  return { values, managedKeys };
}

export async function saveConfig(
  config: Partial<ExtensionConfig>,
): Promise<void> {
  try {
    await chrome.storage.sync.set(config);
  } catch (error) {
    console.error("Tab Monitor: Error saving config:", error);
  }
}
