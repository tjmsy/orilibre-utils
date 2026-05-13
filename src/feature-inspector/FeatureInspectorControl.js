class FeatureInspectorControl {
  constructor() {
    this.isActive = false;

    this._onButtonClick = this._onButtonClick.bind(this);
    this._onMapClick = this._onMapClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    // DOM refs
    this.container = null;
    this.button = null;
  }

  // -------------------------
  // MapLibre Lifecycle
  // -------------------------

  onAdd(map) {
    this.map = map;

    this._createUI();
    this._bindUIEvents();

    return this.container;
  }

  onRemove() {
    this._disable();
    this._unbindUIEvents();

    this.container?.remove();
    this.map = undefined;
  }

  // -------------------------
  // State control
  // -------------------------

  _enable() {
    if (this.isActive) return;

    this.isActive = true;

    this._prevBorder = this.button.style.border;
    this._prevBg = this.button.style.background;

    this.button.style.border = "2px solid #888";
    this.button.style.background = "#ddd";

    this._prevCursor = this.map.getCanvas().style.cursor;
    this.map.getCanvas().style.cursor = "crosshair";

    this.map.on("click", this._onMapClick);
    document.addEventListener("keydown", this._onKeyDown);
  }

  _disable() {
    if (!this.isActive) return;

    this.isActive = false;

    this.button.style.border = this._prevBorder || "";
    this.button.style.background = this._prevBg || "";

    this.map.getCanvas().style.cursor = this._prevCursor || "";

    this.map.off("click", this._onMapClick);
    document.removeEventListener("keydown", this._onKeyDown);
  }

  // -------------------------
  // Events (UI)
  // -------------------------

  _bindUIEvents() {
    this.button.addEventListener("click", this._onButtonClick);
  }

  _unbindUIEvents() {
    this.button?.removeEventListener("click", this._onButtonClick);
  }

  // -------------------------
  // Event Handlers
  // -------------------------

  _onButtonClick() {
    this.isActive ? this._disable() : this._enable();
  }

  _onMapClick(e) {
    if (!this.isActive) return;

    const features = this.map.queryRenderedFeatures(e.point);

    const featureData = features.map((f) => ({
      source: f.source,
      sourceLayer: f.sourceLayer,
      properties: f.properties,
    }));

    const content = `
      <div style="max-height:250px; overflow:auto; font-size:12px;">
        <div><b>lng, lat:</b> ${e.lngLat.lng.toFixed(6)}, ${e.lngLat.lat.toFixed(6)}</div>
        <div><b>feature count: ${featureData.length}</b></div>
        <pre style="margin:0;">${JSON.stringify(featureData, null, 2)}</pre>
      </div>
    `;

    this._popup?.remove();
    this._popup = new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(content)
      .addTo(this.map);
  }

  _onKeyDown(e) {
    if (e.key === "Escape") {
      this._disable();
    }
  }

  // -------------------------
  // UI lifecycle
  // -------------------------

  _createUI() {
    this._createContainer();
    this._createButton();

    this._assemble();
  }

  _assemble() {
    this.container.appendChild(this.button);
  }

  // -------------------------
  // UI Parts
  // -------------------------

  _createContainer() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
  }

  _createButton() {
    this.button = document.createElement("button");
    this.button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="18" height="18" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    `;
  }
}

export default FeatureInspectorControl;
