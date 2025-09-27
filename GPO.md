# Enterprise Group Policy Implementation Guide

This document outlines how to implement Group Policy Object (GPO) support for the Chrome Tab Monitor extension to enable enterprise deployment with centralized configuration management.

## Overview

Enterprise Policy support allows IT administrators to:
- Set tab and window limits centrally via Group Policy
- Disable user configuration options if needed
- Enforce compliance with corporate browsing policies
- Deploy the extension with predefined settings across the organization

## Implementation Steps

### 1. Managed Storage Schema

Create a `schema.json` file to define the structure of managed policies:

```json
{
  "type": "object",
  "properties": {
    "tabLimit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 5,
      "description": "Maximum number of tabs allowed per window"
    },
    "windowLimit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "default": 3,
      "description": "Maximum number of browser windows allowed"
    },
    "allowUserConfig": {
      "type": "boolean",
      "default": true,
      "description": "Allow users to modify configuration settings"
    },
    "enforceSettings": {
      "type": "boolean",
      "default": false,
      "description": "Enforce enterprise settings and prevent user overrides"
    },
    "autoClose": {
      "type": "boolean",
      "default": true,
      "description": "Enable automatic tab closing when limits are exceeded"
    },
    "autoCloseWindows": {
      "type": "boolean",
      "default": true,
      "description": "Enable automatic window closing when limits are exceeded"
    },
    "windowGracePeriod": {
      "type": "integer",
      "minimum": 0,
      "maximum": 60000,
      "default": 10000,
      "description": "Grace period in milliseconds before new windows are auto-closed"
    },
    "notifications": {
      "type": "boolean",
      "default": true,
      "description": "Show notifications when limits are exceeded"
    }
  }
}
```

### 2. Manifest Updates

Update `manifest.json` to support managed storage:

```json
{
  "manifest_version": 3,
  "name": "Chrome Tab Monitor",
  "version": "1.0.0",
  "description": "Monitor and control the number of tabs per window with automatic closing and real-time statistics",
  "permissions": [
    "tabs",
    "windows",
    "storage",
    "notifications",
    "activeTab"
  ],
  "host_permissions": [
    "*://*/*"
  ],
  "storage": {
    "managed_schema": "schema.json"
  },
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Tab Monitor",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 3. Background Script Modifications

Update `background.js` to handle enterprise policies:

```javascript
// Enterprise policy configuration management
async function loadEnterpriseConfig() {
  try {
    const managedStorage = await chrome.storage.managed.get();
    console.log('Enterprise policies loaded:', managedStorage);
    return managedStorage;
  } catch (error) {
    console.log('No enterprise policies set or access denied:', error);
    return {};
  }
}

// Get effective configuration combining enterprise policies and user preferences
async function getEffectiveConfig() {
  const enterpriseConfig = await loadEnterpriseConfig();
  const userConfig = await chrome.storage.sync.get(DEFAULT_CONFIG);

  // Merge configurations with enterprise policies taking precedence
  const effectiveConfig = { ...DEFAULT_CONFIG, ...userConfig };

  if (enterpriseConfig && Object.keys(enterpriseConfig).length > 0) {
    // Apply enterprise policies
    Object.keys(enterpriseConfig).forEach(key => {
      if (enterpriseConfig[key] !== undefined) {
        effectiveConfig[key] = enterpriseConfig[key];
      }
    });

    // Mark as managed and set user configuration permissions
    effectiveConfig.isManaged = true;
    effectiveConfig.allowUserConfig = enterpriseConfig.allowUserConfig !== false;
    effectiveConfig.enforceSettings = enterpriseConfig.enforceSettings === true;

    // Log enterprise policy application
    addLogEntry(
      `Enterprise policies applied - Tab limit: ${effectiveConfig.tabLimit}, Window limit: ${effectiveConfig.windowLimit}`,
      'info'
    );
  } else {
    effectiveConfig.isManaged = false;
    effectiveConfig.allowUserConfig = true;
    effectiveConfig.enforceSettings = false;
  }

  return effectiveConfig;
}

