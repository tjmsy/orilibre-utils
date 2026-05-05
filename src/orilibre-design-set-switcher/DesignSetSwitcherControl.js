import { isomizer } from "https://cdn.jsdelivr.net/gh/tjmsy/maplibre-gl-isomizer@0.4/src/isomizer.js";

class DesignSetSwitcherControl {
  constructor(options = {}) {
    this.options = {
      defaultDesignSet: "ofm",
      defaultBackgroundColor: "green",
      defaultForestColor: "white",
      ...options,
    };

    this.designSets = {
      ofm: {
        label: "OSM(OpenMapTiles)",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/global/project-config.yml",
        forestLayer: "405-forest-ofm-landcover",
        managedSources: ["ofm"],
        managedImages: [
          "cultivated-land-pattern",
          "sandy-ground-pattern",
          "boulder-field-pattern",
          "marsh-pattern",
          "orchard-pattern",
        ],
      },
      shortbread: {
        label: "OSM(Shortbread)",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/shortbread/project-config.yml",
        forestLayer: "405-forest-shortbread-land",
        managedSources: ["shortbread"],
        managedImages: [
          "cultivated-land-pattern",
          "sandy-ground-pattern",
          "boulder-field-pattern",
          "marsh-pattern",
          "orchard-pattern",
        ],
      },
      "hybrid-japan": {
        label: "Hybrid(japan)",
        url: "https://cdn.jsdelivr.net/gh/tjmsy/isomizer-projectfiles@0.4/projects/isomized-japan/project-config.yml",
        forestLayer: "405-forest-ofm-landcover",
        managedSources: ["ofm", "gsivt", "fude"],
        managedImages: [
          "cultivated-land-pattern",
          "sandy-ground-pattern",
          "boulder-field-pattern",
          "marsh-pattern",
          "orchard-pattern",
        ],
      },
    };

    // state
    this.isOpen = false;
    this.currentDesignSet = this.options.defaultDesignSet;
    this.currentBackgroundColor = this.options.defaultBackgroundColor;
    this.currentForestColor = this.options.defaultForestColor;

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
    this.radioGroupDesignSet.addEventListener("change", this._onDesignSetChange);
    this.radioGroupBackground.addEventListener(
      "change",
      this._onBackgroundChange,
    );
    this.radioGroupForest.addEventListener("change", this._onForestChange);
  }

  _unbindUIEvents() {
    this.toggleButton?.removeEventListener("click", this._onToggle);
    this.radioGroupDesignSet.removeEventListener("change", this._onDesignSetChange);
    this.radioGroupBackground.removeEventListener(
      "change",
      this._onBackgroundChange,
    );
    this.radioGroupForest.removeEventListener("change", this._onForestChange);
    document.removeEventListener("click", this._onDocumentClick);
  }

  // -------------------------
  // Handlers
  // -------------------------

  _onDesignSetChange(e) {
    const next = e.target.value;
    if (next === this.currentDesignSet) return;

    this._resetMap(this.currentDesignSet);

    this.currentDesignSet = next;

    isomizer(this.map, this.designSets[next].url);

    this._applyStyleSafe();
  }

  _onBackgroundChange(e) {
    this._applyBackground(e.target.value);
  }

  _onForestChange(e) {
    this._applyForest(e.target.value);
  }

  // -------------------------
  // Core logic
  // -------------------------

  _resetMap(projectKey) {
    const style = this.map.getStyle();
    if (!style) return;

    const layers = style.layers || [];
    const designSet = this.designSets[projectKey];
    if (!designSet) return;

    const removeLayerIds = [];

    layers.forEach((layer) => {
      if (layer.metadata?.["isomizer:project"] === projectKey) {
        removeLayerIds.push(layer.id);
      }
    });

    [...removeLayerIds].reverse().forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    });

    (designSet.managedSources || []).forEach((id) => {
      if (this.map.getSource(id)) {
        this.map.removeSource(id);
      }
    });

    (designSet.managedImages || []).forEach((id) => {
      if (this.map.hasImage(id)) {
        this.map.removeImage(id);
      }
    });
  }

  _applyStyleSafe(retry = 0) {
    const designSet = this.designSets[this.currentDesignSet];
    if (!designSet) return;

    if (!this.map.getLayer(designSet.forestLayer)) {
      if (retry > 60) return;
      requestAnimationFrame(() => this._applyStyleSafe(retry + 1));
      return;
    }

    this._applyBackground(this.currentBackgroundColor);
    this._applyForest(this.currentForestColor);
  }

  _applyBackground(bg) {
    this.currentBackgroundColor = bg;

    if (!this.map.getLayer("background")) return;

    const color = bg === "green" ? "#9BBB1D" : "#ffffff";

    this.map.setPaintProperty("background", "background-color", color);
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
    this.toggleButton.textContent = "🔄";
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

  _createRadioGroupDesignSet() {
    this.radioGroupDesignSet = this._createRadioGroup(
      [
        { key: "ofm", label: "OSM(OpenMapTiles)" },
        { key: "shortbread", label: "OSM(Shortbread)" },
        { key: "hybrid-japan", label: "Hybrid(japan)" },
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
        { key: "light-green", label: "light-green" },
      ],
      "designSet-forest",
      this.currentForestColor,
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
}

export default DesignSetSwitcherControl;
