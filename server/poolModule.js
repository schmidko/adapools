const normalizePoolEntry = (document) => ({
  pool_id: document.bech32_pool_id,
  ticker: document.ticker || null,
  name: document.name || null
});

export const registerPoolRoutes = ({ app, collections }) => {
  app.get('/api/pools/search-index', async (req, res) => {
    try {
      const documents = await collections.poolCache
        .find(
          { bech32_pool_id: { $type: 'string' } },
          {
            projection: {
              _id: 0,
              bech32_pool_id: 1,
              ticker: 1,
              name: 1
            }
          }
        )
        .sort({ ticker: 1, name: 1, bech32_pool_id: 1 })
        .toArray();

      res.json(documents.map(normalizePoolEntry));
    } catch (error) {
      console.error('[adapools] Failed to load pool search index:', error);
      res.status(500).json({ error: 'failed_to_load_pool_search_index' });
    }
  });
};
