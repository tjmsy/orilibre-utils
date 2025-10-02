import UIManager from "./UIManager.js";
import EventManager from "./EventManager.js";

class terrainParameterControl {
  constructor(demSource) {
    this.demSource =
      demSource ||
      new mlcontour.DemSource({
        url: "https://gbank.gsj.jp/seamless/elev/terrainRGB/mixed/{z}/{y}/{x}.png",
        encoding: "mapbox",
        minzoom: 0,
        maxzoom: 17,
        worker: true,
        cacheSize: 100,
        timeoutMs: 100_000,
      });
    this.demSource.setupMaplibre(maplibregl);

    this.map = null;
    this.container = null;
    this.uiManager = new UIManager();
    this.eventManager = new EventManager();

    this.terrainExaggeration = 1;
    this.contourInterval = 5;
    this.isOutsideClickListenerActive = false;
  }

  initializeTerrain() {
    this.map.addSource("terrain", {
      type: "raster-dem",
      tiles: [this.demSource.sharedDemProtocolUrl],
      tileSize: 256,
    });

    const sky = {
      "sky-color": "#199EF3",
      "sky-horizon-blend": 0.5,
      "horizon-color": "#ffffff",
      "horizon-fog-blend": 0.5,
      "fog-color": "#0000ff",
      "fog-ground-blend": 0.5,
      "atmosphere-blend": [
        "interpolate",
        ["linear"],
        ["zoom"],
        0,
        1,
        10,
        1,
        12,
        0,
      ],
    };
    this.map.setSky(sky);
  }

  updateTerrainExaggeration() {
    const exaggeration = parseFloat(this.terrainExaggeration);
    if (isNaN(exaggeration) || exaggeration <= 0) return;

    this.map.setTerrain({
      source: "terrain",
      exaggeration: exaggeration,
    });
  }

  generateContourTiles() {
    const thresholds = {};
    const baseInterval = this.contourInterval;

    for (let zoomLevel = 14; zoomLevel >= 0; zoomLevel--) {
      const interval = baseInterval * Math.pow(2, 14 - zoomLevel);
      thresholds[zoomLevel] = [interval, interval * 5];
    }

    return this.demSource.contourProtocolUrl({
      thresholds,
      contourLayer: "contours",
      elevationKey: "ele",
      levelKey: "level",
      extent: 4096,
      buffer: 1,
    });
  }

  updateContourInterval() {
    const contourSource = this.map.getSource("contour-source");
    if (contourSource) {
      contourSource.setTiles([this.generateContourTiles()]);
    }
  }

  setupTerrainToggleSync() {
    const terrainCheckbox = this.container.querySelector("#terrain-toggle-checkbox");
    const exaggerationInput = this.container.querySelector("#terrain-exaggeration-input");

    terrainCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) this.updateTerrainExaggeration();
      else this.map.setTerrain(null);
    });

    exaggerationInput.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (isNaN(val) || val <= 0) return;

      if (!terrainCheckbox.checked) terrainCheckbox.checked = true;
      this.updateTerrainExaggeration();
    });
  }

  attachEventListeners() {
    const inputConfig = [
      {
        elementId: "#terrain-exaggeration-input",
        property: "terrainExaggeration",
        updateMethod: this.updateTerrainExaggeration.bind(this),
        tooltipElementId: "#terrain-exaggeration-container .tooltip",
      },
      {
        elementId: "#contour-interval-input",
        property: "contourInterval",
        updateMethod: this.updateContourInterval.bind(this),
        tooltipElementId: "#contour-interval-container .tooltip",
      },
    ];

    this.eventManager.addClickListener(
      this.container.querySelector("#show-button"),
      () => {
        this.uiManager.showHideUI(true);

        if (!this.isOutsideClickListenerActive) {
          this.eventManager.addOutsideClickListener(this.container, () => {
            this.uiManager.showHideUI(false);
            this.isOutsideClickListenerActive = false;
          });
          this.isOutsideClickListenerActive = true;
        }
      }
    );

    inputConfig.forEach(({ elementId, property, updateMethod, tooltipElementId }) => {
      const inputElement = this.container.querySelector(elementId);
      const tooltipElement = this.container.querySelector(tooltipElementId);

      this.eventManager.addInputListener(inputElement, (value) => {
        this[property] = value;
        updateMethod();
      });
      this.eventManager.addTooltipListeners(inputElement, tooltipElement);
    });

    this.setupTerrainToggleSync();
  }

  createUI() {
    this.uiManager.createUIElements();
    this.container = this.uiManager.container;
  }

  onAdd(map) {
    this.map = map;
    this.createUI();
    this.attachEventListeners();
    this.initializeTerrain();
    return this.container;
  }

  onRemove() {
    this.eventManager.clearAllListeners();
    this.container.remove();
    this.container = null;
    this.map = null;
  }
}

export default terrainParameterControl;