// Updated getConfig function to use enterprise policies
async function getConfig() {
  try {
    return await getEffectiveConfig();
  } catch (error) {
    console.error('Tab Monitor: Error loading effective config:', error);
    return { ...DEFAULT_CONFIG, isManaged: false, allowUserConfig: true };
  }
}

// Updated saveConfig function to respect enterprise policies
async function saveConfig(config) {
  try {
    const currentConfig = await getEffectiveConfig();

    // If settings are enforced by enterprise policy, prevent user changes
    if (currentConfig.isManaged && currentConfig.enforceSettings) {
      console.warn('Tab Monitor: Cannot save config - enforced by enterprise policy');
      addLogEntry('Configuration changes blocked by enterprise policy', 'warning');
      return false;
    }

    // If some settings are managed, preserve those values
    if (currentConfig.isManaged && !currentConfig.allowUserConfig) {
      const managedConfig = await loadEnterpriseConfig();
      Object.keys(managedConfig).forEach(key => {
        if (managedConfig[key] !== undefined) {
          config[key] = managedConfig[key];
        }
      });
    }

    await chrome.storage.sync.set(config);
    console.log('Tab Monitor: Configuration saved (respecting enterprise policies)');
    return true;
  } catch (error) {
    console.error('Tab Monitor: Error saving config:', error);
    return false;
  }
}

