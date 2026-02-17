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
  const featureDayEl = document.getElementById("feature-day");
  const featureDateEl = document.getElementById("feature-date");
  const featureTimeEl = document.getElementById("feature-time");

  if (clockEl) clockEl.textContent = time;
  if (dateEl) dateEl.textContent = date;
  if (featureDayEl) featureDayEl.textContent = now.toLocaleDateString("en-US", { weekday: "short" });
  if (featureDateEl) featureDateEl.textContent = now.toLocaleDateString("en-US", { day: "numeric" });
  if (featureTimeEl) featureTimeEl.textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
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

updateDateTime();
setInterval(updateDateTime, 1000);
renderApps();
