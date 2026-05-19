import { DemSampler } from "./demSampler.js";
import {
  densifyRoute,
  buildElevationProfile,
} from "./elevationProfileBuilder.js";
import {
  createElevationChart,
  setElevationData,
  clearChart,
} from "./chartView.js";
import { findClosestDistanceOnRoute } from "./routeDistance.js";
import { ElevationService } from "./ElevationService.js";

// ==============================
// Model
// ==============================
class GraphModel {
  constructor() {
    this.coords = [];
    this.sampled = [];
    this.profile = [];
  }

  reset() {
    this.coords = [];
    this.sampled = [];
    this.profile = [];
  }
}

// ==============================
// Sync
// ==============================
class SyncController {
  constructor(map, chart) {
    this.map = map;
    this.chart = chart;
  }

  updateByDistance(dist, model) {
    if (!model?.profile?.length) return;

    const i = this._findIndex(model.profile, dist);
    const coord = model.sampled[i];
    if (!coord) return;

    this.map.getSource("cursor")?.setData({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coord[0], coord[1]],
      },
    });

    this.chart.setActiveElements([{ datasetIndex: 0, index: i }]);
    this.chart.update("none");
  }

  clear() {
    this.chart?.setActiveElements([]);
    this.chart?.update("none");
  }

  _findIndex(profile, target) {
    let lo = 0;
    let hi = profile.length - 1;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (profile[mid].distance < target) lo = mid + 1;
      else hi = mid;
    }

    if (lo === 0) return 0;

    const prev = profile[lo - 1];
    const curr = profile[lo];

    return Math.abs(prev.distance - target) < Math.abs(curr.distance - target)
      ? lo - 1
      : lo;
  }
}

// ==============================
// Control
// ==============================
export default class ElevationGraphControl {
  constructor(options = {}) {
    this.demManager = options.demManager;
    this.project = options.project;

    this.z = options.z ?? 14;
    this.tileSize = options.tileSize ?? 512;
    this.encoding = options.encoding ?? "terrarium";

    this.map = null;
    this.canvas = null;

    this.model = new GraphModel();

    this.chart = null;
    this.sync = null;
    this.sampler = null;
    this.service = null;

    this.initialized = false;
  }

  // ------------------------------
  // lifecycle
  // ------------------------------
  onAdd(map) {
    this.map = map;

    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl elevation-graph";

    Object.assign(this.container.style, {
      width: "100%",
      height: "200px",
      background: "#fff",
      display: "none",
    });

    this.canvas = document.createElement("canvas");
    this._createToggleButton();
    this.container.appendChild(this.canvas);

    this._setupCursor();
    this._bindEvents();

    return this.container;
  }

  onRemove() {
    this._unbindEvents();
    this.container.remove();
  }

  // ------------------------------
  // init
  // ------------------------------
  init() {
    if (this.initialized) return;

    this.sampler = new DemSampler(
      this.demManager,
      (lng, lat, z, tileSize) => project(maplibregl, lng, lat, z, tileSize),
      {
        z: 14,
        tileSize: this.tileSize,
      },
    );

    this.service = new ElevationService({
      sampler: this.sampler,
      densify: densifyRoute,
      buildProfile: buildElevationProfile,
      maplibregl,
    });

    this.chart = createElevationChart(this.canvas, {
      onHoverDistance: (dist) => {
        this.sync?.updateByDistance(dist, this.model);
        this._showCursor();
      },
      onLeave: () => {
        this.sync?.clear();
        this._hideCursor();
      },
    });

    this.sync = new SyncController(this.map, this.chart);

    this.initialized = true;
  }

  // ------------------------------
  // API
  // ------------------------------
  async setCoords(coords) {
    this.init();

    this.model.coords = coords;

    if (!coords?.length) {
      this.clear();
      return;
    }

    const { sampled, profile } = await this.service.build(coords);

    this.model.sampled = sampled;
    this.model.profile = profile;

    setElevationData(this.chart, profile);
    this.container.style.display = "block";
  }

  clear() {
    this.model.reset();

    clearChart(this.chart);
    this.sync?.clear();
    this._hideCursor();
    this.container.style.display = "none";
  }

  // ------------------------------
  // map sync
  // ------------------------------
  _bindEvents() {
    this.map.on("mousemove", this._onMove);
    this.map.on("mouseleave", this._onLeave);
  }

  _unbindEvents() {
    this.map.off("mousemove", this._onMove);
    this.map.off("mouseleave", this._onLeave);
  }

  _onMove = (e) => {
    if (!this.model.profile?.length) return;

    const result = findClosestDistanceOnRoute(
      e.lngLat.lng,
      e.lngLat.lat,
      this.model.sampled,
      this.model.profile,
    );

    const mousePx = this.map.project(e.lngLat);
    const pointPx = this.map.project({
      lng: result.closestPoint[0],
      lat: result.closestPoint[1],
    });

    const dx = mousePx.x - pointPx.x;
    const dy = mousePx.y - pointPx.y;
    const pixelDist = Math.hypot(dx, dy);

    if (pixelDist > 10) {
      this.sync.clear();
      this._hideCursor();
      return;
    }

    this.sync.updateByDistance(result.routeDistance, this.model);
    this._showCursor();
  };

  _onLeave = () => {
    this.sync.clear();
    this._hideCursor();
  };

  // ------------------------------
  // cursor
  // ------------------------------
  _setupCursor() {
    if (!this.map.getSource("cursor")) {
      this.map.addSource("cursor", {
        type: "geojson",
        data: {
          type: "Point",
          coordinates: [],
        },
      });
    }

    if (!this.map.getLayer("cursor")) {
      this.map.addLayer({
        id: "cursor",
        type: "circle",
        source: "cursor",
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff0000",
        },
      });
    }
  }

  _showCursor() {
    this.map?.setLayoutProperty("cursor", "visibility", "visible");
  }

  _hideCursor() {
    this.map?.setLayoutProperty("cursor", "visibility", "none");
  }

  // ==============================
  // UI
  // ==============================
  _createToggleButton() {
    const btn = document.createElement("button");
    btn.textContent = "-";

    btn.onclick = () => {
      const collapsed = this.container.classList.toggle("collapsed");
      this.canvas.style.display = collapsed ? "none" : "block";
    };

    this.container.appendChild(btn);
  }
}

// ==============================
// projection
// ==============================
export function project(maplibregl, lng, lat, z, tileSize = 512) {
  const worldSize = tileSize * Math.pow(2, z);

  const x = ((lng + 180) / 360) * worldSize;

  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize;

  return {
    tileX: Math.floor(x / tileSize),
    tileY: Math.floor(y / tileSize),
    px: x % tileSize,
    py: y % tileSize,
  };
}
