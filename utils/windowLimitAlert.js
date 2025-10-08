// Window Limit Alert Module
// Handles alerting users when they exceed the window limit

import { getConfig } from './config.js';
import { addLogEntry } from './logging.js';
import { getWindowCount } from './windowManager.js';

/**
 * Show warning page in a specific window
 * @param {number} windowId - The window ID to show the warning in
 */
export async function showWindowLimitAlertAndClose(windowId) {
  const config = await getConfig();

  if (!config.enabled || !config.autoCloseWindows) {
    return;
  }

  try {
    // Get the window count to confirm we're still over the limit
    const windowCount = await getWindowCount();

    if (windowCount <= config.windowLimit) {
      addLogEntry(
        `Window ${windowId} not closed - limit no longer exceeded (${windowCount}/${config.windowLimit})`,
        'info',
      );
      return;
    }

    // Get all tabs in this window
    const tabs = await chrome.tabs.query({ windowId: windowId });

    if (tabs.length === 0) {
      addLogEntry(`Window ${windowId} has no tabs`, 'warning');
      return;
    }

    // Get the first tab in the window
    const firstTab = tabs[0];

    // Create the warning page URL with parameters
    const warningPageUrl = chrome.runtime.getURL('window-limit-warning.html') +
      `?limit=${config.windowLimit}&current=${windowCount}&windowId=${windowId}`;

    // Navigate the first tab to our warning page
    await chrome.tabs.update(firstTab.id, { url: warningPageUrl });

    addLogEntry(
      `Warning page shown in window ${windowId} (${windowCount}/${config.windowLimit})`,
      'info',
    );

  } catch (error) {
    console.error('Tab Monitor: Error showing window limit warning:', error);
    addLogEntry(`Failed to show warning in window ${windowId}: ${error.message}`, 'error');

    // Fallback: close the window immediately if we can't show the warning
    try {
      const window = await chrome.windows.get(windowId);
      if (!window.focused) {
        await chrome.windows.remove(windowId);
        addLogEntry(
          `Window ${windowId} closed (warning failed, fallback closure)`,
          'action',
        );
      }
    } catch (fallbackError) {
      console.error('Tab Monitor: Fallback closure also failed:', fallbackError);
    }
  }
}

/**
 * Handle the user's response to the window limit alert
 * @param {number} windowId - The window ID to close
 * @param {boolean} confirmed - Whether the user confirmed the closure
 */
export async function handleWindowCloseConfirmation(windowId, confirmed) {
  try {
    // Always close the window when the alert is dismissed (OK or Cancel both close it)
    // This ensures the user is aware and the window is removed
    const window = await chrome.windows.get(windowId);

    if (window) {
      await chrome.windows.remove(windowId);
      addLogEntry(
        `Window ${windowId} closed after user acknowledgment`,
        'action',
      );
    }
  } catch (error) {
    // Window might already be closed
    console.error('Tab Monitor: Error closing window after confirmation:', error);
    addLogEntry(`Window ${windowId} may have been manually closed`, 'info');
  }
}
