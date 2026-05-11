import { isomizer } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-isomizer@0.5/src/isomizer.js";

class DesignSetSwitcherControl {
  constructor(options = {}) {
    this.options = {
      defaultDesignSet: "ofm",
      defaultBackgroundColor: "green",
      defaultForestColor: "white",
      defaultParkColor: "white",
      ...options,
    };

    this.designSets = {
      ofm: {
        label: "OpenMapTiles",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/global/project-config.yml",
        forestLayer: "405-forest-ofm-landcover",
        outOfBoundsLayer: "520-out-of-bounds-ofm-landuse",
        parkLayer: "park-ofm-landcover",
      },
      shortbread: {
        label: "Shortbread",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/shortbread/project-config.yml",
        forestLayer: "405-forest-shortbread-land",
        outOfBoundsLayer: [
          "520-out-of-bounds-shortbread-sites",
          "520-out-of-bounds-shortbread-land-1",
        ],
        parkLayer: "park-shortbread-land",
      },
      "hybrid-japan": {
        label: "GSI Hybrid Japan",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/isomized-japan/project-config.yml",
        forestLayer: "405-forest-ofm-landcover",
        outOfBoundsLayer: "520-out-of-bounds-ofm-landuse",
        parkLayer: "park-ofm-landcover",
      },
    };

    this.textOverlays = {
      ja: {
        url: "https://gist.githubusercontent.com/tjmsy/885c9827d644fbbe09055ba96db208b6/raw/c302ce96dc6070800566fb8cb157f16b1a95a881/project-config.yml",
      },
    };

    this.designSetHandles = {};
    this.overlayHandle = null;

    // state
    this.isOpen = false;
    this.currentDesignSet = this.options.defaultDesignSet;
    this.currentBackgroundColor = this.options.defaultBackgroundColor;
    this.currentForestColor = this.options.defaultForestColor;
    this.currentParkColor = this.options.defaultParkColor;
    this._designSetRequestId = 0;
    this.currentTextOverlay = "none";

    // DOM refs
    this.container = null;
    this.toggleButton = null;
    this.panel = null;
    this.radioGroupDesignSet = null;
    this.radioGroupBackground = null;

    // bind
    this._onToggle = this._onToggle.bind(this);
    this._onDocumentClick = this._onDocumentClick.bind(this);
    this._onDesignSetChange = this._onDesignSetChange.bind(this);
    this._onBackgroundChange = this._onBackgroundChange.bind(this);
    this._onForestChange = this._onForestChange.bind(this);
    this._onParkChange = this._onParkChange.bind(this);
    this._onTextOverlayChange = this._onTextOverlayChange.bind(this);
  }

  // -------------------------
  // Lifecycle
  // -------------------------

  onAdd(map) {
    this.map = map;

    this._createUI();
    this._bindUIEvents();

    return this.container;
  }

  onRemove() {
    this._close();
    this._unbindUIEvents();

    this.container?.remove();
    this.map = undefined;
  }

  // -------------------------
  // Panel control
  // -------------------------

  _onToggle() {
    this.isOpen ? this._close() : this._open();
  }

