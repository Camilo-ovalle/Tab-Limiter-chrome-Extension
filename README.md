# Chrome Tab Monitor Extension

A powerful Chrome extension that monitors and controls both the number of tabs per window AND the total number of browser windows, with intelligent automatic closing, real-time statistics, role-based access control, and a professional popup interface.

## Features

### Core Functionality
- **Dual monitoring system** - Tracks both tab creation/deletion and window creation/removal
- **Configurable tab limits** - Set custom limits per window (default: 5 tabs)
- **Configurable window limits** - Set maximum number of browser windows (default: 3 windows)
- **Automatic tab closing** - Intelligently closes newly created tabs when limits are exceeded
- **User-friendly window warnings** - Shows a professional warning page with countdown timer before closing excess windows
- **Smart closing logic** - Closes the most recently created tab first, protecting existing tabs with user data. Never closes pinned tabs or focused windows
- **Role-based access** - Admin role controls visibility of configuration and management features
- **Modular architecture** - Clean, maintainable code organized in ES6 modules
- **Native Chrome APIs** - Uses chrome.tabs, chrome.windows, chrome.storage, chrome.notifications

### User Interface
- **Modern professional design** - Clean interface with subtle gradients and smooth animations
- **Real-time statistics** - Live view of total tabs, windows count vs limits, and violations
- **Window overview** - Individual window stats with visual progress indicators
- **Activity logging** - Recent events with timestamps and color-coded status
- **Warning page** - Beautiful countdown page when window limit is exceeded
- **Responsive design** - Works on different screen sizes
- **Toggle switches** - Professional toggle controls for all configuration options

### Configuration Options
- **Enable/disable monitoring** - Master toggle for the extension
- **Tab limit per window** - Customizable limit (1-100 tabs)
- **Window limit** - Maximum number of browser windows (1-10 windows)
- **Auto-close tabs toggle** - Enable/disable automatic tab closure
- **Auto-close windows toggle** - Enable/disable automatic window closure
- **Countdown duration** - How long the warning page displays before auto-closing (configurable, default: 5 seconds)
- **Notifications** - Show/hide system notifications for both tab and window events
- **Closure timing** - Configurable pause between closures (0-5000ms)

## Installation Guide

