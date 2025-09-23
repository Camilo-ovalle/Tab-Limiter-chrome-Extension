# Chrome Tab Monitor Extension

A powerful Chrome extension that monitors and controls the number of tabs per window with automatic closing, real-time statistics, and professional interface.

## Features

### Core Functionality
- **Real-time tab monitoring** - Tracks tab creation and deletion across all browser windows
- **Configurable tab limits** - Set custom limits per window (default: 10 tabs)
- **Automatic tab closing** - Intelligently closes excess tabs when limits are exceeded
- **Smart closing logic** - Never closes active or pinned tabs, closes most recent first
- **Native Chrome APIs** - Uses chrome.tabs, chrome.windows, chrome.storage, chrome.notifications

### User Interface
- **Modern professional design** - Clean interface with subtle gradients and smooth animations
- **Real-time statistics** - Live view of total tabs, windows, and limit violations
- **Window overview** - Individual window stats with visual progress indicators
- **Activity logging** - Recent events with timestamps and color-coded status
- **Responsive design** - Works on different screen sizes

### Configuration Options
- **Enable/disable monitoring** - Master toggle for the extension
- **Tab limit per window** - Customizable limit (1-100 tabs)
- **Auto-close toggle** - Enable/disable automatic tab closure
- **Notifications** - Show/hide system notifications
- **Closure timing** - Configurable pause between tab closures (0-5000ms)

## Installation Guide

### Development Installation

1. **Download the Extension**
   ```bash
   # Clone or download the chrome-tab-monitor folder
   cd chrome-tab-monitor
   ```

2. **Generate Extension Icons**
   - Open `create-icons.html` in your browser
   - Click "Generate Icons" button
   - Right-click each icon and "Save image as..."
   - Save as: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - Place all PNG files in the `icons/` folder

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" button
   - Select the `chrome-tab-monitor` folder
   - The extension should appear in your extensions list

4. **Verify Installation**
   - Look for the Tab Monitor icon in your Chrome toolbar
   - Click the icon to open the popup interface
   - The badge should show the current total number of tabs

## How to Use

### Initial Setup
1. Click the Tab Monitor extension icon
2. Configure your preferences:
   - Set tab limit per window (default: 10)
   - Enable/disable auto-close feature
   - Turn notifications on/off
   - Adjust pause between closures

3. Click "Save Configuration" to apply settings

### Monitoring Tabs
- The extension badge shows total tab count across all windows
- Badge color indicates status:
  - **Green**: All windows within limits
  - **Red**: One or more windows exceed limits

### Managing Windows
- Open the popup to see per-window statistics
- View which windows are over the limit
- Active window is highlighted with a badge
- Progress bars show limit utilization

### Activity Log
- Recent events are logged with timestamps
- Color-coded entries show different event types:
  - **Blue**: Information (tab created/removed)
  - **Yellow**: Warnings (limit exceeded)
  - **Red**: Errors
  - **Green**: Actions taken (tabs closed)

### Manual Actions
- **Force Verification**: Check all windows and close excess tabs immediately
- **Clear Log**: Remove all activity log entries
- **Save Configuration**: Apply current settings

## Testing the Extension

### Basic Functionality
1. **Test Tab Monitoring**
   - Set tab limit to 5
   - Open 7-8 tabs in a single window
   - Verify badge shows red color and correct count
   - Check that auto-close removes excess tabs (if enabled)

2. **Test Configuration**
   - Change settings in popup
   - Click "Save Configuration"
   - Verify settings persist after closing popup
   - Test enable/disable toggle

3. **Test Multiple Windows**
   - Open multiple Chrome windows
   - Add tabs to different windows
   - Verify each window is monitored independently
   - Check window overview in popup

### Advanced Testing
1. **Test Smart Closing Logic**
   - Pin a tab, then exceed limit
   - Verify pinned tab is not closed
   - Switch to different tab (make it active)
   - Verify active tab is not closed

2. **Test Edge Cases**
   - Close browser and reopen (settings should persist)
   - Test with incognito windows
   - Test with different window types (app windows, etc.)

## Debugging Common Issues

### Extension Not Loading
- **Check manifest.json syntax** - Use JSON validator
- **Verify file permissions** - Ensure all files are readable
- **Check Chrome developer console** - Look for error messages in `chrome://extensions/`

### Badge Not Updating
- **Refresh extension** - Toggle off/on in extensions page
- **Check background script** - Look for errors in service worker logs
- **Verify permissions** - Extension needs "tabs" permission

### Auto-Close Not Working
- **Check if feature is enabled** - Verify auto-close toggle is on
- **Ensure tabs are closable** - Active and pinned tabs won't close
- **Check tab limit setting** - Must be set to reasonable value

### Settings Not Saving
- **Check storage permissions** - Extension needs "storage" permission
- **Clear extension storage** - Reset to defaults if corrupted
- **Check for Chrome storage quota** - Shouldn't be an issue for this extension

### Performance Issues
- **Reduce update frequency** - Modify background.js intervals
- **Clear activity log regularly** - Large logs can slow popup
- **Check for memory leaks** - Monitor in Chrome Task Manager

## Customization Guide

### Modifying Tab Limits
```javascript
// In background.js, change default configuration
const DEFAULT_CONFIG = {
  enabled: true,
  tabLimit: 15, // Change default limit
  autoClose: true,
  notifications: true,
  pauseBetweenClosures: 2000 // Increase pause time
};
```

### Changing Update Intervals
```javascript
// In popup.js, modify real-time update frequency
updateInterval = setInterval(async () => {
  if (!isLoading && currentConfig.enabled) {
    await updateDisplay();
  }
}, 5000); // Update every 5 seconds instead of 2
```

### Customizing Appearance
```css
/* In styles.css, modify color scheme */
:root {
  --primary-color: #ff6b6b; /* Change primary color */
  --success-color: #51cf66;
  --warning-color: #ffd43b;
  --error-color: #ff6b6b;
}
```

### Adding New Features
1. **Background Script**: Add new functionality to `background.js`
2. **Popup Interface**: Update `popup.html` and `popup.js` for UI
3. **Styling**: Add CSS to `styles.css`
4. **Permissions**: Update `manifest.json` if new APIs are needed

## File Structure
```
chrome-tab-monitor/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tab monitoring)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles.css            # Professional styling
├── create-icons.html     # Icon generation tool
├── icons/
│   ├── icon.svg          # Vector icon template
│   ├── icon16.png        # 16x16 pixel icon
│   ├── icon32.png        # 32x32 pixel icon
│   ├── icon48.png        # 48x48 pixel icon
│   └── icon128.png       # 128x128 pixel icon
└── README.md             # This documentation
```

## Browser Compatibility
- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## Troubleshooting Tips
1. Always check the Chrome Extensions page for error messages
2. Use Chrome DevTools to debug popup issues
3. Check the service worker logs for background script issues
4. Clear extension data if settings become corrupted
5. Reinstall extension if persistent issues occur

## Security Notes
- Extension only accesses tab information, no web content
- All data stored locally in Chrome's extension storage
- No external network requests or data transmission
- Follows Chrome extension security best practices

This extension provides a complete solution for managing browser tab overload with a professional, user-friendly interface.