  _open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.panel.style.display = "block";
    document.addEventListener("click", this._onDocumentClick);
  }

  _close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.style.display = "none";
    document.removeEventListener("click", this._onDocumentClick);
  }

  _onDocumentClick(e) {
    if (!this.isOpen) return;
    if (this.container.contains(e.target) || this.panel.contains(e.target))
      return;
    this._close();
  }

  // -------------------------
  // Events
  // -------------------------

  _bindUIEvents() {
    this.toggleButton.addEventListener("click", this._onToggle);
    this.radioGroupDesignSet.addEventListener(
      "change",
      this._onDesignSetChange,
    );
    this.radioGroupBackground.addEventListener(
      "change",
      this._onBackgroundChange,
    );
    this.radioGroupForest.addEventListener("change", this._onForestChange);
    this.radioGroupPark.addEventListener("change", this._onParkChange);
    this.radioGroupTextOverlay.addEventListener(
      "change",
      this._onTextOverlayChange,
    );
  }

  _unbindUIEvents() {
    this.toggleButton?.removeEventListener("click", this._onToggle);
    this.radioGroupDesignSet.removeEventListener(
      "change",
      this._onDesignSetChange,
    );
    this.radioGroupBackground.removeEventListener(
      "change",
      this._onBackgroundChange,
    );
    this.radioGroupForest.removeEventListener("change", this._onForestChange);
    this.radioGroupPark.removeEventListener("change", this._onParkChange);
    this.radioGroupTextOverlay?.removeEventListener(
      "change",
      this._onTextOverlayChange,
    );
    document.removeEventListener("click", this._onDocumentClick);
  }

  // -------------------------
  // Handlers
  // -------------------------

  async _onDesignSetChange(e) {
    const next = e.target.value;
    if (next === this.currentDesignSet) return;

    const requestId = ++this._designSetRequestId;

    this._resetMap(this.currentDesignSet);

    this.currentDesignSet = next;

    const handle = await isomizer(this.map, this.designSets[next].url);

    if (requestId !== this._designSetRequestId) {
      this._resetMapFromHandle(handle);
      return;
    }

    this.designSetHandles[next] = handle;

    this._bringOverlayToFront();

    this._applyStyleSafe();
  }

  _onBackgroundChange(e) {
    this._applyBackground(e.target.value);
  }

  _onForestChange(e) {
    this._applyForest(e.target.value);
  }

  _onParkChange(e) {
    this._applyPark(e.target.value);
  }

  async _onTextOverlayChange(e) {
    const next = e.target.value;
    if (next === this.currentTextOverlay) return;

    if (this.overlayHandle) {
      this._resetMapFromHandle(this.overlayHandle);
      this.overlayHandle = null;
    }

    this.currentTextOverlay = next;

    if (next === "none") return;

    const config = this.textOverlays[next];
    if (!config) return;

    try {
      const handle = await isomizer(this.map, config.url);

      if (this.currentTextOverlay !== next) {
        this._resetMapFromHandle(handle);
        return;
      }

      this.overlayHandle = handle;
    } catch (e) {
      console.error("Failed to load text overlay:", e);
    }
  }

  // -------------------------
  // Core logic
  // -------------------------

  _resetMap(projectKey) {
    const handle = this.designSetHandles[projectKey];
    if (!handle) return;

    this._resetMapFromHandle(handle);
    delete this.designSetHandles[projectKey];
  }

  _resetMapFromHandle(handle) {
    if (!handle) return;

    const { layers = [], images = [] } = handle;

    [...layers].reverse().forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });

    images.forEach((id) => {
      if (this.map.hasImage(id)) {
        this.map.removeImage(id);
      }
    });
  }

  _bringOverlayToFront() {
    if (!this.overlayHandle?.layers) return;

    this.overlayHandle.layers.forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.moveLayer(id);
      }
    });
  }

  _applyStyleSafe(retry = 0) {
    const designSet = this.designSets[this.currentDesignSet];
    if (!designSet) return;

    const { forestLayer, outOfBoundsLayer, parkLayer } = designSet;

    const outOfBoundsLayers = Array.isArray(outOfBoundsLayer)
      ? outOfBoundsLayer
      : [outOfBoundsLayer];

    const forestReady = this.map.getLayer(forestLayer);
    const outOfBoundsReady = outOfBoundsLayers.every((l) =>
      this.map.getLayer(l),
    );
    const parkReady = this.map.getLayer(parkLayer);

    if (!forestReady || !outOfBoundsReady || !parkReady) {
      if (retry > 60) return;
      requestAnimationFrame(() => this._applyStyleSafe(retry + 1));
      return;
    }

    this._applyBackground(this.currentBackgroundColor);
    this._applyForest(this.currentForestColor);
    this._applyPark(this.currentParkColor);
  }

  _applyBackground(bg) {
    this.currentBackgroundColor = bg;

    const designSet = this.designSets[this.currentDesignSet];
    if (!designSet) return;

    const layers = Array.isArray(designSet.outOfBoundsLayer)
      ? designSet.outOfBoundsLayer
      : [designSet.outOfBoundsLayer];

    const color = bg === "green" ? "#9BBB1D" : "#ffffff";

    if (this.map.getLayer("background")) {
      this.map.setPaintProperty("background", "background-color", color);
    }

    layers.forEach((layer) => {
      if (this.map.getLayer(layer)) {
        this.map.setPaintProperty(layer, "fill-color", color);
      }
    });
  }

  _applyForest(style) {
    this.currentForestColor = style;

    const designSet = this.designSets[this.currentDesignSet];
    if (!designSet) return;

    const layer = designSet.forestLayer;
    if (!this.map.getLayer(layer)) return;

    const color = style === "white" ? "#ffffff" : "#C5FFBA";

    this.map.setPaintProperty(layer, "fill-color", color);
  }

  _applyPark(style) {
    this.currentParkColor = style;

    const designSet = this.designSets[this.currentDesignSet];
    if (!designSet) return;

    const layer = designSet.parkLayer;
    if (!this.map.getLayer(layer)) return;

    const color = style === "white" ? "#ffffff" : "#FFBA35";

    this.map.setPaintProperty(layer, "fill-color", color);
  }

  // -------------------------
  // UI
  // -------------------------

  _createUI() {
    this._createContainer();
    this._createToggleButton();
    this._createPanel();

    this._createTextLabelDesignSet();
    this._createRadioGroupDesignSet();
    this._createTextLabelBackground();
    this._createRadioGroupBackground();
    this._createTextLabelForest();
    this._createRadioGroupForest();
    this._createTextLabelPark();
    this._createRadioGroupPark();
    this._createTextLabelTextOverlay();
    this._createRadioGroupTextOverlay();
    this._assemble();
  }

  _assemble() {
    this.container.appendChild(this.toggleButton);
    this.container.appendChild(this.panel);

    this.panel.appendChild(this.textLabelDesignSet);
    this.panel.appendChild(this.radioGroupDesignSet);
    this.panel.appendChild(this.textLabelBackground);
    this.panel.appendChild(this.radioGroupBackground);
    this.panel.appendChild(this.textLabelForest);
    this.panel.appendChild(this.radioGroupForest);
    this.panel.appendChild(this.textLabelPark);
    this.panel.appendChild(this.radioGroupPark);
    this.panel.appendChild(this.textLabelTextOverlay);
    this.panel.appendChild(this.radioGroupTextOverlay);
  }

  // -------------------------
  // UI Parts
  // -------------------------

  _createContainer() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
  }

  _createToggleButton() {
    this.toggleButton = document.createElement("button");
    this.toggleButton.textContent = "⚙️";
  }

  _createPanel() {
    this.panel = document.createElement("div");
    Object.assign(this.panel.style, {
      display: "none",
      padding: "8px",
      background: "white",
      minWidth: "200px",
    });
  }

  _createTextLabelDesignSet() {
    this.textLabelDesignSet = document.createElement("label");
    this.textLabelDesignSet.innerText = "DesignSet";
    this.textLabelDesignSet.style.display = "block";
  }

  _createTextLabelBackground() {
    this.textLabelBackground = document.createElement("label");
    this.textLabelBackground.innerText = "Background Color";
    this.textLabelBackground.style.display = "block";
  }

  _createTextLabelForest() {
    this.textLabelForest = document.createElement("label");
    this.textLabelForest.innerText = "Forest Color";
    this.textLabelForest.style.display = "block";
  }

  _createTextLabelPark() {
    this.textLabelPark = document.createElement("label");
    this.textLabelPark.innerText = "Park Color";
    this.textLabelPark.style.display = "block";
  }

  _createTextLabelTextOverlay() {
    this.textLabelTextOverlay = document.createElement("label");
    this.textLabelTextOverlay.innerText = "Place Labels";
    this.textLabelTextOverlay.style.display = "block";
  }

  _createRadioGroupDesignSet() {
    this.radioGroupDesignSet = this._createRadioGroup(
      [
        { key: "ofm", label: "OpenMapTiles" },
        { key: "shortbread", label: "Shortbread" },
        { key: "hybrid-japan", label: "GSI Hybrid Japan" },
      ],
      "designSets",
      this.currentDesignSet,
    );
  }

  _createRadioGroupBackground() {
    this.radioGroupBackground = this._createRadioGroup(
      [
        { key: "green", label: "green" },
        { key: "white", label: "white" },
      ],
      "designSet-background",
      this.currentBackgroundColor,
    );
  }

  _createRadioGroupForest() {
    this.radioGroupForest = this._createRadioGroup(
      [
        { key: "white", label: "white" },
        { key: "pale-green", label: "pale-green" },
      ],
      "designSet-forest",
      this.currentForestColor,
    );
  }

  _createRadioGroupPark() {
    this.radioGroupPark = this._createRadioGroup(
      [
        { key: "white", label: "white" },
        { key: "yellow", label: "yellow" },
      ],
      "designSet-park",
      this.currentParkColor,
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

  _createRadioGroupTextOverlay() {
    this.radioGroupTextOverlay = this._createRadioGroup(
      [
        { key: "none", label: "none" },
        { key: "ja", label: "ja" },
      ],
      "designSet-text-overlay",
      this.currentTextOverlay,
    );
  }
}

export default DesignSetSwitcherControl;
