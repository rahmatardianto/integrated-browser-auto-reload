# Integrated Browser Auto Reload

VS Code extension to automatically reload the integrated browser / webview whenever matching files are saved, with real-time setting updates.

## Features

- **Instant Auto Reload**: Triggers browser refresh on document save.
- **Dynamic Config**: Updates monitored extensions and exclude patterns in real-time without restarting VS Code.
- **Flexible Matching**: Supports simple (`php`, `js`), compound (`blade.php`, `test.ts`), and wildcard (`*.css`) formats.
- **Zero Runtime Dependencies**: Built directly on VS Code Extension API.

## Configuration

Available in VS Code Settings (`Preferences: Open Settings (UI)`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `integratedBrowserAutoReload.fileExtensions` | `array` | `["html", "css", "js", "ts", "php"]` | File extensions that trigger browser reload on save. |
| `integratedBrowserAutoReload.excludePatterns` | `array` | `["**/vendor/**", "**/node_modules/**", "**/.git/**", "**/storage/**"]` | Folders or glob patterns excluded from auto-reload. |

## Commands

- `integratedBrowserAutoReload.reload`: Trigger manual browser reload.

## Development

```bash
npm install
npm run compile
npm test
```
