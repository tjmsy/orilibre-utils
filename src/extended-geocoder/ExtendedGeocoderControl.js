class ExtendedGeocoderControl {
  constructor({ geocoder, getSearchMode, setSearchMode }) {
    this.geocoder = geocoder;
    this.getSearchMode = getSearchMode;
    this.setSearchMode = setSearchMode;

    this.isPanelElementOpen = false;

    // bind
    this._onPanelToggleClick = this._onPanelToggleClick.bind(this);
    this._onRangeSwitchClick = this._onRangeSwitchClick.bind(this);
    this._onOutsideClick = this._onOutsideClick.bind(this);
    this._onMapMoveEnd = this._onMapMoveEnd.bind(this);
  }

  // -------------------------
  // Lifecycle
  // -------------------------

  onAdd(map) {
    this.map = map;

    this.geocoderElement = this.geocoder.onAdd(map);

    this._buildUI();
    this._styleOverride();
    this._bindEvents();
    this._bindGeocoderIconClick();

    this._syncRangeSwitchUI();

    this.map.on("moveend", this._onMapMoveEnd);

    return this.controlContainer;
  }

  onRemove() {
    this._unbindEvents();

    this.map?.off("moveend", this._onMapMoveEnd);
    document.removeEventListener("click", this._onOutsideClick);

    this.controlContainer.remove();
    this.geocoder.onRemove?.();
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

    this.panelToggleButton.style.display = "none";

    document.addEventListener("click", this._onOutsideClick);
  }

  _close() {
    if (!this.isPanelElementOpen) return;

    this.isPanelElementOpen = false;
    this.panelElement.style.display = "none";

    this.panelToggleButton.style.display = "block";

    document.removeEventListener("click", this._onOutsideClick);
  }

  _onOutsideClick(e) {
    if (!this.isPanelElementOpen) return;

    if (this.controlContainer.contains(e.target)) return;

    this._close();
  }

  // -------------------------
  // Events(UI)
  // -------------------------

  _bindEvents() {
    this.panelToggleButton.addEventListener("click", this._onPanelToggleClick);
    this.rangeSwitchWrapper.addEventListener("mousedown", (e) => {
      e.preventDefault();
    });
    this.rangeSwitchWrapper.addEventListener("click", this._onRangeSwitchClick);
  }

  _unbindEvents() {
    this.panelToggleButton.removeEventListener(
      "click",
      this._onPanelToggleClick,
    );
    this.rangeSwitchWrapper.removeEventListener(
      "click",
      this._onRangeSwitchClick,
    );
  }

  // -------------------------
  // Logic
  // -------------------------

  _onRangeSwitchClick() {
    const next = this.getSearchMode() === "local" ? "global" : "local";

    this.setSearchMode(next);
    this._syncRangeSwitchUI();

    requestAnimationFrame(() => {
      this.geocoderElement?.querySelector("input")?.focus();
    });
  }

  _syncRangeSwitchUI() {
    const isLocal = this.getSearchMode() === "local";

    this.rangeSwitchKnob.style.transform = isLocal
      ? "translateX(10px)"
      : "translateX(0)";

    this.rangeSwitchTrack.style.background = isLocal ? "#1978c8" : "#ccc";
  }

  _onMapMoveEnd() {
    this.geocoder.setProximity({
      longitude: this.map.getCenter().lng,
      latitude: this.map.getCenter().lat,
    });
  }

  _bindGeocoderIconClick() {
    const icon = this.geocoderElement.querySelector(
      ".maplibregl-ctrl-geocoder--icon",
    );

    const input = this.geocoderElement.querySelector("input");

    if (!icon || !input) return;

    icon.style.cursor = "pointer";

    icon.addEventListener("click", () => {
      const query = input.value?.trim();
      if (!query) return;

      this.geocoder.query(query);
    });
  }

  // -------------------------
  // UI
  // -------------------------

  _buildUI() {
    this._createControlContainer();
    this._createPanelToggleButton();
    this._createPanelElement();
    this._createRangeSwitchUI();
    this._assemble();
  }

  _assemble() {
    this.controlContainer.appendChild(this.panelToggleButton);
    this.controlContainer.appendChild(this.panelElement);

    const stack = document.createElement("div");
    stack.style.display = "flex";
    stack.style.flexDirection = "column";

    stack.appendChild(this.geocoderElement);
    stack.appendChild(this.rangeSwitchWrapper);

    this.panelElement.appendChild(stack);
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
    this.panelToggleButton.innerHTML = `
         <svg width="15" height="15" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
           <path d="M22.8702 20.1258H21.4248L20.9125 19.6318C22.7055 17.546 23.785 14.8382 23.785 11.8925C23.785 5.32419 18.4608 0 11.8925 0C5.32419 0 0 5.32419 0 11.8925C0 18.4608 5.32419 23.785 11.8925 23.785C14.8382 23.785 17.546 22.7055 19.6318 20.9125L20.1258 21.4248V22.8702L29.2739 32L32 29.2739L22.8702 20.1258ZM11.8925 20.1258C7.33676 20.1258 3.65923 16.4483 3.65923 11.8925C3.65923 7.33676 7.33676 3.65923 11.8925 3.65923C16.4483 3.65923 20.1258 7.33676 20.1258 11.8925C20.1258 16.4483 16.4483 20.1258 11.8925 20.1258Z" fill="#687078"/>
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

  _createRangeSwitchUI() {
    this.rangeSwitchWrapper = document.createElement("div");

    Object.assign(this.rangeSwitchWrapper.style, {
      display: "flex",
      "justify-content": "space-between",
      "align-items": "center",
      "margin-top": "4px",
      "font-size": "12px",
      cursor: "pointer",
    });

    const label = document.createElement("span");
    label.textContent = "Search this area";

    this.rangeSwitchTrack = document.createElement("div");
    Object.assign(this.rangeSwitchTrack.style, {
      width: "24px",
      height: "14px",
      background: "#ccc",
      "border-radius": "999px",
      position: "relative",
    });

    this.rangeSwitchKnob = document.createElement("div");
    Object.assign(this.rangeSwitchKnob.style, {
      width: "10px",
      height: "10px",
      background: "white",
      borderRadius: "50%",
      position: "absolute",
      top: "2px",
      left: "2px",
      transition: "transform 0.2s",
    });

    this.rangeSwitchTrack.appendChild(this.rangeSwitchKnob);

    this.rangeSwitchWrapper.appendChild(label);
    this.rangeSwitchWrapper.appendChild(this.rangeSwitchTrack);
  }

  _styleOverride() {
    const style = document.createElement("style");
    style.textContent = `
    .maplibregl-ctrl-geocoder {
      position: relative;
      width: min(60vw, 180px) !important;
      margin: 0 !important;
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

    .maplibregl-ctrl-geocoder--icon-close {
      width: 12px;
      height: 12px;
      top:0;
      margin-top: 0;
      margin-right: 0;
    }

    .maplibregl-ctrl-geocoder .suggestions {
      font-size: 11px !important;
      line-height: 1.2;
    }
`;

    document.head.appendChild(style);
  }
}

export default ExtendedGeocoderControl;
