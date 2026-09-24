const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const sendJson = async (url, method, body) => {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed: ${response.status}`);
    error.code = payload.error;
    throw error;
  }
  return payload;
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
  getPoolTimeline: (poolId, { limit = 50, beforeTime } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (beforeTime) params.set('beforeTime', beforeTime);
    return fetchJson(`/api/pools/${encodeURIComponent(poolId)}/timeline?${params.toString()}`);
  },
  getPoolRecentBlocks: (poolId) => fetchJson(`/api/pools/${encodeURIComponent(poolId)}/recent-blocks`),
  getPoolDelegators: (poolId, { page = 1, limit = 50 } = {}) => fetchJson(
    `/api/pools/${encodeURIComponent(poolId)}/delegators?${new URLSearchParams({ page: String(page), limit: String(limit) }).toString()}`
  ),
  getRetiredPools: () => fetchJson('/api/pools/retired'),
  getPoolSearchIndex: () => fetchJson('/api/pools/search-index'),
  getPoolDiscovery: (params) => fetchJson(`/api/pools/discover?${new URLSearchParams(params).toString()}`),
  getSyncStatus: () => fetchJson('/api/sync/status'),
  getPoolAdsStatus: () => fetchJson('/api/pool-ads/status'),
  getPoolAdSlots: () => fetchJson('/api/pool-ads/slots'),
  searchPoolAds: (query = '') => fetchJson(`/api/pool-ads/pools?query=${encodeURIComponent(query)}`),
  createPoolAdQuote: (details) => sendJson('/api/pool-ads/quotes', 'POST', details),
  verifyPoolAdPayment: (details) => sendJson('/api/pool-ads/verify', 'POST', details)
};
