class UIManager {
  constructor() {
    this.container = null;
  }

  createShowButton() {
    const showButton = document.createElement("button");
    showButton.id = "show-button";
    showButton.innerText = "🏔️";
    return showButton;
  }

  createInputControl(id, labelText, tooltipText = "", initialValue = "") {
    const container = document.createElement("div");
    container.style.display = "none";
    container.id = `${id}-container`;

    const label = document.createElement("label");
    label.innerText = labelText;

    const tooltipIcon = document.createElement("span");
    tooltipIcon.innerText = "ℹ️";
    tooltipIcon.style.cursor = "help";
    tooltipIcon.title = tooltipText;

    const input = document.createElement("input");
    input.id = `${id}-input`;
    input.type = "number";
    input.value = initialValue;
    input.style.width = "40px";

    label.appendChild(tooltipIcon);
    container.appendChild(label);
    container.appendChild(input);
    return container;
  }

  createTooltip(text) {
    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.innerText = text;
    tooltip.style.display = "none";
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "#333";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "5px";
    tooltip.style.borderRadius = "5px";
    tooltip.style.fontSize = "12px";
    return tooltip;
  }

  createUIElements() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    const showButton = this.createShowButton();
    const terrainExaggerationControl = this.createInputControl(
      "terrain-exaggeration",
      "3D Exaggeration:",
      "Vertical scale for 3D terrain.",
      1
    );
    const contourIntervalControl = this.createInputControl(
      "contour-interval",
      "Contour Interval:",
      "At zoom level 14. Doubles at each lower zoom.",
      5
    );

    this.container.appendChild(showButton);
    this.container.appendChild(terrainExaggerationControl);
    this.container.appendChild(contourIntervalControl);
  }

  showHideUI(isVisible) {
    const inputs = this.container.querySelectorAll("div");
    const showButton = this.container.querySelector("#show-button");

    inputs.forEach((input) => {
      input.style.display = isVisible ? "flex" : "none";
    });
  }
}

export default UIManager;
