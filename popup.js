// Chrome Tab Monitor - Popup Interface JavaScript
// This script handles the popup UI, real-time updates, and user interactions

// Global variables for managing UI state
let currentConfig = {};
let updateInterval = null;
let isLoading = false;

// DOM elements - cached for performance
const elements = {};

/**
 * Initialize the popup when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Tab Monitor Popup: Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show loading overlay
  showLoading(true);
  
  try {
    // Load initial data
    await loadConfiguration();
    await updateDisplay();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Hide loading overlay
    showLoading(false);
    
  } catch (error) {
    console.error('Tab Monitor Popup: Initialization error:', error);
    showNotification('Failed to initialize extension', 'error');
    showLoading(false);
  }
});

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
  elements.enabledToggle = document.getElementById('enabledToggle');
  elements.tabLimit = document.getElementById('tabLimit');
  elements.autoCloseToggle = document.getElementById('autoCloseToggle');
  elements.notificationsToggle = document.getElementById('notificationsToggle');
  elements.pauseBetweenClosures = document.getElementById('pauseBetweenClosures');
  elements.statusIndicator = document.getElementById('statusIndicator');
  elements.statsGrid = document.getElementById('statsGrid');
  elements.windowsList = document.getElementById('windowsList');
  elements.activityLog = document.getElementById('activityLog');
  elements.saveConfigBtn = document.getElementById('saveConfigBtn');
  elements.forceCheckBtn = document.getElementById('forceCheckBtn');
  elements.clearLogBtn = document.getElementById('clearLogBtn');
  elements.loadingOverlay = document.getElementById('loadingOverlay');
  elements.notification = document.getElementById('notification');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Configuration change listeners
  elements.enabledToggle.addEventListener('change', onEnabledToggleChange);
  elements.tabLimit.addEventListener('input', debounce(onConfigChange, 300));
  elements.autoCloseToggle.addEventListener('change', onConfigChange);
  elements.notificationsToggle.addEventListener('change', onConfigChange);
  elements.pauseBetweenClosures.addEventListener('input', debounce(onConfigChange, 300));
  
  // Button listeners
  elements.saveConfigBtn.addEventListener('click', onSaveConfig);
  elements.forceCheckBtn.addEventListener('click', onForceCheck);
  elements.clearLogBtn.addEventListener('click', onClearLog);
  
  // Cleanup on window unload
  window.addEventListener('beforeunload', cleanup);
}

/**
 * Load configuration from background script
 */
async function loadConfiguration() {
  try {
    const response = await sendMessage({ action: 'getConfig' });
    if (response.success) {
      currentConfig = response.config;
      updateConfigUI();
      updateStatusIndicator();
    } else {
      throw new Error('Failed to load configuration');
    }
  } catch (error) {
    console.error('Tab Monitor Popup: Error loading configuration:', error);
    throw error;
  }
}

/**
 * Update UI elements with current configuration
 */
function updateConfigUI() {
  elements.enabledToggle.checked = currentConfig.enabled;
  elements.tabLimit.value = currentConfig.tabLimit;
  elements.autoCloseToggle.checked = currentConfig.autoClose;
  elements.notificationsToggle.checked = currentConfig.notifications;
  elements.pauseBetweenClosures.value = currentConfig.pauseBetweenClosures;
  
  // Enable/disable controls based on enabled state
  const isEnabled = currentConfig.enabled;
  elements.tabLimit.disabled = !isEnabled;
  elements.autoCloseToggle.disabled = !isEnabled;
  elements.notificationsToggle.disabled = !isEnabled || !currentConfig.autoClose;
  elements.pauseBetweenClosures.disabled = !isEnabled || !currentConfig.autoClose;
}

/**
 * Update status indicator
 */
function updateStatusIndicator() {
  const indicator = elements.statusIndicator;
  
  if (currentConfig.enabled) {
    indicator.className = 'status-indicator status-active';
    indicator.title = 'Tab monitoring is active';
  } else {
    indicator.className = 'status-indicator status-inactive';
    indicator.title = 'Tab monitoring is disabled';
  }
}

/**
 * Update all display elements with fresh data
 */
async function updateDisplay() {
  try {
    // Update statistics and windows list
    await Promise.all([
      updateStatistics(),
      updateWindowsList(),
      updateActivityLog()
    ]);
  } catch (error) {
    console.error('Tab Monitor Popup: Error updating display:', error);
  }
}

/**
 * Update statistics section
 */
