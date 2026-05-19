// ==============================
// crosshair plugin
// ==============================
const crosshairPlugin = {
  id: "crosshair",

  afterDraw(chart) {
    const active = chart.getActiveElements();
    if (!active.length) return;

    const ctx = chart.ctx;
    const { top, bottom, left, right } = chart.chartArea;

    const el = active[0].element;
    const x = el.x;
    const y = el.y;
    const index = active[0].index;

    const distance = chart.data.labels[index];
    const elevation = chart.data.datasets[0].data[index];
    if (elevation === undefined) return;

    ctx.save();

    // -------------------------
    // 縦線
    // -------------------------

    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,0,0,0.8)";
    ctx.stroke();

    // -------------------------
    // 横線
    // -------------------------

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.strokeStyle = "rgba(255,0,0,0.4)";
    ctx.stroke();
    ctx.setLineDash([]);

    // -------------------------
    // ラベル（距離）
    // -------------------------

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    const text = `${distance} km`;
    const w = ctx.measureText(text).width;
    const pad = 6;

    ctx.fillRect(x - w / 2 - pad, top + 4, w + pad * 2, 16);

    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(text, x, top + 12);

    // -------------------------
    // ラベル（標高）
    // -------------------------
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(right - 60, y - 8, 60, 16);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(`${elevation.toFixed(1)} m`, right - 25, y);

    ctx.restore();
  },
};

// ==============================
// create
// ==============================
export function createElevationChart(canvas, { onHoverDistance, onLeave }) {
  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Elevation",
          data: [],
          borderColor: "#007cbf",
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.2,
          fill: true,
          backgroundColor: "rgba(0,124,191,0.2)",
        },
      ],
    },

    options: {
      responsive: false,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false,
      },

      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },

      scales: {
        x: {
          title: { display: true, text: "Distance (km)" },
          ticks: {
            display: true,
          },
          offset: false,
          grid: {
            drawBorder: true,
          },
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: "Elevation (m)" },
          ticks: {
            display: true,
          },
        },
      },

      layout: {
        padding: {
          bottom: 0,
          top: 0,
        },
      },

      // -------------------------
      // hover
      // -------------------------

      onHover(e) {
        if (!chart.data.labels.length) return;

        const rect = chart.canvas.getBoundingClientRect();
        const area = chart.chartArea;

        const x = e.native.clientX - rect.left;
        const y = e.native.clientY - rect.top;

        // 範囲外
        if (
          x < area.left ||
          x > area.right ||
          y < area.top ||
          y > area.bottom
        ) {
          chart.setActiveElements([]);
          chart.update("none");
          onLeave?.();
          return;
        }

        const ratio = (x - area.left) / area.width;
        const clamped = Math.max(0, Math.min(1, ratio));

        const maxDist = chart.data.labels.at(-1) * 1000;
        const targetDist = clamped * maxDist;

        onHoverDistance?.(targetDist);
      },

      onLeave() {
        chart.setActiveElements([]);
        chart.update("none");
        onLeave?.();
      },
    },

    plugins: [crosshairPlugin],
  });

  return chart;
}

// ==============================
// set data
// ==============================
export function setElevationData(chart, profile) {
  chart.data.labels = profile.map((p) => (p.distance / 1000).toFixed(2));
  chart.data.datasets[0].data = profile.map((p) => p.elevation);
  chart.update();
}

// ==============================
// clear
// ==============================

export function clearChart(chart) {
  chart.data.labels = [];
  chart.data.datasets[0].data = [];
  chart.setActiveElements([]);
  chart.update();
}
