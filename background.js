// Chrome Tab Monitor - Background Service Worker
// This service worker monitors tab creation/deletion and enforces tab limits

// Default configuration settings
const DEFAULT_CONFIG = {
  enabled: true,
  tabLimit: 5,
  windowLimit: 3, // Maximum number of browser windows allowed
  autoClose: true,
  autoCloseWindows: true, // Auto-close excess windows
  windowGracePeriod: 20000, // 10 seconds grace period for new windows before auto-close
  notifications: true,
  pauseBetweenClosures: 1000, // 1 second pause between tab closures
  adminRole: false, // Controls visibility of configuration and activity sections
};

// Activity log for recent events
let activityLog = [];
const MAX_LOG_ENTRIES = 50;

// Track recently created windows for grace period
let recentWindows = new Map(); // windowId -> timestamp
let windowTimeouts = new Map(); // windowId -> timeoutId

// Initialize extension on startup
chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

/**
 * Initialize the extension with default settings and start monitoring
 */
async function initializeExtension() {
  console.log('Tab Monitor: Initializing extension...');

  // Load or set default configuration
  const config = await getConfig();
  if (!config.enabled) {
    console.log('Tab Monitor: Extension is disabled');
    return;
  }

  // Update badge and start monitoring
  await updateAllWindowBadges();
  await enforceWindowLimit(); // Check window limit on initialization
  addLogEntry('Extension initialized', 'info');
}

/**
 * Get configuration from storage, merge with defaults
 */
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_CONFIG);
    // Merge with defaults, but ALWAYS use DEFAULT_CONFIG.adminRole
    // adminRole should never be persisted in storage, only in code
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

/**
 * Save configuration to storage
 */
async function saveConfig(config) {
  try {
    await chrome.storage.sync.set(config);
    console.log('Tab Monitor: Configuration saved');
  } catch (error) {
    console.error('Tab Monitor: Error saving config:', error);
  }
}

/**
 * Add entry to activity log
 */
function addLogEntry(message, type = 'info', windowId = null) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = {
    timestamp,
    message,
    type,
    windowId,
  };

  activityLog.unshift(entry);

  // Keep only the most recent entries
  if (activityLog.length > MAX_LOG_ENTRIES) {
    activityLog = activityLog.slice(0, MAX_LOG_ENTRIES);
  }

  console.log(`Tab Monitor [${type}]: ${message}`);
}

/**
 * Get current tab count for a specific window
 */
async function getTabCount(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    return tabs.length;
  } catch (error) {
    console.error('Tab Monitor: Error getting tab count:', error);
    return 0;
  }
}

/**
 * Get tab counts for all windows
 */
async function getAllWindowTabCounts() {
  try {
    const windows = await chrome.windows.getAll();
    const windowStats = [];

    for (const window of windows) {
      if (window.type === 'normal') {
        // Only count normal browser windows
        const tabCount = await getTabCount(window.id);
        windowStats.push({
          windowId: window.id,
          tabCount: tabCount,
          focused: window.focused,
        });
      }
    }

    return windowStats;
  } catch (error) {
    console.error('Tab Monitor: Error getting window stats:', error);
    return [];
  }
}

/**
 * Get current window count
 */
async function getWindowCount() {
  try {
    const windows = await chrome.windows.getAll();
    const normalWindows = windows.filter((window) => window.type === 'normal');
    return normalWindows.length;
  } catch (error) {
    console.error('Tab Monitor: Error getting window count:', error);
    return 0;
  }
}

/**
 * Update badge text for extension icon
 */
async function updateAllWindowBadges() {
  try {
    const windowStats = await getAllWindowTabCounts();
    const totalTabs = windowStats.reduce((sum, stat) => sum + stat.tabCount, 0);
    const windowCount = windowStats.length;
    const config = await getConfig();

    // Set badge text to show total tabs
    chrome.action.setBadgeText({ text: totalTabs.toString() });

    // Set badge color based on whether any window/tab limits are exceeded
    const hasExcessTabs = windowStats.some(
      (stat) => stat.tabCount > config.tabLimit,
    );
    const hasExcessWindows = windowCount > config.windowLimit;
    const badgeColor =
      hasExcessTabs || hasExcessWindows ? '#ff4444' : '#44ff44';
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  } catch (error) {
    console.error('Tab Monitor: Error updating badge:', error);
  }
}

/**
 * Check if a window exceeds tab limit and close excess tabs if auto-close is enabled
 * @param {number} windowId - The window ID to check
 * @param {number} newTabId - Optional: ID of the newly created tab that triggered this check
 */
