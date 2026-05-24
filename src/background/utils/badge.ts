// Badge management
import type { ExtensionConfig } from "../../shared/types";
import { getAllWindowTabCounts } from "./tabManager";
import { getConfig } from "./config";

export async function updateAllWindowBadges(
  config: ExtensionConfig | null = null,
): Promise<void> {
  try {
    const windowStats = await getAllWindowTabCounts();
    const totalTabs = windowStats.reduce((sum, stat) => sum + stat.tabCount, 0);
    const windowCount = windowStats.length;
    if (!config) config = await getConfig();
    const { tabLimit, windowLimit } = config;

    chrome.action.setBadgeText({ text: totalTabs.toString() });

    const hasExcessTabs = windowStats.some((stat) => stat.tabCount > tabLimit);
    const hasExcessWindows = windowCount > windowLimit;
    const badgeColor =
      hasExcessTabs || hasExcessWindows ? "#ff4444" : "#44ff44";
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
  } catch (error) {
    console.error("Tab Monitor: Error updating badge:", error);
  }
}
