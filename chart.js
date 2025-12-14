// chart.js - Chart.js wrapper + Progressive Drawing Animation

// 1. Crosshair Plugin (Vertical line on hover)
const crosshairLinePlugin = {
  id: "crosshairLine",
  afterDatasetsDraw(chart) {
    const { ctx, tooltip, chartArea: { top, bottom } } = chart;
    if (tooltip && tooltip._active && tooltip._active.length) {
      const activePoint = tooltip._active[0];
      const x = activePoint.element.x;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Solid whitish line like in video
      ctx.stroke();
      ctx.restore();
    }
  }
};

Chart.register(crosshairLinePlugin);

const StockChart = (function () {
  const canvas = document.getElementById("stockChart");
  const ctx = canvas.getContext("2d");
  let instance = null;

  function fmt(ts) {
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  function buildConfig(points, label) {
    const labels = points.map((p) => fmt(p.t));
    const values = points.map((p) => +p.v);

    // Animation Speed Control
    // The total drawing will take 2 seconds (2000ms), which matches the video speed.
    const totalDuration = 2000;
    const delayBetweenPoints = totalDuration / points.length;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(34, 197, 94, 0.2)");
    gradient.addColorStop(1, "rgba(34, 197, 94, 0)");

    // Animation Configuration
    const animation = {
      x: {
        type: 'number',
        easing: 'linear',
        duration: delayBetweenPoints,
        from: NaN,
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.mode !== 'default') {
            return 0;
          }
          return ctx.index * delayBetweenPoints;
        }
      },
      y: {
        type: 'number',
        easing: 'linear',
        duration: delayBetweenPoints,
        from: (ctx) => {
          // This is the magic part: Start Y from the previous point's Y
          if (ctx.index === 0) return ctx.chart.scales.y.getPixelForValue(values[0]);
          const meta = ctx.chart.getDatasetMeta(ctx.datasetIndex);
          const prev = meta.data[ctx.index - 1];
          // If previous point exists, start animation from there
          return prev ? prev.y : NaN;
        },
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.mode !== 'default') {
            return 0;
          }
          return ctx.index * delayBetweenPoints;
        }
      }
    };

    return {
      type: "line",
      data: {
        labels,
        datasets: [{
          label,
          data: values,
          borderColor: "#34d399",
          backgroundColor: gradient,
          fill: true,
          tension: 0.2, // Slight curve to match video
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#34d399",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 2
        }]
      },
      options: {
        animation, // Apply our custom animation
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            displayColors: false,
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleColor: "#9ca3af",
            bodyColor: "#fff",
            bodyFont: { size: 14, weight: 'bold' },
            padding: 10,
            borderColor: "#374151",
            borderWidth: 1,
            callbacks: {
              title: (items) => items[0].label,
              label: (context) => `$${context.parsed.y.toFixed(2)}`
            }
          },
          crosshairLine: {}
        },
        scales: {
          x: { display: false, grid: { display: false } },
          y: {
            display: true,
            position: 'right',
            ticks: { color: "#6b7280", callback: (val) => "$" + val.toFixed(1) },
            grid: { color: "#374151", drawBorder: false }
          }
        }
      }
    };
  }

  function create(points, label) {
    const config = buildConfig(points, label);
    if (instance) instance.destroy();
    instance = new Chart(ctx, config);
    return instance;
  }

  function update(points, label) {
    if (instance) instance.destroy();
    return create(points, label);
  }

  function findPeakLow(points) {
    if (!points || !points.length) return null;
    let max = -Infinity, min = Infinity, iMax = 0, iMin = 0;
    points.forEach((p, i) => {
      const v = +p.v;
      if (v > max) { max = v; iMax = i; }
      if (v < min) { min = v; iMin = i; }
    });
    return {
      peak: { idx: iMax, ts: points[iMax].t, val: +points[iMax].v },
      low: { idx: iMin, ts: points[iMin].t, val: +points[iMin].v }
    };
  }

  return { create, update, findPeakLow };
})();