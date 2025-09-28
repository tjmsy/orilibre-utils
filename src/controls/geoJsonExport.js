class GeoJsonExport {
  constructor() {
    this.map = null;
    this.selectedLayers = new Set();
  }

  collectLayers() {
    const style = this.map.getStyle();
    const seen = new Set();
    const layers = [];

    style.layers.forEach((layer) => {
      if (layer.source && layer["source-layer"]) {
        const key = `${layer.source}:${layer["source-layer"]}`;
        if (!seen.has(key)) {
          seen.add(key);
          layers.push({
            source: layer.source,
            sourceLayer: layer["source-layer"],
          });
        }
      }
    });

    return layers;
  }

  getFeatures() {
    let allFeatures = [];

    this.selectedLayers.forEach(({ source, sourceLayer }) => {
      const features = this.map.querySourceFeatures(source, {
        sourceLayer,
      });

      allFeatures = allFeatures.concat(
        features.map((feature) => {
          const f = feature.toJSON();
          return {
            ...f,
            properties: {
              ...f.properties,
              _source: source,
              _sourceLayer: sourceLayer,
            },
          };
        })
      );
    });

    return {
      type: "FeatureCollection",
      features: allFeatures,
    };
  }

  buildUI() {
    const layers = this.collectLayers();

    const group = document.createElement("div");
    group.style.position = "relative";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = "📑";
    group.appendChild(toggleBtn);

    const panel = document.createElement("div");
    panel.style.display = "none";
    panel.style.top = "100%";
    panel.style.right = "0";
    panel.style.background = "white";
    panel.style.padding = "6px";
    panel.style.border = "1px solid #ccc";
    panel.style.borderRadius = "4px";
    panel.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    panel.style.maxHeight = "250px";
    panel.style.overflowY = "auto";
    panel.style.minWidth = "180px";

    layers.forEach((layerInfo) => {
      const id = `${layerInfo.source}-${layerInfo.sourceLayer}`;

      const label = document.createElement("label");
      label.style.display = "block";
      label.style.fontSize = "12px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = id;
      checkbox.checked = true;
      this.selectedLayers.add(layerInfo);

      checkbox.addEventListener("change", (e) => {
        const style = this.map.getStyle();
        const relevantLayers = style.layers.filter(
          (l) =>
            l.source === layerInfo.source &&
            l["source-layer"] === layerInfo.sourceLayer
        );

        relevantLayers.forEach((l) =>
          this.map.setLayoutProperty(
            l.id,
            "visibility",
            e.target.checked ? "visible" : "none"
          )
        );

        if (e.target.checked) {
          this.selectedLayers.add(layerInfo);
        } else {
          this.selectedLayers.delete(layerInfo);
        }
      });

      label.appendChild(checkbox);
      label.appendChild(
        document.createTextNode(`${layerInfo.source}:${layerInfo.sourceLayer}`)
      );
      panel.appendChild(label);
    });

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.textContent = "Export geoJSON";

    exportBtn.className = "";

    exportBtn.style.display = "block";
    exportBtn.style.marginTop = "8px";
    exportBtn.style.padding = "3px 3px";
    exportBtn.style.border = "1px solid #888";
    exportBtn.style.borderRadius = "4px";
    exportBtn.style.background = "#fff";
    exportBtn.style.cursor = "pointer";
    exportBtn.style.width = "auto";
    exportBtn.style.height = "auto";
    exportBtn.style.lineHeight = "normal";

    exportBtn.addEventListener("mouseover", () => {
      exportBtn.style.background = "#f0f0f0";
    });
    exportBtn.addEventListener("mouseout", () => {
      exportBtn.style.background = "#fff";
    });

    exportBtn.addEventListener("click", () => {
      const geoJSON = this.getFeatures();
      this.downloadGeoJSON(geoJSON, "exported_data.geojson");
    });

    panel.appendChild(exportBtn);

    toggleBtn.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    group.appendChild(panel);
    this.container.appendChild(group);
  }

  downloadGeoJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    this.buildUI();

    return this.container;
  }

  onRemove() {
    this.container.remove();
    this.container = null;
    this.map = null;
  }
}

export default GeoJsonExport;