async function enforceTabLimit(windowId, newTabId = null) {
  const config = await getConfig();

  if (!config.enabled || !config.autoClose) {
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    const tabCount = tabs.length;

    if (tabCount <= config.tabLimit) {
      return; // Within limit
    }

    const excessCount = tabCount - config.tabLimit;
    addLogEntry(
      `Window ${windowId} has ${excessCount} excess tabs (${tabCount}/${config.tabLimit})`,
      'warning',
      windowId,
    );

    // Show notification if enabled
    if (config.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Tab Monitor',
        message: `Window has ${excessCount} excess tabs. Auto-closing...`,
      });
    }

    let closableTabs;

    // If we know which tab was just created, prioritize closing it first
    if (newTabId !== null) {
      const newTab = tabs.find(tab => tab.id === newTabId);
      const otherTabs = tabs
        .filter((tab) => tab.id !== newTabId && !tab.pinned) // Exclude the new tab and pinned tabs
        .sort((a, b) => b.id - a.id); // Sort others by ID (newest first)

      // Put the newly created tab first in the list to close, unless it's pinned
      closableTabs = newTab && !newTab.pinned ? [newTab, ...otherTabs] : otherTabs;
    } else {
      // Fallback: Sort tabs by ID (close newest tabs first, but preserve pinned tabs)
      closableTabs = tabs
        .filter((tab) => !tab.pinned) // Don't close pinned tabs (but allow active tab)
        .sort((a, b) => b.id - a.id); // Newest first (highest ID = most recently created)
    }

    // Close excess tabs with pauses between closures
    const tabsToClose = closableTabs.slice(0, excessCount);

    for (let i = 0; i < tabsToClose.length; i++) {
      const tab = tabsToClose[i];

      try {
        await chrome.tabs.remove(tab.id);
        addLogEntry(`Closed tab: ${tab.title || tab.url}`, 'action', windowId);

        // Pause between closures to avoid overwhelming Chrome
        if (i < tabsToClose.length - 1 && config.pauseBetweenClosures > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.pauseBetweenClosures),
          );
        }
      } catch (error) {
        console.error('Tab Monitor: Error closing tab:', error);
        addLogEntry(
          `Failed to close tab: ${tab.title || tab.url}`,
          'error',
          windowId,
        );
      }
    }

    // Update badge after closing tabs
    setTimeout(updateAllWindowBadges, 100);
  } catch (error) {
    console.error('Tab Monitor: Error enforcing tab limit:', error);
    addLogEntry('Error enforcing tab limit', 'error', windowId);
  }
}

/**
 * Check if window count exceeds limit and close excess windows if auto-close is enabled
 */
async function enforceWindowLimit() {
  const config = await getConfig();

  if (!config.enabled || !config.autoCloseWindows) {
    return;
  }

  try {
    const allWindows = await chrome.windows.getAll();
    const windows = allWindows.filter((window) => window.type === 'normal');
    const windowCount = windows.length;

    if (windowCount <= config.windowLimit) {
      return; // Within limit
    }

    const excessCount = windowCount - config.windowLimit;
    addLogEntry(
      `${excessCount} excess windows detected (${windowCount}/${config.windowLimit})`,
      'warning',
    );

    // Show notification if enabled
    if (config.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Tab Monitor',
        message: `${excessCount} excess windows detected. Auto-closing...`,
      });
    }

    // Filter out the focused window and ensure they're normal windows
    const closableWindows = windows
      .filter((window) => !window.focused && window.type === 'normal') // Don't close the focused window, only normal windows
      .sort((a, b) => b.id - a.id); // Sort by window ID (newer windows have higher IDs - close newest first)

    addLogEntry(
      `Found ${closableWindows.length} closable windows out of ${windows.length} total`,
      'info',
    );

    // Close excess windows with pauses between closures
    const windowsToClose = closableWindows.slice(
      0,
      Math.min(excessCount, closableWindows.length),
    );

    if (windowsToClose.length === 0) {
      addLogEntry(
        `Cannot close any windows - only focused window available`,
        'warning',
      );
      return;
    }

    for (let i = 0; i < windowsToClose.length; i++) {
      const window = windowsToClose[i];

      try {
        await chrome.windows.remove(window.id);
        addLogEntry(`Closed window ${window.id}`, 'action');

        // Pause between closures to avoid overwhelming Chrome
        if (i < windowsToClose.length - 1 && config.pauseBetweenClosures > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.pauseBetweenClosures),
          );
        }
      } catch (error) {
        console.error('Tab Monitor: Error closing window:', error);
        addLogEntry(`Failed to close window ${window.id}`, 'error');
      }
    }

    // Update badge after closing windows
    setTimeout(updateAllWindowBadges, 100);
  } catch (error) {
    console.error('Tab Monitor: Error enforcing window limit:', error);
    addLogEntry('Error enforcing window limit', 'error');
  }
}

