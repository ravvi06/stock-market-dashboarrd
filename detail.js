// detail.js - handles company detail block
const DetailPanel = (function () {
  const detailsEl = document.getElementById("details");
  const summaryEl = document.getElementById("company-summary");

  function renderProfile(symbol, profiles, stats) {
    const stat = Array.isArray(stats) ? stats.find((x) => x.symbol === symbol) : null;

    // Fallback if data isn't ready
    const book = stat ? stat.bookValue : "0.000";
    const profit = stat ? stat.profit : "0.000";
    const isPos = stat && stat.profit > 0;
    const profitColor = isPos ? "#34d399" : "#f87171";

    // 1. Render the Side Details Panel (Stats only)
    detailsEl.innerHTML = `
      <h3>${symbol}</h3>
      <div class="detail-row">
        <span class="detail-label">Symbol</span>
        <span class="detail-value">${symbol}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Book Value</span>
        <span class="detail-value">$${book}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Profit</span>
        <span class="detail-value profit-val" style="color:${profitColor}">
          ${profit}%
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${profiles[symbol]?.name || symbol}</span>
      </div>
    `;

    // 2. Render the Summary Text below the graph
    if (summaryEl) {
      summaryEl.textContent = profiles[symbol]?.summary || "No summary information available for this stock.";
    }
  }

  return { renderProfile };
})();