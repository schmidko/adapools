const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

export const api = {
  getCardanoMetrics: () => fetchJson('/api/cardano/metrics'),
  getLatestBlocks: (limit = 120) => fetchJson(`/api/blocks/latest?limit=${limit}`),
  getPoolMetrics: (poolId) => fetchJson(`/api/pools/${encodeURIComponent(poolId)}/metrics`),
  getPoolRecentBlocks: (poolId) => fetchJson(`/api/pools/${encodeURIComponent(poolId)}/recent-blocks`),
  getPoolSearchIndex: () => fetchJson('/api/pools/search-index'),
  getSyncStatus: () => fetchJson('/api/sync/status')
};
