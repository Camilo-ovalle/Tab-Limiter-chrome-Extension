// Activity logging
let activityLog = [];
const MAX_LOG_ENTRIES = 50;

export function addLogEntry(message, type = 'info', windowId = null) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = {
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

export function getActivityLog() {
  return activityLog;
}

export function clearActivityLog() {
  activityLog = [];
  addLogEntry('Activity log cleared', 'action');
}
