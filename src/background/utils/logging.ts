import type { ActivityLogEntry } from "../../shared/types";

// Activity logging
let activityLog: ActivityLogEntry[] = [];
const MAX_LOG_ENTRIES = 50;

export function addLogEntry(
  message: string,
  type: ActivityLogEntry["type"] = "info",
  windowId: number | null = null,
): void {
  const timestamp = new Date().toLocaleTimeString();
  const entry: ActivityLogEntry = {
    timestamp,
    message,
    type,
    windowId,
  };

  activityLog.unshift(entry);

  if (activityLog.length > MAX_LOG_ENTRIES) {
    activityLog = activityLog.slice(0, MAX_LOG_ENTRIES);
  }

  console.log(`Tab Monitor [${type}]: ${message}`);
}

export function getActivityLog(): ActivityLogEntry[] {
  return activityLog;
}

export function clearActivityLog(): void {
  activityLog = [];
  addLogEntry("Activity log cleared", "action");
}