async function updateStatistics() {
  try {
    const response = await sendMessage({ action: 'getWindowStats' });
    if (!response.success) return;
    
    const windowStats = response.windowStats;
    const totalTabs = windowStats.reduce((sum, stat) => sum + stat.tabCount, 0);
    const totalWindows = windowStats.length;
    const excessWindows = windowStats.filter(stat => stat.tabCount > currentConfig.tabLimit).length;
    const averageTabs = totalWindows > 0 ? Math.round(totalTabs / totalWindows) : 0;
    
    const statsHTML = `
      <div class="stat-card">
        <div class="stat-value">${totalTabs}</div>
        <div class="stat-label">Total Tabs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalWindows}</div>
        <div class="stat-label">Windows</div>
      </div>
      <div class="stat-card ${excessWindows > 0 ? 'stat-warning' : ''}">
        <div class="stat-value">${excessWindows}</div>
        <div class="stat-label">Over Limit</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${averageTabs}</div>
        <div class="stat-label">Avg per Window</div>
      </div>
    `;
    
    elements.statsGrid.innerHTML = statsHTML;
    
  } catch (error) {
    console.error('Tab Monitor Popup: Error updating statistics:', error);
  }
}

/**
 * Update windows list section
 */
async function updateWindowsList() {
  try {
    const response = await sendMessage({ action: 'getWindowStats' });
    if (!response.success) return;
    
    const windowStats = response.windowStats;
    
    if (windowStats.length === 0) {
      elements.windowsList.innerHTML = '<div class="empty-state">No windows found</div>';
      return;
    }
    
    const windowsHTML = windowStats.map(stat => {
      const isOverLimit = stat.tabCount > currentConfig.tabLimit;
      const limitPercentage = Math.min((stat.tabCount / currentConfig.tabLimit) * 100, 100);
      
      return `
        <div class="window-item ${isOverLimit ? 'window-over-limit' : ''} ${stat.focused ? 'window-focused' : ''}">
          <div class="window-header">
            <div class="window-title">
              Window ${stat.windowId}
              ${stat.focused ? '<span class="window-badge">Active</span>' : ''}
            </div>
            <div class="window-count ${isOverLimit ? 'count-warning' : 'count-ok'}">
              ${stat.tabCount}/${currentConfig.tabLimit}
            </div>
          </div>
          <div class="window-progress">
            <div class="progress-bar">
              <div class="progress-fill ${isOverLimit ? 'progress-over' : 'progress-ok'}" 
                   style="width: ${limitPercentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    elements.windowsList.innerHTML = windowsHTML;
    
  } catch (error) {
    console.error('Tab Monitor Popup: Error updating windows list:', error);
  }
}

/**
 * Update activity log section
 */
async function updateActivityLog() {
  try {
    const response = await sendMessage({ action: 'getActivityLog' });
    if (!response.success) return;
    
    const activityLog = response.activityLog;
    
    if (activityLog.length === 0) {
      elements.activityLog.innerHTML = '<div class="empty-state">No recent activity</div>';
      return;
    }
    
    const logHTML = activityLog.slice(0, 10).map(entry => {
      const iconClass = getLogIconClass(entry.type);
      return `
        <div class="log-entry log-${entry.type}">
          <div class="log-icon ${iconClass}"></div>
          <div class="log-content">
            <div class="log-message">${escapeHtml(entry.message)}</div>
            <div class="log-time">${entry.timestamp}</div>
          </div>
        </div>
      `;
    }).join('');
    
    elements.activityLog.innerHTML = logHTML;
    
  } catch (error) {
    console.error('Tab Monitor Popup: Error updating activity log:', error);
  }
}

/**
 * Get appropriate icon class for log entry type
 */
function getLogIconClass(type) {
  switch (type) {
    case 'info': return 'icon-info';
    case 'warning': return 'icon-warning';
    case 'error': return 'icon-error';
    case 'action': return 'icon-action';
    default: return 'icon-info';
  }
}

/**
 * Handle enabled toggle change
 */
async function onEnabledToggleChange() {
  const wasEnabled = currentConfig.enabled;
  currentConfig.enabled = elements.enabledToggle.checked;
  
  // Update UI immediately
  updateConfigUI();
  updateStatusIndicator();
  
  // Save configuration
  try {
    await saveCurrentConfig();
    
    const message = currentConfig.enabled ? 'Tab monitoring enabled' : 'Tab monitoring disabled';
    showNotification(message, 'success');
    
    // Update display if enabled
    if (currentConfig.enabled) {
      await updateDisplay();
    }
    
  } catch (error) {
    // Revert on error
    currentConfig.enabled = wasEnabled;
    elements.enabledToggle.checked = wasEnabled;
    updateConfigUI();
    updateStatusIndicator();
    showNotification('Failed to save configuration', 'error');
  }
}

/**
 * Handle other configuration changes
 */
function onConfigChange() {
  // Update current configuration with UI values
  currentConfig.tabLimit = parseInt(elements.tabLimit.value) || 10;
  currentConfig.autoClose = elements.autoCloseToggle.checked;
  currentConfig.notifications = elements.notificationsToggle.checked;
  currentConfig.pauseBetweenClosures = parseInt(elements.pauseBetweenClosures.value) || 1000;
  
  // Update dependent UI elements
  elements.notificationsToggle.disabled = !currentConfig.enabled || !currentConfig.autoClose;
  elements.pauseBetweenClosures.disabled = !currentConfig.enabled || !currentConfig.autoClose;
}

/**
 * Handle save configuration button click
 */
async function onSaveConfig() {
  const button = elements.saveConfigBtn;
  const textSpan = button.querySelector('.btn-text');
  const loadingSpan = button.querySelector('.btn-loading');
  
  try {
    // Show loading state
    textSpan.style.display = 'none';
    loadingSpan.style.display = 'inline';
    button.disabled = true;
    
    // Save configuration
    await saveCurrentConfig();
    
    showNotification('Configuration saved successfully', 'success');
    
    // Refresh display
    await updateDisplay();
    
  } catch (error) {
    console.error('Tab Monitor Popup: Error saving configuration:', error);
    showNotification('Failed to save configuration', 'error');
  } finally {
    // Reset button state
    textSpan.style.display = 'inline';
    loadingSpan.style.display = 'none';
    button.disabled = false;
  }
}

/**
 * Handle force check button click
 */
async function onForceCheck() {
  const button = elements.forceCheckBtn;
  const textSpan = button.querySelector('.btn-text');
  const loadingSpan = button.querySelector('.btn-loading');
  
  try {
    // Show loading state
    textSpan.style.display = 'none';
    loadingSpan.style.display = 'inline';
    button.disabled = true;
    
    // Trigger force check
    const response = await sendMessage({ action: 'forceCheck' });
    
    if (response.success) {
      showNotification('Manual verification completed', 'success');
      await updateDisplay();
    } else {
      showNotification('Force check failed', 'error');
    }
    
  } catch (error) {
    console.error('Tab Monitor Popup: Error during force check:', error);
    showNotification('Force check failed', 'error');
  } finally {
    // Reset button state
    textSpan.style.display = 'inline';
    loadingSpan.style.display = 'none';
    button.disabled = false;
  }
}

/**
 * Handle clear log button click
 */
async function onClearLog() {
  try {
    const response = await sendMessage({ action: 'clearLog' });
    if (response.success) {
      showNotification('Activity log cleared', 'success');
      await updateActivityLog();
    } else {
      showNotification('Failed to clear log', 'error');
    }
  } catch (error) {
    console.error('Tab Monitor Popup: Error clearing log:', error);
    showNotification('Failed to clear log', 'error');
  }
}

/**
 * Save current configuration to storage
 */
async function saveCurrentConfig() {
  const response = await sendMessage({ 
    action: 'saveConfig', 
    config: currentConfig 
  });
  
  if (!response.success) {
    throw new Error('Failed to save configuration');
  }
}

/**
 * Start real-time updates
 */
function startRealTimeUpdates() {
  // Clear existing interval if any
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Update every 2 seconds
  updateInterval = setInterval(async () => {
    if (!isLoading && currentConfig.enabled) {
      await updateDisplay();
    }
  }, 2000);
}

/**
 * Stop real-time updates
 */
function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
  isLoading = show;
  elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  const notification = elements.notification;
  const messageSpan = notification.querySelector('.notification-message');
  const iconSpan = notification.querySelector('.notification-icon');
  
  // Set message and type
  messageSpan.textContent = message;
  notification.className = `notification notification-${type}`;
  
  // Set appropriate icon
  iconSpan.className = `notification-icon icon-${type}`;
  
  // Show notification
  notification.classList.add('notification-show');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('notification-show');
  }, 3000);
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Tab Monitor Popup: Message error:', chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { success: false, error: 'No response' });
      }
    });
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Cleanup function
 */
function cleanup() {
  stopRealTimeUpdates();
}