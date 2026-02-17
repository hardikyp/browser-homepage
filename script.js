const WEATHER_CODES = {
  0: { label: "Clear", className: "condition-clear" },
  1: { label: "Mainly clear", className: "condition-clear" },
  2: { label: "Partly cloudy", className: "condition-cloudy" },
  3: { label: "Overcast", className: "condition-cloudy" },
  45: { label: "Fog", className: "condition-fog" },
  48: { label: "Rime fog", className: "condition-fog" },
  51: { label: "Light drizzle", className: "condition-rain" },
  53: { label: "Drizzle", className: "condition-rain" },
  55: { label: "Dense drizzle", className: "condition-rain" },
  56: { label: "Freezing drizzle", className: "condition-rain" },
  57: { label: "Freezing drizzle", className: "condition-rain" },
  61: { label: "Light rain", className: "condition-rain" },
  63: { label: "Rain", className: "condition-rain" },
  65: { label: "Heavy rain", className: "condition-rain" },
  66: { label: "Freezing rain", className: "condition-rain" },
  67: { label: "Heavy freezing rain", className: "condition-rain" },
  71: { label: "Light snow", className: "condition-snow" },
  73: { label: "Snow", className: "condition-snow" },
  75: { label: "Heavy snow", className: "condition-snow" },
  77: { label: "Snow grains", className: "condition-snow" },
  80: { label: "Rain showers", className: "condition-rain" },
  81: { label: "Rain showers", className: "condition-rain" },
  82: { label: "Heavy rain showers", className: "condition-rain" },
  85: { label: "Snow showers", className: "condition-snow" },
  86: { label: "Heavy snow showers", className: "condition-snow" },
  95: { label: "Thunderstorm", className: "condition-storm" },
  96: { label: "Thunderstorm", className: "condition-storm" },
  99: { label: "Severe thunderstorm", className: "condition-storm" },
};

const DEFAULT_WEATHER_LOCATION = {
  label: "New York, NY",
  lat: 40.7128,
  lon: -74.006,
};

function updateDateTime() {
  const now = new Date();

  const time = now.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");

  if (clockEl) clockEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
}

function normalizeApp(rawApp) {
  if (!rawApp || typeof rawApp !== "object") return null;

  const name = typeof rawApp.name === "string" ? rawApp.name.trim() : "";
  const url = typeof rawApp.url === "string" ? rawApp.url.trim() : "";
  const icon = typeof rawApp.icon === "string" ? rawApp.icon.trim() : "";
  const openInNewTab = rawApp.openInNewTab !== false;

  if (!name || !url || !icon) return null;

  return { name, url, icon, openInNewTab };
}

function createAppElement(app) {
  const link = document.createElement("a");
  link.className = "app-link";
  link.href = app.url;
  link.setAttribute("aria-label", app.name);

  if (app.openInNewTab) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  const item = document.createElement("article");
  item.className = "app-item";

  const iconWrap = document.createElement("div");
  iconWrap.className = "app-icon-wrap";

  const icon = document.createElement("img");
  icon.className = "app-icon";
  icon.src = app.icon;
  icon.alt = `${app.name} icon`;
  icon.loading = "lazy";

  const label = document.createElement("p");
  label.className = "app-label";
  label.textContent = app.name;

  iconWrap.appendChild(icon);
  item.appendChild(iconWrap);
  item.appendChild(label);
  link.appendChild(item);

  return link;
}

