class UIManager {
  constructor() {
    this.container = null;
    this.controls = [];
  }

  createCheckboxControl(id, labelText) {
    const container = document.createElement("div");
    container.style.display = "none";
    container.style.flexDirection = "row";
    container.style.alignItems = "center";
    container.style.margin = "4px 0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;

    const label = document.createElement("label");
    label.htmlFor = id;
    label.innerText = labelText;

    container.appendChild(checkbox);
    container.appendChild(label);

    this.controls.push(container);
    return container;
  }

  createInputControl(id, labelText, tooltipText = "", initialValue = "") {
    const container = document.createElement("div");
    container.style.display = "none";
    container.style.flexDirection = "row";
    container.style.alignItems = "center";
    container.style.margin = "4px 0";
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
    input.style.marginLeft = "4px";

    label.appendChild(tooltipIcon);
    container.appendChild(label);
    container.appendChild(input);

    this.controls.push(container);
    return container;
  }

  createShowButton() {
    const button = document.createElement("button");
    button.id = "show-button";
    button.innerText = "🏔️";
    return button;
  }

  createUIElements() {
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";

    const showButton = this.createShowButton();
    const terrainToggleCheckbox = this.createCheckboxControl("terrain-toggle-checkbox", "3D Terrain");
    const terrainExaggerationControl = this.createInputControl(
      "terrain-exaggeration",
      "3D Exaggeration:",
      "Vertical scale for 3D terrain.",
      1
    );

    this.container.appendChild(showButton);
    this.container.append(...this.controls);
  }

  showHideUI(isVisible) {
    this.controls.forEach((control) => {
      control.style.display = isVisible ? "flex" : "none";
    });
  }
}

export default UIManager;