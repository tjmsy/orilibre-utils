import MapLibreGlDirections, {
  layersFactory,
} from "https://cdn.jsdelivr.net/npm/@maplibre/maplibre-gl-directions@0.9.1/dist/maplibre-gl-directions.min.js";

class DirectionsWrapperControl {
  constructor(options = {}) {
    this.options = {
      profile: "walking",

      pointsScalingFactor: 0.3,
      linesScalingFactor: 0.6,

      ...options,
    };

    this.isPanelElementOpen = false;

    this.currentProfile = this.options.profile;

    this._routesCache = [];
    this._selectedRouteIndex = 0;

    // bind
    this._onPanelToggleClick = this._onPanelToggleClick.bind(this);
    this._onClearButtonClick = this._onClearButtonClick.bind(this);
    this._onProfileChange = this._onProfileChange.bind(this);
    this._onMapClick = this._onMapClick.bind(this);
  }

  // -------------------------
  // Lifecycle
  // -------------------------

  onAdd(map) {
    this.map = map;

    this.directions = new MapLibreGlDirections(map, this.options);
    this.directions.interactive = false;

    this._buildUI();
    this._bindEvents();
    this._bindDirectionsEvents();

    this._lineStyleChange();

    this.map.on("click", this._onMapClick);

    return this.controlContainer;
  }

  onRemove() {
    this._close();
    this._unbindEvents();

    this.directions.off("fetchroutesend", this._onFetchRoutesEnd);

    this.map.off("click", this._onMapClick);

    this.directions.destroy();
    this.controlContainer.remove();
    this.map = undefined;
  }

  // -------------------------
  // State control
  // -------------------------

  _onPanelToggleClick() {
    this.isPanelElementOpen ? this._close() : this._open();
  }

  _open() {
    if (this.isPanelElementOpen) return;

    this.isPanelElementOpen = true;
    this.panelElement.style.display = "block";

    this.directions.interactive = true;
  }

  _close() {
    if (!this.isPanelElementOpen) return;

    this.isPanelElementOpen = false;
    this.panelElement.style.display = "none";

    this.panelToggleButton.style.display = "block";

    this.directions.interactive = false;
  }

  // -------------------------
  // Events(UI)
  // -------------------------

  _bindEvents() {
    this.panelToggleButton.addEventListener("click", this._onPanelToggleClick);
    this.clearButton.addEventListener("click", this._onClearButtonClick);
    this.profileRadio.addEventListener("change", this._onProfileChange);
  }

  _unbindEvents() {
    this.panelToggleButton.removeEventListener(
      "click",
      this._onPanelToggleClick,
    );
    this.clearButton.removeEventListener("click", this._onClearButtonClick);
    this.profileRadio.removeEventListener("change", this._onProfileChange);
  }

  // -------------------------
  // Events(MapLibreGlDirections)
  // -------------------------

  _bindDirectionsEvents() {
    this._onFetchRoutesEnd = (event) => {
      const routes = event.data?.directions?.routes;
      if (!routes?.length) return;

      this._routesCache = routes;
      this._selectedRouteIndex = 0;

      const distance = routes[0].distance ?? 0;
      const duration = routes[0].duration ?? 0;
      const ascent = routes[0].ascent ?? 0;
      const descent = routes[0].descent ?? 0;

      this._updateSummary(distance, duration, ascent, descent);
    };

    this.directions.on("fetchroutesend", this._onFetchRoutesEnd);
  }

  // -------------------------
  // Handlers
  // -------------------------

  _onMapClick(e) {
    if (!this._routesCache?.length) return;

    const features = this.map.queryRenderedFeatures(e.point, {
      layers: [
        "maplibre-gl-directions-alt-routeline",
        "maplibre-gl-directions-alt-routeline-casing",
      ],
    });

    if (!features.length) return;

    const routeIndex = Number(features[0].properties?.routeIndex ?? 0);
    const route = this._routesCache[routeIndex];

    this._selectedRouteIndex = routeIndex;

    if (!route) return;

    this._updateSummary(route.distance, route.duration, route.ascent, route.descent);
  }

  _onClearButtonClick() {
    this.directions.clear();
    this._routesCache = [];
    this._selectedRouteIndex = 0;
    this._resetSummary();
  }