/**
 * Close a specific window after its grace period expires, but only if window limit is still exceeded
 */
async function closeSpecificWindowAfterGrace(targetWindowId) {
  const config = await getConfig();

  if (!config.enabled || !config.autoCloseWindows) {
    return;
  }

  try {
    // Check if the window still exists
    const allWindows = await chrome.windows.getAll();
    const targetWindow = allWindows.find(
      (w) => w.id === targetWindowId && w.type === 'normal',
    );

    if (!targetWindow) {
      addLogEntry(
        `Window ${targetWindowId} no longer exists - cleanup timeout`,
        'info',
      );
      recentWindows.delete(targetWindowId);
      windowTimeouts.delete(targetWindowId);
      return;
    }

    // Check if we still exceed the window limit
    const normalWindows = allWindows.filter((w) => w.type === 'normal');
    const windowCount = normalWindows.length;

    if (windowCount <= config.windowLimit) {
      addLogEntry(
        `Window ${targetWindowId} grace period expired, but window limit no longer exceeded (${windowCount}/${config.windowLimit})`,
        'info',
      );
      recentWindows.delete(targetWindowId);
      windowTimeouts.delete(targetWindowId);
      return;
    }

    // Don't close if it's the focused window
    if (targetWindow.focused) {
      addLogEntry(
        `Window ${targetWindowId} is now focused - skipping auto-close`,
        'warning',
      );
      recentWindows.delete(targetWindowId);
      windowTimeouts.delete(targetWindowId);
      return;
    }

    // Close the specific target window
    try {
      await chrome.windows.remove(targetWindowId);
      addLogEntry(
        `Closed window ${targetWindowId} (grace period expired)`,
        'action',
      );

      // Show notification
      if (config.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Tab Monitor',
          message: `Window auto-closed after ${
            config.windowGracePeriod / 1000
          } second grace period.`,
        });
      }
    } catch (error) {
      console.error('Tab Monitor: Error closing target window:', error);
      addLogEntry(`Failed to close window ${targetWindowId}`, 'error');
    }

    // Cleanup tracking
    recentWindows.delete(targetWindowId);
    windowTimeouts.delete(targetWindowId);

    // Update badge
    setTimeout(updateAllWindowBadges, 100);
  } catch (error) {
    console.error(
      'Tab Monitor: Error in closeSpecificWindowAfterGrace:',
      error,
    );
    addLogEntry('Error in window-specific closure', 'error');
  }
}

/**
 * Check if window count exceeds limit and close excess windows, respecting grace period for new windows
 */
async function enforceWindowLimitWithGrace() {
  const config = await getConfig();

  if (!config.enabled || !config.autoCloseWindows) {
    return;
  }

  try {
    const allWindows = await chrome.windows.getAll();
    const windows = allWindows.filter((window) => window.type === 'normal');
    const windowCount = windows.length;

    if (windowCount <= config.windowLimit) {
      return; // Within limit
    }

    const currentTime = Date.now();
    const excessCount = windowCount - config.windowLimit;

    // Filter out focused window and windows still in grace period
    const closableWindows = windows
      .filter((window) => {
        if (window.focused) return false; // Don't close focused window

        const creationTime = recentWindows.get(window.id);
        if (creationTime) {
          const age = currentTime - creationTime;
          if (age < config.windowGracePeriod) {
            addLogEntry(
              `Window ${window.id} still in grace period (${Math.round(
                (config.windowGracePeriod - age) / 1000,
              )}s remaining)`,
              'info',
            );
            return false; // Still in grace period
          }
          // Remove from tracking since grace period expired
          recentWindows.delete(window.id);
        }
        return true;
      })
      .sort((a, b) => b.id - a.id); // Sort by window ID (newer windows have higher IDs)

    addLogEntry(
      `Found ${closableWindows.length} closable windows out of ${windows.length} total (${excessCount} excess)`,
      'info',
    );

    if (closableWindows.length === 0) {
      addLogEntry(
        `Cannot close any windows - all are either focused or in grace period`,
        'warning',
      );
      return;
    }

    // Close excess windows with pauses between closures
    const windowsToClose = closableWindows.slice(
      0,
      Math.min(excessCount, closableWindows.length),
    );

    for (let i = 0; i < windowsToClose.length; i++) {
      const window = windowsToClose[i];

      try {
        await chrome.windows.remove(window.id);
        recentWindows.delete(window.id); // Remove from tracking
        addLogEntry(
          `Closed window ${window.id} (grace period expired)`,
          'action',
        );

        // Pause between closures to avoid overwhelming Chrome
        if (i < windowsToClose.length - 1 && config.pauseBetweenClosures > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.pauseBetweenClosures),
          );
        }
      } catch (error) {
        console.error('Tab Monitor: Error closing window:', error);
        addLogEntry(`Failed to close window ${window.id}`, 'error');
      }
    }

    // Update badge after closing windows
    setTimeout(updateAllWindowBadges, 100);
  } catch (error) {
    console.error(
      'Tab Monitor: Error enforcing window limit with grace:',
      error,
    );
    addLogEntry('Error enforcing window limit with grace', 'error');
  }
}

