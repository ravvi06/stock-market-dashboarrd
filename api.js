// api.js
const API = (function () {
  const BASE = "https://stock-market-api-k9vl.onrender.com/api";

  async function request(path) {
    const url = `${BASE}/${path}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      console.log("[API]", path, data);
      return data;
    } catch (err) {
      console.error("[API ERROR]", path, err);
      return null;
    }
  }

  return {
    fetchStocksData() {
      return request("stocksdata");
    },
    fetchStocksStats() {
      return request("stocksstatsdata");
    },
    fetchProfiles() {
      return request("profiledata");
    },
  };
})();