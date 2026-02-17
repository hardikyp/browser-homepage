# Browser Homepage Dashboard

A clean, minimal dashboard homepage for Brave.

## Current features

- Top center welcome message: `Welcome, Hardik!`
- Top left live 24-hour clock
- Day and date shown below the clock in smaller text

## Run locally

1. Open the project folder:
   ```bash
   cd /Users/hardik/Repositories/browser-homepage
   ```
2. Open `index.html` directly in Brave, or run a local static server:
   ```bash
   python3 -m http.server 5500
   ```
3. Visit:
   [http://localhost:5500](http://localhost:5500)

## Use as Brave homepage / new tab

Brave has built-in New Tab options, but for a custom local page this is the simplest setup.

### Option 1: Open this dashboard on startup

1. In Brave, open `brave://settings/getStarted`
2. Under **On startup**, select **Open a specific page or set of pages**
3. Add either:
   - Local file: `file:///Users/hardik/Repositories/browser-homepage/index.html`
   - Local server URL: `http://localhost:5500`

### Option 2: Home button shortcut

1. In Brave, open `brave://settings/appearance`
2. Enable **Show home button**
3. Select **Enter custom web address**
4. Set it to:
   - `file:///Users/hardik/Repositories/browser-homepage/index.html`
   - or `http://localhost:5500`

## Notes

- If you use `http://localhost:5500`, keep the local server running.
- Using the `file://` URL does not require a server.