### Development Installation

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd Tab-Limiter-chrome-Extension
   ```

2. **Generate Extension Icons** (if needed)
   - Open `create-icons.html` in your browser
   - Click "Generate Icons" button
   - Right-click each icon and "Save image as..."
   - Save as: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   - Place all PNG files in the `icons/` folder

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked" button
   - Select the project folder
   - The extension should appear in your extensions list

4. **Verify Installation**
   - Look for the Tab Monitor icon in your Chrome toolbar
   - Click the icon to open the popup interface
   - The badge should show the current total number of tabs

## How to Use

### Initial Setup
1. Click the Tab Monitor extension icon
2. Configure your preferences:
   - Set tab limit per window (default: 5)
   - Set window limit (default: 3)
   - Enable/disable auto-close tabs feature
   - Enable/disable auto-close windows feature
   - Adjust countdown duration (default: 5 seconds)
   - Turn notifications on/off
   - Adjust pause between closures

3. Click "Save Configuration" to apply settings

### Monitoring Tabs and Windows
- The extension badge shows total tab count across all windows
- Badge color indicates status:
  - **Green**: All windows and window count within limits
  - **Red**: One or more windows exceed tab limits OR window count exceeds limit

### Window Limit Enforcement
When you exceed the window limit:
1. A professional warning page opens in the excess window
2. Shows the current limit and window count
3. Displays a countdown timer (configurable duration)
4. User can click "Close Window Now" or wait for auto-close
5. Window closes when countdown reaches zero

### Managing Windows
- Open the popup to see per-window statistics and total window count
- View which windows are over the tab limit
- See if total window count exceeds the window limit
- Active window is highlighted with a badge
- Progress bars show tab limit utilization

### Activity Log
- Recent events are logged with timestamps
- Color-coded entries show different event types:
  - **Blue**: Information (tab/window created/removed)
  - **Yellow**: Warnings (tab/window limits exceeded)
  - **Red**: Errors
  - **Green**: Actions taken (tabs/windows closed)

### Manual Actions
- **Force Verification**: Check all windows and close excess tabs/windows immediately (no warning page)
- **Clear Log**: Remove all activity log entries
- **Save Configuration**: Apply current settings

## Project Structure

```
Tab-Limiter-chrome-Extension/
├── manifest.json                 # Extension configuration (Manifest V3)
├── background.js                 # Service worker - event listeners
├── popup.html                    # Extension popup interface
├── popup.js                      # Popup functionality
├── styles.css                    # Professional styling
├── window-limit-warning.html     # Warning page for window limits
├── window-limit-warning.js       # Warning page logic
├── create-icons.html             # Icon generation tool
├── utils/                        # Modular utilities (ES6 modules)
│   ├── config.js                # Configuration management
│   ├── logging.js               # Activity logging
│   ├── tabManager.js            # Tab management and enforcement
│   ├── windowManager.js         # Window management and enforcement
│   ├── badge.js                 # Badge updates
│   ├── messageHandler.js        # Popup ↔ background communication
│   └── windowLimitAlert.js      # Window warning page logic
├── icons/                        # Extension icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                     # This documentation
```

## Architecture

### Modular Design
The extension uses ES6 modules for clean separation of concerns:

- **config.js** - Centralized configuration management
- **logging.js** - Activity logging system
- **tabManager.js** - Tab counting and limit enforcement
- **windowManager.js** - Window counting and manual limit enforcement
- **badge.js** - Extension badge updates
- **messageHandler.js** - Communication between popup and background
- **windowLimitAlert.js** - Warning page display logic

### How It Works

**Tab Monitoring:**
1. User opens new tab
2. `background.js` detects via `chrome.tabs.onCreated`
3. `tabManager.js` checks if limit exceeded
4. If exceeded: closes newest tabs first (preserving pinned tabs)
5. Updates badge and logs activity

**Window Monitoring:**
1. User opens new window
2. `background.js` detects via `chrome.windows.onCreated`
3. Checks if window limit exceeded
4. If exceeded: navigates window to warning page
5. Warning page shows countdown and stats
6. Window closes when user confirms or countdown expires

## Testing the Extension

### Basic Functionality
1. **Test Tab Monitoring**
   - Set tab limit to 5
   - Open 7-8 tabs in a single window
   - Verify badge shows red color and correct count
   - Check that auto-close removes excess tabs (if enabled)

2. **Test Window Monitoring**
   - Set window limit to 2
   - Open a 3rd window
   - Verify warning page appears
   - Check countdown timer works
   - Confirm window closes automatically

3. **Test Configuration**
   - Change settings in popup
   - Click "Save Configuration"
   - Verify settings persist after closing popup
   - Test enable/disable toggle

### Advanced Testing
1. **Test Smart Closing Logic (Tabs)**
   - Pin a tab, then exceed tab limit
   - Verify pinned tab is not closed
   - Switch to different tab (make it active)
   - Verify active tab is not closed

2. **Test Window Warning System**
   - Open excess windows rapidly
   - Verify each gets its own warning page
   - Test "Close Window Now" button
   - Test Escape key to close
   - Verify countdown accuracy

3. **Test Force Verification**
   - Open more windows than limit
   - Click "Force Verification" in popup
   - Verify windows close immediately without warning page

## Customization Guide

### Modifying Default Configuration
```javascript
// In utils/config.js
export const DEFAULT_CONFIG = {
  enabled: true,
  tabLimit: 8,              // Change default tab limit
  windowLimit: 5,           // Change default window limit
  autoClose: true,
  autoCloseWindows: true,
  windowGracePeriod: 10000, // Countdown duration: 10 seconds
  notifications: true,
  pauseBetweenClosures: 2000,
  adminRole: false,         // Set to true to show admin sections
};
```

### Customizing Warning Page
Edit `window-limit-warning.html` to change:
- Colors and gradients
- Countdown duration display
- Button text
- Icon or animations

### Changing Update Intervals
```javascript
// In popup.js
updateInterval = setInterval(async () => {
  if (!isLoading && currentConfig.enabled) {
    await updateDisplay();
  }
}, 5000); // Update every 5 seconds instead of 2
```

## Debugging Common Issues

### Extension Not Loading
- **Check manifest.json syntax** - Use JSON validator
- **Verify file permissions** - Ensure all files are readable
- **Check Chrome developer console** - Look for error messages in `chrome://extensions/`

### Badge Not Updating
- **Refresh extension** - Toggle off/on in extensions page
- **Check background script** - Look for errors in service worker logs
- **Verify permissions** - Extension needs "tabs" and "windows" permissions

### Window Warning Page Not Appearing
- **Check if auto-close windows is enabled** - Toggle must be on
- **Verify window limit is set** - Must be less than current window count
- **Check browser console** - Look for errors in the warning page

### Settings Not Saving
- **Check storage permissions** - Extension needs "storage" permission
- **Clear extension storage** - Reset to defaults if corrupted

## Browser Compatibility
- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## Security Notes
- Extension only accesses tab and window information, no web content
- All data stored locally in Chrome's extension storage
- No external network requests or data transmission
- Uses Content Security Policy for enhanced security
- Follows Chrome extension security best practices

## Contributing
This extension is built with modern JavaScript (ES6 modules) and follows best practices for Chrome extensions. Contributions are welcome!

## License
See LICENSE file for details.

---

This extension provides a complete solution for managing browser tab and window overload with a professional, user-friendly interface.
