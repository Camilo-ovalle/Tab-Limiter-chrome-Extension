# Chrome Tab Monitor

A Manifest V3 Chrome extension that enforces limits on open tabs per window and total browser windows, with automatic enforcement, real-time statistics, and enterprise GPO support.

## Features

- **Tab limit per window** — Automatically closes the newest tabs when a window exceeds the configured limit (default: 6). Pinned tabs are never closed.
- **Window limit** — Redirects excess windows to a warning page with a countdown before auto-closing. Focused windows are never closed.
- **GPO support** — IT administrators can enforce settings via Chrome Enterprise Group Policy. GPO-managed fields are locked in the UI.
- **Real-time popup** — Shows total tabs, window count vs. limit, and per-window tab usage with progress bars.
- **Light / dark theme** — Follows system preference; user can toggle manually.
- **Admin panel** — Configuration and activity log sections, shown only when `adminRole: true` in `DEFAULT_CONFIG`.
- **Badge** — Displays total tab count; red when any limit is exceeded, green otherwise.

## Development Setup

```bash
npm install
npm run dev        # Vite dev server with HMR
npm run build      # Production build → dist/
npm test           # Vitest
npm run lint       # ESLint
npm run typecheck  # TypeScript check only
```

**Load in Chrome:**

1. `npm run build`
2. Go to `chrome://extensions/` → enable Developer mode
3. Click "Load unpacked" → select the `dist/` folder

## Project Structure

```
src/
  background/
    index.ts                  # Service worker — orchestrates Chrome events
    utils/
      config.ts               # getConfig(), getMergedConfig(), saveConfig()
      tabManager.ts           # Tab enforcement (closes newest first)
      windowManager.ts        # Window enforcement (Force Verification only)
      windowLimitAlert.ts     # Redirects excess windows to warning page
      badge.ts                # Badge color and count
      logging.ts              # In-memory activity log (max 50 entries)
      messageHandler.ts       # Routes messages from popup to background
  popup/
    App.tsx                   # Main layout
    hooks/useExtensionState.ts
    components/               # StatsCard, WindowList, ConfigPanel, etc.
    index.css                 # Tailwind v4 + CSS design tokens (light/dark)
  shared/
    types.ts                  # Shared TypeScript interfaces
  test/
    setup.ts                  # Chrome API mocks for Vitest
    config.test.ts            # GPO precedence and config tests
public/
  schema.json                 # GPO managed storage schema
manifest.json
window-limit-warning.html     # Warning page shown in excess windows (vanilla JS)
window-limit-warning.js
```

## Configuration

Default values are in `src/background/utils/config.ts`:

```typescript
export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  tabLimit: 6, // Max tabs per window
  windowLimit: 2, // Max browser windows
  autoClose: true, // Auto-close excess tabs
  autoCloseWindows: true, // Auto-close excess windows (via warning page)
  windowGracePeriod: 5000, // Warning page countdown in ms
  notifications: true,
  pauseBetweenClosures: 1000,
  adminRole: false, // Set true locally to show admin UI sections
};
```

Time values (`windowGracePeriod`, `pauseBetweenClosures`) are stored in milliseconds but displayed in seconds in the popup UI.

## GPO Integration (Enterprise)

Chrome Tab Monitor supports Chrome Enterprise Group Policy, allowing IT administrators to enforce and lock configuration values on managed devices.

### How it works

The extension reads from `chrome.storage.managed` — a read-only storage area populated by Windows Group Policy or macOS MDM profiles. Any value set via GPO takes priority over user settings and appears locked in the popup with a **GPO** badge.

Config precedence: `DEFAULT_CONFIG` → `chrome.storage.sync` (user) → `chrome.storage.managed` (GPO, wins)

### Setup on Windows (Group Policy)

**1. Copy the schema to the policy templates folder**

The file `dist/schema.json` defines all configurable fields. Chrome reads it via the `managed_schema` entry in `manifest.json`.

**2. Create the registry keys**

GPO values for Chrome extensions are set under:

```
HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\3rdparty\Extensions\<EXTENSION_ID>\policy
```

Where `<EXTENSION_ID>` is the ID shown in `chrome://extensions/`.

**3. Available policy fields**

| Registry value         | Type        | Description                            |
| ---------------------- | ----------- | -------------------------------------- |
| `enabled`              | DWORD (0/1) | Enable or disable the extension        |
| `tabLimit`             | DWORD       | Max tabs per window (1–100)            |
| `windowLimit`          | DWORD       | Max browser windows (1–10)             |
| `autoClose`            | DWORD (0/1) | Auto-close excess tabs                 |
| `autoCloseWindows`     | DWORD (0/1) | Auto-close excess windows              |
| `notifications`        | DWORD (0/1) | Show system notifications              |
| `windowGracePeriod`    | DWORD       | Warning countdown in milliseconds      |
| `pauseBetweenClosures` | DWORD       | Pause between closures in milliseconds |

**4. Example: enforce a 5-tab limit via registry (.reg file)**

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\3rdparty\Extensions\<EXTENSION_ID>\policy]
"tabLimit"=dword:00000005
"windowLimit"=dword:00000002
"autoClose"=dword:00000001
"enabled"=dword:00000001
"autoCloseWindows"=dword:00000001
```

**5. Apply the policy**

```cmd
gpupdate /force
```

After the update, managed fields will be locked in the popup UI. Running `gpupdate /force` again with different values will override any user changes immediately.

### Deploying the extension via GPO

To push the extension automatically to domain machines without user interaction, add an entry under:

```
Computer Configuration → Policies → Administrative Templates →
Google → Google Chrome → Extensions → Configure the list of force-installed extensions
```

Format: `<EXTENSION_ID>;https://clients2.google.com/service/update2/crx`

---

## CI/CD

- **CI** — runs on every push to `main`/`development` and on PRs: typecheck → format → lint → test → build
- **Release** — triggered by a `v*` tag: runs full validation, builds, creates a GitHub Release with the ZIP, and publishes to the Chrome Web Store

```bash
git tag v2.1.0
git push origin v2.1.0
```

Requires 4 GitHub Secrets: `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`.

## License

MIT — see [LICENSE](LICENSE).

---

## Personal note

This project is personal work, developed with my own tools and in my own time. It does not use resources, infrastructure, or proprietary information from any employer, past or present. Any resemblance to internal tooling at any company is coincidental — the problem of managing tab and window overload is universal.
