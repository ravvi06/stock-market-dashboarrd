// list.js - handles portfolio list
const StockList = (function () {
  const listEl = document.getElementById("stock-list");
  let currentSelection = null;

  function renderList(stats) {
    if (!Array.isArray(stats)) {
      listEl.innerHTML = "<li>Error loading data</li>";
      return;
    }

    listEl.innerHTML = "";
    stats.forEach((s) => {
      const li = document.createElement("li");
      li.className = "stock-item";
      li.dataset.symbol = s.symbol;

      const isPos = s.profit > 0;
      const profitClass = isPos ? "pos" : "neg";
      const sign = isPos ? "+" : "";

      // Matches: AAPL  $3.953           +0.245
      li.innerHTML = `
        <div class="list-left">
          <span class="symbol-text">${s.symbol}</span>
          <span class="price-val price-text">$${(+s.bookValue).toFixed(3)}</span>
        </div>
        <div class="change-text ${profitClass}">${sign}${(+s.profit).toFixed(3)}</div>
      `;

      li.addEventListener("click", () => {
        selectItem(li);
        document.dispatchEvent(new CustomEvent("stock:selected", { detail: s.symbol }));
      });

      listEl.appendChild(li);
    });
  }

  function updateValues(stats) {
    if (!Array.isArray(stats)) return;
    stats.forEach((s) => {
      const li = listEl.querySelector(`.stock-item[data-symbol="${s.symbol}"]`);
      if (!li) return;

      const priceEl = li.querySelector(".price-val");
      const changeEl = li.querySelector(".change-text");

      if (priceEl) priceEl.textContent = `$${(+s.bookValue).toFixed(3)}`;

      if (changeEl) {
        const isPos = s.profit > 0;
        changeEl.textContent = `${isPos ? "+" : ""}${(+s.profit).toFixed(3)}`;
        changeEl.className = `change-text ${isPos ? "pos" : "neg"}`;
      }
    });
  }

  function selectItem(li) {
    if (currentSelection) currentSelection.classList.remove("selected");
    li.classList.add("selected");
    currentSelection = li;
  }

  function getSelectedSymbol() {
    return currentSelection ? currentSelection.dataset.symbol : null;
  }

  return { renderList, updateValues, selectItem, getSelectedSymbol };
})();