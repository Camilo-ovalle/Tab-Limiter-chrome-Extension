// Chrome Tab Monitor - Background Service Worker
import { getConfig } from './utils/config.js';
import { addLogEntry } from './utils/logging.js';
import { enforceTabLimit } from './utils/tabManager.js';
import { updateAllWindowBadges } from './utils/badge.js';
import { handleMessage } from './utils/messageHandler.js';
import { getWindowCount } from './utils/windowManager.js';
import { showWindowLimitAlertAndClose } from './utils/windowLimitAlert.js';

chrome.runtime.onStartup.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(initializeExtension);

async function initializeExtension() {
  console.log('Tab Monitor: Initializing extension...');

  const config = await getConfig();
  if (!config.enabled) {
    console.log('Tab Monitor: Extension is disabled');
    return;
  }

  await updateAllWindowBadges();
  // Note: Window limits are NOT enforced on initialization to avoid surprising users.
  // They're only enforced when users actively create new windows or use Force Verification.
  addLogEntry('Extension initialized', 'info');
}

// Tab event listeners
chrome.tabs.onCreated.addListener(async (tab) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(
    `New tab created in window ${tab.windowId} (ID: ${tab.id})`,
    'info',
    tab.windowId,
  );
  await updateAllWindowBadges();
  await enforceTabLimit(tab.windowId, tab.id); // Pass tab.id to prioritize closing it first
});

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

// Window event listeners
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  const config = await getConfig();
  if (!config.enabled) return;

  await updateAllWindowBadges();
});

chrome.windows.onCreated.addListener(async (window) => {
  const config = await getConfig();
  if (!config.enabled) return;

  if (window.type === 'normal') {
    addLogEntry(`New window created (ID: ${window.id})`, 'info');
    await updateAllWindowBadges();

    const windowCount = await getWindowCount();
    if (windowCount > config.windowLimit && config.autoCloseWindows) {
      // 500ms delay ensures window and tabs are ready before showing warning page
      setTimeout(async () => {
        await showWindowLimitAlertAndClose(window.id);
      }, 500);

      addLogEntry(
        `Window limit exceeded (${windowCount}/${config.windowLimit}) - alert will be shown`,
        'warning',
      );
    }
  }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const config = await getConfig();
  if (!config.enabled) return;

  addLogEntry(`Window removed (ID: ${windowId})`, 'info');
  await updateAllWindowBadges();
});

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async responses
});
