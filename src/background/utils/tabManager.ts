import type { ExtensionConfig, WindowStats } from "../../shared/types";
import { getConfig } from "./config";
import { addLogEntry } from "./logging";

async function getTabCount(windowId: number | undefined): Promise<number> {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    return tabs.length;
  } catch (error) {
    console.error("Tab Monitor: Error getting tab count:", error);
    return 0;
  }
}

export async function getAllWindowTabCounts(): Promise<WindowStats[]> {
  try {
    const windows = await chrome.windows.getAll();
    const windowStats: WindowStats[] = [];

    for (const window of windows) {
      if (window.type === "normal") {
        const tabCount = await getTabCount(window.id);
        windowStats.push({
          windowId: window.id!,
          tabCount,
          focused: window.focused,
        });
      }
    }

    return windowStats;
  } catch (error) {
    console.error("Tab Monitor: Error getting window stats:", error);
    return [];
  }
}

export async function enforceTabLimit(
  windowId: number | undefined,
  newTabId: number | null = null,
  config: ExtensionConfig | null = null,
): Promise<void> {
  if (!config) config = await getConfig();

  if (!config.enabled || !config.autoClose) {
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ windowId });
    const tabCount = tabs.length;

    if (tabCount <= config.tabLimit) {
      return;
    }

    const excessCount = tabCount - config.tabLimit;
    addLogEntry(
      `Window ${windowId} has ${excessCount} excess tabs (${tabCount}/${config.tabLimit})`,
      "warning",
      windowId ?? null,
    );

    if (config.notifications) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Tab Monitor",
        message: `Window has ${excessCount} excess tabs. Auto-closing...`,
      });
    }

    let closableTabs: chrome.tabs.Tab[];

    if (newTabId !== null) {
      const newTab = tabs.find((tab) => tab.id === newTabId);
      const otherTabs = tabs
        .filter((tab) => tab.id !== newTabId && !tab.pinned)
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

      closableTabs =
        newTab && !newTab.pinned ? [newTab, ...otherTabs] : otherTabs;
    } else {
      closableTabs = tabs
        .filter((tab) => !tab.pinned)
        .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    }

    const tabsToClose = closableTabs.slice(0, excessCount);

    for (let i = 0; i < tabsToClose.length; i++) {
      const tab = tabsToClose[i];

      try {
        await chrome.tabs.remove(tab.id!);
        addLogEntry(
          `Closed tab: ${tab.title || tab.url}`,
          "action",
          windowId ?? null,
        );

        if (i < tabsToClose.length - 1 && config.pauseBetweenClosures > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, config!.pauseBetweenClosures),
          );
        }
      } catch (error) {
        console.error("Tab Monitor: Error closing tab:", error);
        addLogEntry(
          `Failed to close tab: ${tab.title || tab.url}`,
          "error",
          windowId ?? null,
        );
      }
    }
  } catch (error) {
    console.error("Tab Monitor: Error enforcing tab limit:", error);
    addLogEntry("Error enforcing tab limit", "error", windowId ?? null);
  }
}