// Event listeners for tab monitoring

/**
 * Handle new tab creation
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(
    `New tab created in window ${tab.windowId} (ID: ${tab.id})`,
    'info',
    tab.windowId,
  );
  await updateAllWindowBadges();
  // Pass the new tab ID so enforceTabLimit knows which tab to close first
  await enforceTabLimit(tab.windowId, tab.id);
});

/**
 * Handle tab removal
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(
    `Tab removed from window ${removeInfo.windowId}`,
    'info',
    removeInfo.windowId,
  );
  await updateAllWindowBadges();
});

/**
 * Handle tab attachment (moving between windows)
 */
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(
    `Tab attached to window ${attachInfo.newWindowId}`,
    'info',
    attachInfo.newWindowId,
  );
  await updateAllWindowBadges();
  await enforceTabLimit(attachInfo.newWindowId);
});

/**
 * Handle tab detachment (moving between windows)
 */
chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(
    `Tab detached from window ${detachInfo.oldWindowId}`,
    'info',
    detachInfo.oldWindowId,
  );
  await updateAllWindowBadges();
});

/**
 * Handle window focus changes
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  const config = await getConfig();
  if (!config.enabled) return;

  await updateAllWindowBadges();
});

/**
 * Handle new window creation
 */
chrome.windows.onCreated.addListener(async (window) => {
  const config = await getConfig();
  if (!config.enabled) return;

  if (window.type === 'normal') {
    // Track window creation time
    recentWindows.set(window.id, Date.now());

    addLogEntry(`New window created (ID: ${window.id})`, 'info');
    await updateAllWindowBadges();

    // Check if we exceed the window limit
    const windowCount = await getWindowCount();
    if (windowCount > config.windowLimit && config.autoCloseWindows) {
      // Schedule this specific window for closure after grace period
      const timeoutId = setTimeout(async () => {
        await closeSpecificWindowAfterGrace(window.id);
      }, config.windowGracePeriod);

      // Track the timeout so we can cancel it if needed
      windowTimeouts.set(window.id, timeoutId);

      // Show immediate notification about grace period
      if (config.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Tab Monitor - New Window',
          message: `New window will be auto-closed in ${
            config.windowGracePeriod / 1000
          } seconds if window limit is still exceeded.`,
        });
      }

      addLogEntry(
        `New window ${window.id} scheduled for closure in ${
          config.windowGracePeriod / 1000
        } seconds`,
        'warning',
      );
    }
  }
});

/**
 * Handle window removal
 */
chrome.windows.onRemoved.addListener(async (windowId) => {
  const config = await getConfig();
  if (!config.enabled) return;

  // Clean up tracking for removed window
  recentWindows.delete(windowId);

  // Cancel any pending timeout for this window
  const timeoutId = windowTimeouts.get(windowId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    windowTimeouts.delete(windowId);
    addLogEntry(`Cancelled auto-close timeout for window ${windowId}`, 'info');
  }

  addLogEntry(`Window removed (ID: ${windowId})`, 'info');
  await updateAllWindowBadges();
});

// Message handling for communication with popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async response
});

/**
 * Handle messages from popup and other extension components
 */
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getConfig':
        const config = await getConfig();
        sendResponse({ success: true, config });
        break;

      case 'saveConfig':
        await saveConfig(request.config);
        await updateAllWindowBadges();
        sendResponse({ success: true });
        break;

      case 'getWindowStats':
        const windowStats = await getAllWindowTabCounts();
        sendResponse({ success: true, windowStats });
        break;

      case 'getActivityLog':
        sendResponse({ success: true, activityLog });
        break;

      case 'forceCheck':
        const allWindows = await chrome.windows.getAll();
        const windows = allWindows.filter((window) => window.type === 'normal');
        for (const window of windows) {
          await enforceTabLimit(window.id);
        }
        await enforceWindowLimit();
        await updateAllWindowBadges();
        addLogEntry('Manual verification completed', 'action');
        sendResponse({ success: true });
        break;

      case 'clearLog':
        activityLog = [];
        addLogEntry('Activity log cleared', 'action');
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Tab Monitor: Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}
