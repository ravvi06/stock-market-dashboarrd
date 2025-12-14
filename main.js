(async function () {
  const chartInfoEl = document.getElementById("chart-info");
  const peakEl = document.getElementById("peak-low");
  const lastUpdatedEl = document.getElementById("last-updated");

  // UI range buttons -> API range keys
  const RANGE_MAP = {
    "1m": "1mo",
    "3m": "3mo",
    "1y": "1y",
    "5y": "5y"
  };

  let stocksData = {};
  let statsData = [];
  let profiles = {};
  let selectedSymbol = null;

  function normalizeChartPoints(rangeObj) {
    if (!rangeObj || !Array.isArray(rangeObj.value) || !Array.isArray(rangeObj.timeStamp)) {
      return [];
    }
    const values = rangeObj.value;
    const times = rangeObj.timeStamp;
    const pts = [];
    for (let i = 0; i < values.length && i < times.length; i++) {
      pts.push({ t: times[i], v: values[i] });
    }
    return pts;
  }

  function normalizeStocks(raw) {
    if (!raw || !raw.stocksData || !Array.isArray(raw.stocksData)) {
      console.warn("stocksData in unexpected format:", raw);
      return {};
    }
    const src = raw.stocksData[0];
    if (!src || typeof src !== "object") {
      console.warn("stocksData[0] not object:", raw);
      return {};
    }
    const result = {};
    Object.keys(src).forEach((symbol) => {
      if (symbol === "_id") return;
      const ranges = src[symbol];
      if (!ranges || typeof ranges !== "object") return;
      result[symbol] = {
        "1mo": normalizeChartPoints(ranges["1mo"]),
        "3mo": normalizeChartPoints(ranges["3mo"]),
        "1y": normalizeChartPoints(ranges["1y"]),
        "5y": normalizeChartPoints(ranges["5y"])
      };
    });
    return result;
  }

  function normalizeStats(raw) {
    if (!raw || !raw.stocksStatsData) return [];
    let src = raw.stocksStatsData;
    if (Array.isArray(src)) src = src[0];
    if (!src || typeof src !== "object") {
      console.warn("stocksStatsData in unexpected shape:", raw);
      return [];
    }

    // Filter out "_id"
    return Object.keys(src)
      .filter(symbol => symbol !== "_id")
      .map((symbol) => ({
        symbol,
        ...src[symbol],
      }));
  }

  function normalizeProfiles(raw) {
    const map = {};
    if (!raw || !raw.stocksProfileData) return map;
    let src = raw.stocksProfileData;
    if (Array.isArray(src)) src = src[0];
    if (!src || typeof src !== "object") {
      console.warn("stocksProfileData in unexpected shape:", raw);
      return map;
    }
    Object.keys(src).forEach((symbol) => {
      if (symbol === "_id") return;
      const p = src[symbol];
      if (p) map[symbol] = { symbol, ...p };
    });
    return map;
  }

  function getActiveRange() {
    const btn = document.querySelector(".range-btn.active");
    return btn ? btn.dataset.range : "1m";
  }

  function renderDetails() {
    if (!selectedSymbol) return;
    DetailPanel.renderProfile(selectedSymbol, profiles, statsData);
  }

  function renderChart() {
    if (!selectedSymbol) return;

    const uiRange = getActiveRange();
    const apiRangeKey = RANGE_MAP[uiRange] || "1mo";

    const symbolData = stocksData[selectedSymbol];
    if (!symbolData) {
      chartInfoEl.textContent = "No chart data for " + selectedSymbol;
      return;
    }

    const points = symbolData[apiRangeKey];
    if (!points || !points.length) {
      chartInfoEl.textContent = "No chart data for " + selectedSymbol + " (" + apiRangeKey + ")";
      return;
    }

    StockChart.update(points, selectedSymbol);

    const peakLow = StockChart.findPeakLow(points);
    if (peakLow) {
      peakEl.textContent =
        `Peak: ${new Date(peakLow.peak.ts * 1000).toLocaleDateString()} $${peakLow.peak.val.toFixed(2)}  |  ` +
        `Low: ${new Date(peakLow.low.ts * 1000).toLocaleDateString()} $${peakLow.low.val.toFixed(2)}`;
    } else {
      peakEl.textContent = "";
    }

    chartInfoEl.textContent = `Showing ${uiRange} data for ${selectedSymbol}`;
  }

  async function loadAll(isAutoRefresh = false) {
    try {
      chartInfoEl.textContent = "Fetching latest data...";

      // --- 30 SECOND DELAY START ---
      // This pauses execution for 30 seconds before fetching data
      await new Promise(resolve => setTimeout(resolve, 30000));
      // --- 30 SECOND DELAY END ---

      const [rawStocks, rawStats, rawProfiles] = await Promise.all([
        API.fetchStocksData(),
        API.fetchStocksStats(),
        API.fetchProfiles(),
      ]);

      stocksData = normalizeStocks(rawStocks);
      statsData = normalizeStats(rawStats);
      profiles = normalizeProfiles(rawProfiles);

      if (!isAutoRefresh) {
        StockList.renderList(statsData);
        selectedSymbol =
          StockList.getSelectedSymbol() ||
          (statsData[0] && statsData[0].symbol) ||
          Object.keys(stocksData)[0];

        const li = document.querySelector(
          `.stock-item[data-symbol="${selectedSymbol}"]`
        );
        if (li) StockList.selectItem(li);
      } else {
        StockList.updateValues(statsData);
        if (selectedSymbol) {
          renderChart();
        }
      }

      renderDetails();
      renderChart();

      lastUpdatedEl.textContent =
        "Last updated: " + new Date().toLocaleTimeString();
    } catch (err) {
      console.error("ERROR LOADING DATA:", err);
      chartInfoEl.textContent =
        "Could not reach API (server sleeping or offline).";
    }
  }

  document.addEventListener("stock:selected", (e) => {
    selectedSymbol = e.detail;
    renderDetails();
    renderChart();
  });

  document.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".range-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderChart();
    });
  });

  // Initial load with false to trigger the 30s delay
  await loadAll(false);
  // Auto refresh every 30s thereafter
  setInterval(() => loadAll(true), 30000);
})();