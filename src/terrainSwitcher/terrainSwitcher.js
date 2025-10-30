import UIManager from "./UIManager.js";
import EventManager from "./EventManager.js";

class terrainSwitcher {
  constructor(demSource) {
    this.demSource = demSource;

    this.map = null;
    this.container = null;
    this.uiManager = new UIManager();
    this.eventManager = new EventManager();

    this.terrainExaggeration = 1;
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
      "fog-ground-blend": 0.8,
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

export default terrainSwitcher;
