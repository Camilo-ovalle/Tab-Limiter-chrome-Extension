// Tab management module
// Handles tab counting and enforcement of tab limits

import { getConfig } from './config.js';
import { addLogEntry } from './logging.js';

/**
 * Get current tab count for a specific window
 */
export async function getTabCount(windowId) {
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
export async function getAllWindowTabCounts() {
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
 * Check if a window exceeds tab limit and close excess tabs if auto-close is enabled
 * @param {number} windowId - The window ID to check
 * @param {number} newTabId - Optional: ID of the newly created tab that triggered this check
 */
export async function enforceTabLimit(windowId, newTabId = null) {
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
  } catch (error) {
    console.error('Tab Monitor: Error enforcing tab limit:', error);
    addLogEntry('Error enforcing tab limit', 'error', windowId);
  }
}
