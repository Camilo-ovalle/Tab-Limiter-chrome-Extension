import type { ExtensionConfig } from "../../shared/types";
import { getConfig } from "./config";
import { addLogEntry } from "./logging";
import { getWindowCount } from "./windowManager";

export async function showWindowLimitAlertAndClose(
  windowId: number,
  config: ExtensionConfig | null = null,
): Promise<void> {
  if (!config) config = await getConfig();

  if (!config.enabled || !config.autoCloseWindows) {
    return;
  }

  try {
    const windowCount = await getWindowCount();

    if (windowCount <= config.windowLimit) {
      addLogEntry(
        `Window ${windowId} not closed - limit no longer exceeded (${windowCount}/${config.windowLimit})`,
        "info",
      );
      return;
    }

    const tabs = await chrome.tabs.query({ windowId });

    if (tabs.length === 0) {
      addLogEntry(`Window ${windowId} has no tabs`, "warning");
      return;
    }

    const firstTab = tabs[0];

    const warningPageUrl =
      chrome.runtime.getURL("window-limit-warning.html") +
      `?limit=${config.windowLimit}&current=${windowCount}&windowId=${windowId}`;

    await chrome.tabs.update(firstTab.id!, { url: warningPageUrl });

    addLogEntry(
      `Warning page shown in window ${windowId} (${windowCount}/${config.windowLimit})`,
      "info",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Tab Monitor: Error showing window limit warning:", error);
    addLogEntry(
      `Failed to show warning in window ${windowId}: ${message}`,
      "error",
    );

    try {
      const window = await chrome.windows.get(windowId);
      if (!window.focused) {
        await chrome.windows.remove(windowId);
        addLogEntry(
          `Window ${windowId} closed (warning failed, fallback closure)`,
          "action",
        );
      }
    } catch (fallbackError) {
      console.error(
        "Tab Monitor: Fallback closure also failed:",
        fallbackError,
      );
    }
  }
}

export async function handleWindowCloseConfirmation(
  windowId: number,
): Promise<void> {
  try {
    await chrome.windows.remove(windowId);
    addLogEntry(
      `Window ${windowId} closed after user acknowledgment`,
      "action",
    );
  } catch (error) {
    console.error(
      "Tab Monitor: Error closing window after confirmation:",
      error,
    );
    addLogEntry(`Window ${windowId} may have been manually closed`, "info");
  }
}
