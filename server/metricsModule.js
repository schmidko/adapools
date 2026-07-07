import { serializeDocument } from './serializers.js';

export const registerMetricsRoutes = ({ app, collections }) => {
  app.get('/api/cardano/metrics', async (req, res) => {
    try {
      const metrics = await collections.cardanoMetrics.findOne({ _id: 'current' });
      res.json(serializeDocument(metrics) || {});
    } catch (error) {
      console.error('[adapools] Failed to load Cardano metrics:', error);
      res.status(500).json({ error: 'failed_to_load_cardano_metrics' });
    }
  });

  app.get('/api/pools/:poolId/metrics', async (req, res) => {
    try {
      const metrics = await collections.poolMetrics.findOne({
        bech32_pool_id: req.params.poolId
      });
      if (!metrics) {
        res.json(null);
        return;
      }

      const lifetimeBlocks = Number.isFinite(Number(metrics.lifetime_blocks))
        ? Number(metrics.lifetime_blocks)
        : await collections.blocks.countDocuments({
          'pool.bech32_pool_id': req.params.poolId
        });

      res.json(serializeDocument({
        ...metrics,
        lifetime_blocks: lifetimeBlocks,
        total_blocks: lifetimeBlocks
      }));
    } catch (error) {
      console.error('[adapools] Failed to load pool metrics:', error);
      res.status(500).json({ error: 'failed_to_load_pool_metrics' });
    }
  });

  app.get('/api/sync/status', async (req, res) => {
    try {
      const states = await collections.syncState.find({}).toArray();
      res.json(states.map(serializeDocument));
    } catch (error) {
      console.error('[adapools] Failed to load sync status:', error);
      res.status(500).json({ error: 'failed_to_load_sync_status' });
    }
  });
};
