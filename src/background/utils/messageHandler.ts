import type { MessageRequest } from "../../shared/types";
import { getConfig, getMergedConfig, saveConfig } from "./config";
import { getActivityLog, clearActivityLog, addLogEntry } from "./logging";
import { getAllWindowTabCounts, enforceTabLimit } from "./tabManager";
import { enforceWindowLimit } from "./windowManager";
import { updateAllWindowBadges } from "./badge";
import { handleWindowCloseConfirmation } from "./windowLimitAlert";

export async function handleMessage(
  request: MessageRequest,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  try {
    switch (request.action) {
      case "getConfig": {
        const config = await getConfig();
        sendResponse({ success: true, config });
        break;
      }
      case "getMergedConfig": {
        const configState = await getMergedConfig();
        sendResponse({ success: true, ...configState });
        break;
      }
      case "saveConfig": {
        await saveConfig(request.config);
        await updateAllWindowBadges();
        sendResponse({ success: true });
        break;
      }
      case "getWindowStats": {
        const windowStats = await getAllWindowTabCounts();
        sendResponse({ success: true, windowStats });
        break;
      }
      case "getActivityLog": {
        const activityLog = getActivityLog();
        sendResponse({ success: true, activityLog });
        break;
      }
      case "forceCheck": {
        const allWindows = await chrome.windows.getAll();
        const windows = allWindows.filter((window) => window.type === "normal");
        for (const window of windows) {
          await enforceTabLimit(window.id);
        }
        await enforceWindowLimit();
        await updateAllWindowBadges();
        addLogEntry("Manual verification completed", "action");
        sendResponse({ success: true });
        break;
      }
      case "clearLog": {
        clearActivityLog();
        sendResponse({ success: true });
        break;
      }
      case "closeWindowConfirmed": {
        await handleWindowCloseConfirmation(request.windowId);
        await updateAllWindowBadges();
        sendResponse({ success: true });
        break;
      }
      default:
        sendResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("Tab Monitor: Error handling message:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
