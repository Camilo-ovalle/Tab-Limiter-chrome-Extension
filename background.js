// Chrome Tab Monitor - Background Service Worker
// This service worker monitors tab creation/deletion and enforces tab limits

// Default configuration settings
const DEFAULT_CONFIG = {
  enabled: true,
  tabLimit: 10,
  autoClose: true,
  notifications: true,
  pauseBetweenClosures: 1000 // 1 second pause between tab closures
};

// Activity log for recent events
let activityLog = [];
const MAX_LOG_ENTRIES = 50;

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
  addLogEntry('Extension initialized', 'info');
}

/**
 * Get configuration from storage, merge with defaults
 */
async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG, ...result };
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
    windowId
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
      if (window.type === 'normal') { // Only count normal browser windows
        const tabCount = await getTabCount(window.id);
        windowStats.push({
          windowId: window.id,
          tabCount: tabCount,
          focused: window.focused
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
 * Update badge text for extension icon
 */
async function updateAllWindowBadges() {
  try {
    const windowStats = await getAllWindowTabCounts();
    const totalTabs = windowStats.reduce((sum, stat) => sum + stat.tabCount, 0);
    const config = await getConfig();
    
    // Set badge text to show total tabs
    chrome.action.setBadgeText({ text: totalTabs.toString() });
    
    // Set badge color based on whether any window exceeds the limit
    const hasExcessTabs = windowStats.some(stat => stat.tabCount > config.tabLimit);
    const badgeColor = hasExcessTabs ? '#ff4444' : '#44ff44';
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    
  } catch (error) {
    console.error('Tab Monitor: Error updating badge:', error);
  }
}

/**
 * Check if a window exceeds tab limit and close excess tabs if auto-close is enabled
 */
async function enforceTabLimit(windowId) {
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
    addLogEntry(`Window ${windowId} has ${excessCount} excess tabs (${tabCount}/${config.tabLimit})`, 'warning', windowId);
    
    // Show notification if enabled
    if (config.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Tab Monitor',
        message: `Window has ${excessCount} excess tabs. Auto-closing...`
      });
    }
    
    // Sort tabs by last accessed time (close most recent first, but preserve active and pinned tabs)
    const closableTabs = tabs
      .filter(tab => !tab.active && !tab.pinned) // Don't close active or pinned tabs
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)); // Most recent first
    
    // Close excess tabs with pauses between closures
    const tabsToClose = closableTabs.slice(0, excessCount);
    
    for (let i = 0; i < tabsToClose.length; i++) {
      const tab = tabsToClose[i];
      
      try {
        await chrome.tabs.remove(tab.id);
        addLogEntry(`Closed tab: ${tab.title || tab.url}`, 'action', windowId);
        
        // Pause between closures to avoid overwhelming Chrome
        if (i < tabsToClose.length - 1 && config.pauseBetweenClosures > 0) {
          await new Promise(resolve => setTimeout(resolve, config.pauseBetweenClosures));
        }
      } catch (error) {
        console.error('Tab Monitor: Error closing tab:', error);
        addLogEntry(`Failed to close tab: ${tab.title || tab.url}`, 'error', windowId);
      }
    }
    
    // Update badge after closing tabs
    setTimeout(updateAllWindowBadges, 100);
    
  } catch (error) {
    console.error('Tab Monitor: Error enforcing tab limit:', error);
    addLogEntry('Error enforcing tab limit', 'error', windowId);
  }
}

// Event listeners for tab monitoring

/**
 * Handle new tab creation
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  const config = await getConfig();
  if (!config.enabled) return;
  
  addLogEntry(`New tab created in window ${tab.windowId}`, 'info', tab.windowId);
  await updateAllWindowBadges();
  await enforceTabLimit(tab.windowId);
});

/**
 * Handle tab removal
 */
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;
  
  addLogEntry(`Tab removed from window ${removeInfo.windowId}`, 'info', removeInfo.windowId);
  await updateAllWindowBadges();
});

/**
 * Handle tab attachment (moving between windows)
 */
chrome.tabs.onAttached.addListener(async (tabId, attachInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;
  
  addLogEntry(`Tab attached to window ${attachInfo.newWindowId}`, 'info', attachInfo.newWindowId);
  await updateAllWindowBadges();
  await enforceTabLimit(attachInfo.newWindowId);
});

/**
 * Handle tab detachment (moving between windows)
 */
chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  const config = await getConfig();
  if (!config.enabled) return;
  
  addLogEntry(`Tab detached from window ${detachInfo.oldWindowId}`, 'info', detachInfo.oldWindowId);
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
        const windows = await chrome.windows.getAll({ type: 'normal' });
        for (const window of windows) {
          await enforceTabLimit(window.id);
        }
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