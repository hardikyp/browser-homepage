# Browser Homepage Dashboard

A clean, minimal dashboard homepage for Brave.

## Current features

- Top center welcome message: `Welcome, Hardik!`
- Top left live 24-hour clock
- Day and date shown below the clock in smaller text
- iOS-style app icon grids with separate sections:
  - Internet shortcuts from `internet-apps.json`
  - Local network services from `local-apps.json`
- Glassmorphism weather card with:
  - current location
  - current temperature
  - current precipitation and wind
  - animated condition visualization (clear/cloudy/rain/snow/storm/fog)

## Run locally

1. Open the project folder:
   ```bash
   cd /Users/hardik/Repositories/browser-homepage
   ```
2. Start a local static server:
   ```bash
   python3 -m http.server 5500
   ```
3. Visit:
   [http://localhost:5500](http://localhost:5500)

Note: The app grids read JSON files using `fetch`, so running from a local server is required.

## Data entry for apps

All app shortcuts are managed in these files:

- `/Users/hardik/Repositories/browser-homepage/internet-apps.json`
- `/Users/hardik/Repositories/browser-homepage/local-apps.json`

### File structure

```json
{
  "$schema": "./apps.schema.json",
  "apps": [
    {
      "name": "Service Name",
      "url": "https://example.com",
      "icon": "icons/service.svg",
      "openInNewTab": true
    }
  ]
}
```

### Fields

- `name` (required): label shown under the icon
- `url` (required): destination link
- `icon` (required): relative path to icon asset in `icons/`
- `openInNewTab` (optional): defaults to `true`; set `false` to open in same tab

### Add a new app

1. Add icon file to `/Users/hardik/Repositories/browser-homepage/icons/` (PNG/SVG recommended).
2. Add the new app object to either internet or local JSON file.
3. Refresh the browser page.

## Use as Brave homepage / new tab

### Option 1: Open this dashboard on startup

1. In Brave, open `brave://settings/getStarted`
2. Under **On startup**, select **Open a specific page or set of pages**
3. Add URL: `http://localhost:5500`

### Option 2: Home button shortcut

1. In Brave, open `brave://settings/appearance`
2. Enable **Show home button**
3. Select **Enter custom web address**
4. Set it to: `http://localhost:5500`

## Notes

- Keep the local server running if you use `http://localhost:5500`.
- `apps.schema.json` helps editors validate app JSON while you type.
- The weather card needs internet access and location permission in Brave.
- If precise geolocation is unavailable, the weather card falls back to approximate IP-based location.
