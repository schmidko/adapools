import { parseLimit, serializeBlock, serializeDocument } from './serializers.js';

export const registerBlockRoutes = ({ app, collections }) => {
  app.get('/api/blocks/latest', async (req, res) => {
    try {
      const limit = parseLimit(req.query.limit);
      const blocks = await collections.blocks
        .find({})
        .sort({ block_no: -1 })
        .limit(limit)
        .toArray();
      res.json(blocks.map(serializeBlock));
    } catch (error) {
      console.error('[adapools] Failed to load latest blocks:', error);
      res.status(500).json({ error: 'failed_to_load_blocks' });
    }
  });

  app.get('/api/pools/:poolId/recent-blocks', async (req, res) => {
    try {
      const document = await collections.poolRecentBlocks.findOne({
        bech32_pool_id: req.params.poolId
      });
      res.json(serializeDocument(document) || {
        bech32_pool_id: req.params.poolId,
        blocks: []
      });
    } catch (error) {
      console.error('[adapools] Failed to load pool recent blocks:', error);
      res.status(500).json({ error: 'failed_to_load_pool_recent_blocks' });
    }
  });

  app.get('/api/pools/:poolId/blocks', async (req, res) => {
    try {
      const limit = parseLimit(req.query.limit);
      const query = { 'pool.bech32_pool_id': req.params.poolId };
      const beforeBlockNo = parseInt(req.query.beforeBlockNo || '');
      if (Number.isFinite(beforeBlockNo)) {
        query.block_no = { $lt: beforeBlockNo };
      }

      const blocks = await collections.blocks
        .find(query)
        .sort({ block_no: -1 })
        .limit(limit)
        .toArray();
      res.json(blocks.map(serializeBlock));
    } catch (error) {
      console.error('[adapools] Failed to load pool blocks:', error);
      res.status(500).json({ error: 'failed_to_load_pool_blocks' });
    }
  });

  app.get('/api/pools/:poolId/timeline', async (req, res) => {
    try {
      const limit = parseLimit(req.query.limit, 20, 60);
      const beforeTime = req.query.beforeTime ? new Date(req.query.beforeTime) : null;
      const timeQuery = beforeTime && Number.isFinite(beforeTime.getTime())
        ? { time: { $lt: beforeTime } }
        : {};
      const blockQuery = {
        'pool.bech32_pool_id': req.params.poolId,
        ...timeQuery
      };
      const eventQuery = {
        bech32_pool_id: req.params.poolId,
        ...timeQuery
      };

      const [blocks, events] = await Promise.all([
        collections.blocks
          .find(blockQuery)
          .sort({ time: -1, block_no: -1 })
          .limit(limit)
          .toArray(),
        collections.poolTimelineEvents
          .find(eventQuery)
          .sort({ time: -1, block_no: -1 })
          .limit(limit)
          .toArray()
      ]);

      const timeline = [
        ...blocks.map((block) => ({ kind: 'block', ...serializeBlock(block) })),
        ...events.map((event) => ({ kind: event.type, ...serializeDocument(event) }))
      ]
        .sort((a, b) => {
          const timeDiff = new Date(b.time).getTime() - new Date(a.time).getTime();
          if (timeDiff !== 0) return timeDiff;
          return Number(b.block_no || 0) - Number(a.block_no || 0);
        })
        .slice(0, limit);

      res.json(timeline);
    } catch (error) {
      console.error('[adapools] Failed to load pool timeline:', error);
      res.status(500).json({ error: 'failed_to_load_pool_timeline' });
    }
  });
};
