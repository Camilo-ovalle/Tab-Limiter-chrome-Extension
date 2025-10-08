// Configuration management
export const DEFAULT_CONFIG = {
  enabled: true,
  tabLimit: 5,
  windowLimit: 3,
  autoClose: true,
  autoCloseWindows: true,
  windowGracePeriod: 5000, // Countdown duration (ms) for warning page
  notifications: true,
  pauseBetweenClosures: 1000,
  adminRole: false, // Set to true to show config/activity sections in popup
};

export async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_CONFIG);
    // adminRole is always from DEFAULT_CONFIG, never persisted
    return {
      ...DEFAULT_CONFIG,
      ...result,
      adminRole: DEFAULT_CONFIG.adminRole,
    };
  } catch (error) {
    console.error('Tab Monitor: Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config) {
  try {
    await chrome.storage.sync.set(config);
    console.log('Tab Monitor: Configuration saved');
  } catch (error) {
    console.error('Tab Monitor: Error saving config:', error);
  }
}
