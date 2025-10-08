// Window management module
// Handles window counting and enforcement of window limits

import { getConfig } from './config.js';
import { addLogEntry } from './logging.js';
import { updateAllWindowBadges } from './badge.js';

/**
 * Get current window count
 */
export async function getWindowCount() {
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
 * Check if window count exceeds limit and close excess windows if auto-close is enabled
 * Note: This is used for Force Verification. New windows use alert-based closing.
 */
export async function enforceWindowLimit() {
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

    // Filter out the focused window
    const closableWindows = windows
      .filter((window) => !window.focused)
      .sort((a, b) => b.id - a.id); // Sort by window ID (newer windows have higher IDs - close newest first)

    addLogEntry(
      `Found ${closableWindows.length} closable windows out of ${windows.length} total`,
      'info',
    );

    if (closableWindows.length === 0) {
      addLogEntry(
        `Cannot close any windows - only focused window available`,
        'warning',
      );
      return;
    }

    // Close excess windows with pauses between closures
    const windowsToClose = closableWindows.slice(
      0,
      Math.min(excessCount, closableWindows.length),
    );

    // Show notification if enabled
    if (config.notifications && windowsToClose.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Tab Monitor',
        message: `Closing ${windowsToClose.length} excess window(s)...`,
      });
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
    setTimeout(() => updateAllWindowBadges(), 100);
  } catch (error) {
    console.error('Tab Monitor: Error enforcing window limit:', error);
    addLogEntry('Error enforcing window limit', 'error');
  }
}
