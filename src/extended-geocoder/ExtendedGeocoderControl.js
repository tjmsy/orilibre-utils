function injectStyle() {
  if (document.getElementById("extended-geocoder-style")) return;

  const style = document.createElement("style");
  style.id = "extended-geocoder-style";

  style.textContent = `
/* =========================
   Geocoder (mobile tuned)
========================= */
@media (max-width: 600px) {

  .maplibregl-ctrl-geocoder {
    position: relative;
    width: min(60vw, 180px) !important;
    margin-bottom: 0 !important;
    min-height: unset !important;
  }

  .maplibregl-ctrl-geocoder input {
    height: 28px !important;
    padding-left: 28px !important;
    font-size: 13px;
    line-height: 1.2;
  }

  .maplibregl-ctrl-geocoder--icon {
    left: 6px;
    top: 6px;
    width: 16px;
    height: 16px;
  }

  .maplibregl-ctrl-geocoder .suggestions {
    font-size: 11px !important;
    line-height: 1.2;
  }

  .maplibregl-ctrl-geocoder--suggestion {
    font-size: 12px !important;
    padding: 6px 8px !important;
  }
}

/* =========================
   PANEL (NEW)
========================= */

.orilibre-search-panel {
  position: relative;
}

/* hidden state */
.orilibre-search-body {
  display: none;
  margin-top: 6px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(255,255,255,0.95);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  backdrop-filter: blur(6px);
}

/* open state */
.orilibre-search-panel.open .orilibre-search-body {
  display: block;
}

/* toggle button (icon) */
.orilibre-search-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
}

.orilibre-search-icon:active {
  transform: scale(0.95);
}

/* =========================
   Toggle UI
========================= */

.orilibre-search-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

.orilibre-search-toggle-label {
  opacity: 0.85;
}

/* switch */
.orilibre-toggle-switch {
  width: 32px;
  height: 16px;
  background: #ccc;
  border-radius: 999px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.orilibre-toggle-knob {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.orilibre-toggle-switch.active {
  background: #1978c8;
}

.orilibre-toggle-switch.active .orilibre-toggle-knob {
  transform: translateX(16px);
}

@media (max-width: 600px) {
  .orilibre-search-toggle {
    font-size: 11px;
    margin-top: 2px;
  }
}
`;

  document.head.appendChild(style);
}

export default class ExtendedGeocoderControl {
  constructor({ geocoder, getSearchMode, setSearchMode }) {
    injectStyle();

    this.geocoder = geocoder;
    this.getSearchMode = getSearchMode;
    this.setSearchMode = setSearchMode;

    // state
    this.isOpen = false;

    // dom refs
    this.container = null;
    this.geoEl = null;
    this.toggle = null;
    this.knob = null;
  }

  // -------------------------
  // lifecycle
  // -------------------------

  onAdd(map) {
    this.map = map;

    this.container = document.createElement("div");

    this.geoEl = this.geocoder.onAdd(map);

    this.geoEl.style.display = "block";

    // =========================
    // toggle UI
    // =========================
    const wrapper = document.createElement("div");
    wrapper.className = "orilibre-search-toggle";

    const label = document.createElement("span");
    label.className = "orilibre-search-toggle-label";
    label.textContent = "Search this area";

    this.toggle = document.createElement("div");
    this.toggle.className = "orilibre-toggle-switch";

    this.knob = document.createElement("div");
    this.knob.className = "orilibre-toggle-knob";

    this.toggle.appendChild(this.knob);
    wrapper.appendChild(label);
    wrapper.appendChild(this.toggle);

    // =========================
    // toggle handler
    // =========================
    const updateUI = () => {
      const isLocal = this.getSearchMode() === "local";
      this.toggle.classList.toggle("active", isLocal);
    };

    updateUI();

    const getInput = () =>
      this.geoEl?.querySelector(".maplibregl-ctrl-geocoder input");

    const onToggle = () => {
      const next = this.getSearchMode() === "local" ? "global" : "local";

      this.setSearchMode(next);
      updateUI();

      requestAnimationFrame(() => {
        getInput()?.focus();
      });
    };

    wrapper.onclick = onToggle;
    wrapper.onmousedown = (e) => e.preventDefault();

    (
      this.geoEl.querySelector(".maplibregl-ctrl-geocoder") || this.geoEl
    ).appendChild(wrapper);

    this.container.appendChild(this.geoEl);

    this._onMoveEnd = () => {
      this.geocoder.setProximity({
        longitude: map.getCenter().lng,
        latitude: map.getCenter().lat,
      });
    };

    map.on("moveend", this._onMoveEnd);

    return this.container;
  }

  onRemove() {
    this.map?.off("moveend", this._onMoveEnd);
    this.container?.remove();
    this.geocoder.onRemove?.();
  }
}