  _onProfileChange(e) {
    if (!e.target.checked) return;

    this.currentProfile = e.target.value;
    this._applyProfile();
  }

  // -------------------------
  // Logic
  // -------------------------

  _applyProfile() {
    const waypoints = this.directions.waypoints;

    if (!waypoints || waypoints.length < 2) return;

    const profiles = Array(waypoints.length - 1).fill(this.currentProfile);

    this.directions.setWaypoints(waypoints, profiles);
  }

  _resetSummary() {
    this.routeSummaryField.innerText = "Click on map";
  }

  _updateSummary(distance, duration, ascent, descent) {
    const km = (distance / 1000).toFixed(2);
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    const s = Math.floor(duration % 60);

    const timeStr = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

    this.routeSummaryField.innerText = `Distance: ${km} km\nDuration: ${timeStr}\nAscent: ${ascent} m\nDescent: ${descent} m`;
  }

  _lineStyleChange() {
    this.map.setPaintProperty(
      "maplibre-gl-directions-routeline",
      "line-opacity",
      0.6,
    );
    this.map.setPaintProperty(
      "maplibre-gl-directions-routeline",
      "line-color",
      "#007FFF",
    );
    this.map.setPaintProperty(
      "maplibre-gl-directions-routeline-casing",
      "line-opacity",
      0.4,
    );
    this.map.setPaintProperty(
      "maplibre-gl-directions-routeline-casing",
      "line-color",
      "#007FFF",
    );
    this.map.setPaintProperty(
      "maplibre-gl-directions-alt-routeline",
      "line-color",
      "#e0ffff",
    );
    this.map.setPaintProperty(
      "maplibre-gl-directions-alt-routeline-casing",
      "line-color",
      "#444",
    );
  }

  // -------------------------
  // UI
  // -------------------------

  _buildUI() {
    this._createControlContainer();
    this._createPanelToggleButton();
    this._createPanelElement();
    this._createClearButton();
    this._createProfileRadio();
    this._createRouteSummaryField();

    this._assemble();
  }

  _assemble() {
    this.controlContainer.appendChild(this.panelToggleButton);
    this.controlContainer.appendChild(this.panelElement);

    this.panelElement.appendChild(this.clearButton);
    this.panelElement.appendChild(this.profileRadio);
    this.panelElement.appendChild(this.routeSummaryField);
  }

  // -------------------------
  // UI Parts
  // -------------------------

  _createControlContainer() {
    this.controlContainer = document.createElement("div");
    this.controlContainer.className = "maplibregl-ctrl maplibregl-ctrl-group";
  }

  _createPanelToggleButton() {
    this.panelToggleButton = document.createElement("button");
    this.panelToggleButton.type = "button";
    this.panelToggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-route-icon lucide-route"><circle cx="6" cy="19" r="3"/>
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
      </svg>
    `;
  }

  _createPanelElement() {
    this.panelElement = document.createElement("div");

    Object.assign(this.panelElement.style, {
      display: "none",
      background: "white",
      padding: "0",
      margin: "0",
    });
  }

  _createClearButton() {
    this.clearButton = document.createElement("button");
    this.clearButton.textContent = "Clear";
    Object.assign(this.clearButton.style, {
      border: "1px solid #888",
      borderRadius: "1px",
      height: "auto",
      width: "auto",
    });
  }

  _createProfileRadio() {
    this.profileRadio = this._createRadioGroup(
      [
        { key: "foot-hiking", label: "foot" },
        { key: "cycling-mountain", label: "bike" },
        { key: "driving-car", label: "car" },
      ],
      "profileRadio",
      this.currentProfile,
    );
  }

  _createRadioGroup(options, name, defaultValue) {
    const group = document.createElement("div");

    options.forEach((opt) => {
      const label = document.createElement("label");
      const input = document.createElement("input");

      input.type = "radio";
      input.name = name;
      input.value = opt.key;
      input.checked = opt.key === defaultValue;

      label.appendChild(input);
      label.append(opt.label);

      group.appendChild(label);
    });
    return group;
  }

  _createRouteSummaryField() {
    this.routeSummaryField = document.createElement("div");
    this.routeSummaryField.style.whiteSpace = "pre-line";
    this._resetSummary();
  }
}

export default DirectionsWrapperControl;
