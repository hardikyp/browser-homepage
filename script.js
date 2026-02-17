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

async function renderApps() {
  const grid = document.getElementById("apps-grid");
  const status = document.getElementById("apps-status");
  if (!grid || !status) return;
  status.hidden = true;
  status.textContent = "";

  try {
    const response = await fetch("apps.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load apps.json (${response.status})`);
    }

    const payload = await response.json();
    const rawApps = Array.isArray(payload.apps) ? payload.apps : [];
    const apps = rawApps.map(normalizeApp).filter(Boolean);

    if (apps.length === 0) {
      status.hidden = false;
      status.textContent = "No valid app entries found in apps.json.";
      return;
    }

    const fragment = document.createDocumentFragment();
    apps.forEach((app) => fragment.appendChild(createAppElement(app)));
    grid.innerHTML = "";
    grid.appendChild(fragment);
  } catch (error) {
    status.hidden = false;
    status.textContent =
      "Could not load apps.json. If you opened via file://, run a local server (python3 -m http.server 5500).";
    console.error(error);
  }
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
    const position = await getCurrentPosition();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      "&current=temperature_2m,precipitation,wind_speed_10m,weather_code" +
      "&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch";

    const reverseUrl =
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&count=1`;

    const [weatherResponse, reverseResponse] = await Promise.all([
      fetch(weatherUrl, { cache: "no-store" }),
      fetch(reverseUrl, { cache: "no-store" }),
    ]);

    if (!weatherResponse.ok) {
      throw new Error(`Weather request failed with status ${weatherResponse.status}`);
    }

    const weatherPayload = await weatherResponse.json();
    const reversePayload = reverseResponse.ok ? await reverseResponse.json() : null;

    const current = weatherPayload.current;
    if (!current) {
      throw new Error("Weather data is unavailable right now.");
    }

    const weatherInfo = WEATHER_CODES[current.weather_code] || { label: "Unknown", className: "condition-cloudy" };

    locationEl.textContent = formatLocationLabel(reversePayload);
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
    setWeatherStatus("Enable location access and reload to show current weather.", true);
    console.error(error);
  }
}

updateDateTime();
setInterval(updateDateTime, 1000);
renderApps();
loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);
