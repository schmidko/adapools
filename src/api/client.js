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
  getPoolBlocks: (poolId, { limit = 20, beforeBlockNo } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (beforeBlockNo) params.set('beforeBlockNo', String(beforeBlockNo));
    return fetchJson(`/api/pools/${encodeURIComponent(poolId)}/blocks?${params.toString()}`);
  },
  getPoolTimeline: (poolId, { limit = 20, beforeTime } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (beforeTime) params.set('beforeTime', beforeTime);
    return fetchJson(`/api/pools/${encodeURIComponent(poolId)}/timeline?${params.toString()}`);
  },
  getPoolRecentBlocks: (poolId) => fetchJson(`/api/pools/${encodeURIComponent(poolId)}/recent-blocks`),
  getPoolSearchIndex: () => fetchJson('/api/pools/search-index'),
  getSyncStatus: () => fetchJson('/api/sync/status')
};
