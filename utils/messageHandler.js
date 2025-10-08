// Message handler module
// Handles communication between popup and background script

import { getConfig, saveConfig } from './config.js';
import { getActivityLog, clearActivityLog, addLogEntry } from './logging.js';
import { getAllWindowTabCounts, enforceTabLimit } from './tabManager.js';
import { enforceWindowLimit } from './windowManager.js';
import { updateAllWindowBadges } from './badge.js';
import { handleWindowCloseConfirmation } from './windowLimitAlert.js';

/**
 * Handle messages from popup and other extension components
 */
export async function handleMessage(request, sender, sendResponse) {
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
        const activityLog = getActivityLog();
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
        clearActivityLog();
        sendResponse({ success: true });
        break;

      case 'closeWindowConfirmed':
        await handleWindowCloseConfirmation(request.windowId, request.confirmed);
        await updateAllWindowBadges();
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