// Add message handler for checking enterprise policy status
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getConfig':
        const config = await getEffectiveConfig();
        sendResponse({ success: true, config });
        break;

      case 'saveConfig':
        const saved = await saveConfig(request.config);
        if (saved) {
          await updateAllWindowBadges();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Configuration save blocked by enterprise policy' });
        }
        break;

      case 'checkEnterprisePolicy':
        const enterpriseConfig = await loadEnterpriseConfig();
        sendResponse({
          success: true,
          isManaged: Object.keys(enterpriseConfig).length > 0,
          policies: enterpriseConfig
        });
        break;

      // ... existing message handlers
    }
  } catch (error) {
    console.error('Tab Monitor: Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}
```

### 4. Popup Interface Updates

Update `popup.js` to handle enterprise-managed settings:

```javascript
// Check for enterprise policies and update UI accordingly
async function loadConfiguration() {
  try {
    const response = await sendMessage({ action: 'getConfig' });
    if (response.success) {
      currentConfig = response.config;
      updateConfigUI();
      updateStatusIndicator();

      // Show enterprise management indicator if applicable
      if (currentConfig.isManaged) {
        showEnterpriseIndicator();
      }
    } else {
      throw new Error('Failed to load configuration');
    }
  } catch (error) {
    console.error('Tab Monitor Popup: Error loading configuration:', error);
    throw error;
  }
}

// Update UI elements with current configuration and enterprise restrictions
function updateConfigUI() {
  elements.enabledToggle.checked = currentConfig.enabled;
  elements.tabLimit.value = currentConfig.tabLimit;
  elements.windowLimit.value = currentConfig.windowLimit;
  elements.autoCloseToggle.checked = currentConfig.autoClose;
  elements.autoCloseWindowsToggle.checked = currentConfig.autoCloseWindows;
  elements.notificationsToggle.checked = currentConfig.notifications;
  elements.pauseBetweenClosures.value = currentConfig.pauseBetweenClosures;
  elements.windowGracePeriod.value = currentConfig.windowGracePeriod;

  // Apply enterprise policy restrictions
  const isManaged = currentConfig.isManaged;
  const allowUserConfig = currentConfig.allowUserConfig;
  const isConfigurable = !isManaged || allowUserConfig;

  // Disable controls based on enterprise policy
  elements.enabledToggle.disabled = isManaged && !allowUserConfig;
  elements.tabLimit.disabled = isManaged && !allowUserConfig;
  elements.windowLimit.disabled = isManaged && !allowUserConfig;
  elements.autoCloseToggle.disabled = isManaged && !allowUserConfig;
  elements.autoCloseWindowsToggle.disabled = isManaged && !allowUserConfig;
  elements.notificationsToggle.disabled = !currentConfig.enabled ||
    (!currentConfig.autoClose && !currentConfig.autoCloseWindows) ||
    (isManaged && !allowUserConfig);
  elements.pauseBetweenClosures.disabled = !currentConfig.enabled ||
    (!currentConfig.autoClose && !currentConfig.autoCloseWindows) ||
    (isManaged && !allowUserConfig);
  elements.windowGracePeriod.disabled = !currentConfig.enabled ||
    !currentConfig.autoCloseWindows ||
    (isManaged && !allowUserConfig);

  // Hide save button if settings are fully enforced
  if (isManaged && currentConfig.enforceSettings) {
    elements.saveConfigBtn.style.display = 'none';
  }
}

// Show enterprise management indicator
function showEnterpriseIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'enterprise-indicator';
  indicator.innerHTML = `
    <div class="enterprise-badge">
      <span class="enterprise-icon">🏢</span>
      <span class="enterprise-text">Managed by your organization</span>
    </div>
  `;

  const configSection = document.querySelector('.config-section');
  if (configSection && !document.querySelector('.enterprise-indicator')) {
    configSection.insertBefore(indicator, configSection.firstChild);
  }
}

// Updated save configuration function
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
    const response = await sendMessage({
      action: 'saveConfig',
      config: currentConfig
    });

    if (response.success) {
      showNotification('Configuration saved successfully', 'success');
      await updateDisplay();
    } else {
      showNotification(response.error || 'Failed to save configuration', 'error');
    }

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
```

### 5. CSS Styling for Enterprise Indicators

Add to `styles.css`:

```css
/* Enterprise management indicator */
.enterprise-indicator {
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  border-left: 4px solid #0066cc;
}

.enterprise-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

.enterprise-icon {
  font-size: 16px;
}

.enterprise-text {
  flex: 1;
}

/* Disabled input styling for managed settings */
input:disabled,
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f8f9fa;
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### 6. Windows Group Policy Templates

Create `chrome_tab_monitor.admx` file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<policyDefinitions xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" revision="1.0" schemaVersion="1.0" xmlns="http://schemas.microsoft.com/GroupPolicy/2006/07/PolicyDefinitions">
  <policyNamespaces>
    <target prefix="ChromeTabMonitor" namespace="ChromeTabMonitor.Policies.ChromeTabMonitor" />
  </policyNamespaces>

  <resources minRequiredRevision="1.0" />

  <categories>
    <category name="ChromeTabMonitor" displayName="$(string.ChromeTabMonitor)">
      <parentCategory ref="Google:Cat_Google" />
    </category>
  </categories>

  <policies>
    <policy name="TabMonitorConfiguration" class="User" displayName="$(string.TabMonitorConfiguration)" explainText="$(string.TabMonitorConfiguration_Explain)" presentation="$(presentation.TabMonitorConfiguration)">
      <parentCategory ref="ChromeTabMonitor" />
      <supportedOn ref="SUPPORTED_WIN7" />
      <elements>
        <decimal id="TabLimit" valueName="tabLimit" minValue="1" maxValue="100" />
        <decimal id="WindowLimit" valueName="windowLimit" minValue="1" maxValue="10" />
        <boolean id="AllowUserConfig" valueName="allowUserConfig" />
        <boolean id="EnforceSettings" valueName="enforceSettings" />
        <boolean id="AutoClose" valueName="autoClose" />
        <boolean id="AutoCloseWindows" valueName="autoCloseWindows" />
        <decimal id="WindowGracePeriod" valueName="windowGracePeriod" minValue="0" maxValue="60000" />
        <boolean id="Notifications" valueName="notifications" />
      </elements>
    </policy>
  </policies>
</policyDefinitions>
```

Create `chrome_tab_monitor.adml` file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<policyDefinitionResources xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" revision="1.0" schemaVersion="1.0" xmlns="http://schemas.microsoft.com/GroupPolicy/2006/07/PolicyDefinitions">
  <displayName />
  <description />
  <resources>
    <stringTable>
      <string id="ChromeTabMonitor">Chrome Tab Monitor</string>
      <string id="TabMonitorConfiguration">Tab Monitor Configuration</string>
      <string id="TabMonitorConfiguration_Explain">Configure limits and behavior for the Chrome Tab Monitor extension.

Tab Limit: Maximum number of tabs allowed per window (1-100)
Window Limit: Maximum number of browser windows allowed (1-10)
Allow User Config: Whether users can modify extension settings
Enforce Settings: Prevent users from changing any configuration
Auto Close: Enable automatic tab closing when limits exceeded
Auto Close Windows: Enable automatic window closing when limits exceeded
Window Grace Period: Delay in milliseconds before new windows are auto-closed (0-60000)
Notifications: Show notifications when limits are exceeded</string>
    </stringTable>
    <presentationTable>
      <presentation id="TabMonitorConfiguration">
        <decimalTextBox refId="TabLimit" defaultValue="5">Tab Limit:</decimalTextBox>
        <decimalTextBox refId="WindowLimit" defaultValue="3">Window Limit:</decimalTextBox>
        <checkBox refId="AllowUserConfig" defaultChecked="true">Allow User Configuration</checkBox>
        <checkBox refId="EnforceSettings" defaultChecked="false">Enforce Settings</checkBox>
        <checkBox refId="AutoClose" defaultChecked="true">Auto Close Tabs</checkBox>
        <checkBox refId="AutoCloseWindows" defaultChecked="true">Auto Close Windows</checkBox>
        <decimalTextBox refId="WindowGracePeriod" defaultValue="10000">Window Grace Period (ms):</decimalTextBox>
        <checkBox refId="Notifications" defaultChecked="true">Show Notifications</checkBox>
      </presentation>
    </presentationTable>
  </resources>
</policyDefinitionResources>
```

### 7. Registry Deployment

For direct registry deployment, create `tab_monitor_policy.reg`:

```reg
Windows Registry Editor Version 5.00

; Force install the extension
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist]
"1"="[EXTENSION_ID];https://clients2.google.com/service/update2/crx"

; Configure extension policies
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\[EXTENSION_ID]\policy]
"tabLimit"=dword:0000000a
"windowLimit"=dword:00000003
"allowUserConfig"=dword:00000000
"enforceSettings"=dword:00000001
"autoClose"=dword:00000001
"autoCloseWindows"=dword:00000001
"windowGracePeriod"=dword:00002710
"notifications"=dword:00000001
```

### 8. PowerShell Deployment Script

Create `deploy_tab_monitor.ps1`:

```powershell
# Chrome Tab Monitor Enterprise Deployment Script

param(
    [string]$ExtensionId = "YOUR_EXTENSION_ID_HERE",
    [int]$TabLimit = 10,
    [int]$WindowLimit = 3,
    [bool]$AllowUserConfig = $false,
    [bool]$EnforceSettings = $true,
    [bool]$AutoClose = $true,
    [bool]$AutoCloseWindows = $true,
    [int]$WindowGracePeriod = 10000,
    [bool]$Notifications = $true
)

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

try {
    # Create Chrome policy registry keys
    $chromePolicyPath = "HKLM:\SOFTWARE\Policies\Google\Chrome"
    $extensionPolicyPath = "$chromePolicyPath\3rdparty\extensions\$ExtensionId\policy"
    $forcelistPath = "$chromePolicyPath\ExtensionInstallForcelist"

    # Ensure policy paths exist
    if (!(Test-Path $chromePolicyPath)) {
        New-Item -Path $chromePolicyPath -Force | Out-Null
    }

    if (!(Test-Path $extensionPolicyPath)) {
        New-Item -Path $extensionPolicyPath -Force | Out-Null
    }

    if (!(Test-Path $forcelistPath)) {
        New-Item -Path $forcelistPath -Force | Out-Null
    }

    # Force install extension
    Set-ItemProperty -Path $forcelistPath -Name "1" -Value "$ExtensionId;https://clients2.google.com/service/update2/crx" -Type String

    # Set extension policies
    Set-ItemProperty -Path $extensionPolicyPath -Name "tabLimit" -Value $TabLimit -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "windowLimit" -Value $WindowLimit -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "allowUserConfig" -Value ([int]$AllowUserConfig) -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "enforceSettings" -Value ([int]$EnforceSettings) -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "autoClose" -Value ([int]$AutoClose) -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "autoCloseWindows" -Value ([int]$AutoCloseWindows) -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "windowGracePeriod" -Value $WindowGracePeriod -Type DWord
    Set-ItemProperty -Path $extensionPolicyPath -Name "notifications" -Value ([int]$Notifications) -Type DWord

    Write-Host "Chrome Tab Monitor extension policies have been successfully deployed!" -ForegroundColor Green
    Write-Host "Configuration applied:" -ForegroundColor Yellow
    Write-Host "  Tab Limit: $TabLimit" -ForegroundColor White
    Write-Host "  Window Limit: $WindowLimit" -ForegroundColor White
    Write-Host "  Allow User Config: $AllowUserConfig" -ForegroundColor White
    Write-Host "  Enforce Settings: $EnforceSettings" -ForegroundColor White
    Write-Host "  Auto Close Tabs: $AutoClose" -ForegroundColor White
    Write-Host "  Auto Close Windows: $AutoCloseWindows" -ForegroundColor White
    Write-Host "  Window Grace Period: $WindowGracePeriod ms" -ForegroundColor White
    Write-Host "  Notifications: $Notifications" -ForegroundColor White
    Write-Host ""
    Write-Host "Please restart Chrome for changes to take effect." -ForegroundColor Cyan

} catch {
    Write-Host "Error deploying extension policies: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

## Testing Enterprise Deployment

### 1. Local Testing
```bash
# 1. Install extension in developer mode
# 2. Create test registry entries
# 3. Restart Chrome
# 4. Verify policies are applied in chrome://policy
# 5. Test that user controls are disabled appropriately
```

### 2. Group Policy Testing
```bash
# 1. Deploy ADMX/ADML templates to PolicyDefinitions folder
# 2. Configure policies via Group Policy Management Console
# 3. Run gpupdate /force on test machine
# 4. Verify policy application in chrome://policy
# 5. Test extension behavior with enterprise restrictions
```

### 3. Verification Steps
- Check `chrome://policy` for applied policies
- Verify extension configuration UI shows enterprise indicators
- Test that restricted settings cannot be modified
- Confirm notifications about enterprise management
- Validate that limits are enforced according to policy

## Security Considerations

1. **Policy Validation**: Always validate enterprise policy values before applying
2. **Fallback Handling**: Maintain sensible defaults if policies are malformed
3. **Audit Logging**: Log all enterprise policy applications for compliance
4. **User Feedback**: Clearly indicate when settings are managed by organization
5. **Update Safety**: Ensure extension updates don't break enterprise configurations

## Deployment Best Practices

1. **Phased Rollout**: Test with small user groups before organization-wide deployment
2. **Documentation**: Provide clear documentation for IT administrators
3. **Support Process**: Establish support procedures for enterprise users
4. **Monitoring**: Monitor extension performance and policy compliance
5. **Updates**: Plan for policy updates and extension version management

## Troubleshooting

### Common Issues
- **Policies not applying**: Check Chrome version compatibility and registry permissions
- **Extension not installing**: Verify force install configuration and network access
- **Settings not enforced**: Confirm policy precedence and extension permissions
- **Performance issues**: Monitor resource usage with enterprise settings

### Debugging Tools
- `chrome://policy` - View applied policies
- Chrome DevTools - Debug extension behavior
- Event Viewer - Check for policy application errors
- Registry Editor - Verify policy registry entries

This implementation provides comprehensive enterprise support while maintaining the extension's core functionality and user experience.