async function renderAppSection({ jsonFile, gridId, statusId, sectionLabel }) {
  const grid = document.getElementById(gridId);
  const status = document.getElementById(statusId);
  if (!grid || !status) return;

  status.hidden = true;
  status.textContent = "";

  try {
    const response = await fetch(jsonFile, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonFile} (${response.status})`);
    }

    const payload = await response.json();
    const rawApps = Array.isArray(payload.apps) ? payload.apps : [];
    const apps = rawApps.map(normalizeApp).filter(Boolean);

    if (apps.length === 0) {
      status.hidden = false;
      status.textContent = `No valid app entries found in ${jsonFile}.`;
      return;
    }

    const fragment = document.createDocumentFragment();
    apps.forEach((app) => fragment.appendChild(createAppElement(app)));
    grid.innerHTML = "";
    grid.appendChild(fragment);
  } catch (error) {
    status.hidden = false;
    status.textContent = `Could not load ${sectionLabel} apps. Use a local server (python3 -m http.server 5500).`;
    console.error(error);
  }
}

async function renderApps() {
  await Promise.all([
    renderAppSection({
      jsonFile: "internet-apps.json",
      gridId: "internet-apps-grid",
      statusId: "internet-apps-status",
      sectionLabel: "internet",
    }),
    renderAppSection({
      jsonFile: "local-apps.json",
      gridId: "local-apps-grid",
      statusId: "local-apps-status",
      sectionLabel: "local network",
    }),
  ]);
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 15 * 60 * 1000,
    });
  });
}

async function getIpApproxLocation() {
  const providers = [
    {
      url: "https://get.geojs.io/v1/ip/geo.json",
      parse: (payload) => ({
        lat: Number(payload.latitude),
        lon: Number(payload.longitude),
        locationLabel: [payload.city, payload.region].filter(Boolean).join(", "),
      }),
    },
    {
      url: "https://ipwho.is/",
      parse: (payload) => ({
        lat: Number(payload.latitude),
        lon: Number(payload.longitude),
        locationLabel: [payload.city, payload.region].filter(Boolean).join(", "),
      }),
    },
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, { cache: "no-store" });
      if (!response.ok) continue;

      const payload = await response.json();
      const parsed = provider.parse(payload);
      if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon)) {
        return {
          lat: parsed.lat,
          lon: parsed.lon,
          locationLabel: parsed.locationLabel || "Approximate location",
        };
      }
    } catch (error) {
      console.warn(`IP location provider failed: ${provider.url}`, error);
    }
  }

  throw new Error("All IP location providers failed.");
}

function setWeatherStatus(message, isError = false) {
  const statusEl = document.getElementById("weather-status");
  if (!statusEl) return;

  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function formatLocationLabel(reverseGeocodePayload) {
  const place = reverseGeocodePayload?.results?.[0];
  if (!place) return "Current location";

  const name = place.name || "Current location";
  const admin = place.admin1 || "";
  return admin ? `${name}, ${admin}` : name;
}

async function fetchWeatherForCoords(lat, lon) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,precipitation,wind_speed_10m,weather_code" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch";

  const reverseUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&count=1`;

  const [weatherResponse, reverseResponse] = await Promise.all([
    fetch(weatherUrl, { cache: "no-store" }),
    fetch(reverseUrl, { cache: "no-store" }),
  ]);

  if (!weatherResponse.ok) {
    throw new Error(`Weather request failed with status ${weatherResponse.status}`);
  }

  const weatherPayload = await weatherResponse.json();
  const reversePayload = reverseResponse.ok ? await reverseResponse.json() : null;
  return { weatherPayload, reversePayload };
}

async function loadWeatherConfig() {
  try {
    const response = await fetch("weather-config.json", { cache: "no-store" });
    if (!response.ok) return DEFAULT_WEATHER_LOCATION;
    const payload = await response.json();
    const candidate = payload?.defaultLocation;

    if (!candidate) return DEFAULT_WEATHER_LOCATION;

    const lat = Number(candidate.latitude);
    const lon = Number(candidate.longitude);
    const label = typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim() : DEFAULT_WEATHER_LOCATION.label;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return DEFAULT_WEATHER_LOCATION;
    return { label, lat, lon };
  } catch (error) {
    console.warn("Could not load weather-config.json, using built-in default location.", error);
    return DEFAULT_WEATHER_LOCATION;
  }
}

function applyConditionClass(conditionClassName) {
  const visual = document.getElementById("weather-visual");
  if (!visual) return;

  visual.classList.remove("condition-clear", "condition-cloudy", "condition-rain", "condition-snow", "condition-storm", "condition-fog");
  visual.classList.add(conditionClassName || "condition-cloudy");
}

async function loadWeather() {
  const locationEl = document.getElementById("weather-location");
  const summaryEl = document.getElementById("weather-summary");
  const tempEl = document.getElementById("weather-temp");
  const precipEl = document.getElementById("weather-precip");
  const windEl = document.getElementById("weather-wind");

  if (!locationEl || !summaryEl || !tempEl || !precipEl || !windEl) return;

  setWeatherStatus("");

  try {
    let lat;
    let lon;
    let locationLabel = "";
    let source = "gps";

    try {
      const position = await getCurrentPosition();
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } catch (geoError) {
      source = "ip";
      try {
        const ipLocation = await getIpApproxLocation();
        lat = ipLocation.lat;
        lon = ipLocation.lon;
        locationLabel = ipLocation.locationLabel;
        setWeatherStatus("Using approximate location from IP.", false);
        console.warn("Geolocation unavailable, using IP-based location.", geoError);
      } catch (ipError) {
        source = "default";
        const fallback = await loadWeatherConfig();
        lat = fallback.lat;
        lon = fallback.lon;
        locationLabel = fallback.label;
        setWeatherStatus(`Using default location: ${fallback.label}.`, false);
        console.warn("IP location failed, using default weather-config location.", ipError);
      }
    }

    const { weatherPayload, reversePayload } = await fetchWeatherForCoords(lat, lon);
    const current = weatherPayload.current;
    if (!current) {
      throw new Error("Weather data is unavailable right now.");
    }

    const weatherInfo = WEATHER_CODES[current.weather_code] || { label: "Unknown", className: "condition-cloudy" };

    const reverseLabel = formatLocationLabel(reversePayload);
    if (source === "gps") {
      locationEl.textContent = reverseLabel;
    } else {
      locationEl.textContent = locationLabel || reverseLabel;
    }
    summaryEl.textContent = weatherInfo.label;
    tempEl.textContent = `${Math.round(current.temperature_2m)}°F`;
    precipEl.textContent = `${Number(current.precipitation).toFixed(2)} in`;
    windEl.textContent = `${Math.round(current.wind_speed_10m)} mph`;
    applyConditionClass(weatherInfo.className);
  } catch (error) {
    locationEl.textContent = "Location unavailable";
    summaryEl.textContent = "Weather unavailable";
    tempEl.textContent = "--°F";
    precipEl.textContent = "-- in";
    windEl.textContent = "-- mph";
    applyConditionClass("condition-cloudy");
    setWeatherStatus("Weather fetch failed. Check internet access and reload.", true);
    console.error(error);
  }
}

updateDateTime();
setInterval(updateDateTime, 1000);
renderApps();
loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);
