// Badge management
import { getAllWindowTabCounts } from './tabManager.js';
import { getConfig } from './config.js';

export async function updateAllWindowBadges() {
  try {
    const windowStats = await getAllWindowTabCounts();
    const totalTabs = windowStats.reduce((sum, stat) => sum + stat.tabCount, 0);
    const windowCount = windowStats.length;
    const config = await getConfig();

    chrome.action.setBadgeText({ text: totalTabs.toString() });

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
