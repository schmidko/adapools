const normalizePoolEntry = (document) => ({
  pool_id: document.bech32_pool_id,
  ticker: document.ticker || null,
  name: document.name || null
});

const DISCOVERY_SORTS = {
  pool: 'ticker',
  active_stake: 'active_stake_numeric',
  delegators: 'delegators_numeric',
  blocks: 'blocks_numeric',
  saturation: 'pool_interest_numeric',
  margin: 'margin_numeric',
  fixed_cost: 'fixed_cost_numeric',
  pledge: 'pledge_numeric',
  registered: 'registered_on'
};

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePage = (value, fallback = 1, max = 500) => {
  const parsed = parseInt(value || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const poolStatus = (pool) => {
  const retiringEpoch = Number(pool.retiring_epoch);
  if (!Number.isFinite(retiringEpoch)) return 'Active';
  return retiringEpoch <= Number(pool.current_epoch || 0) ? 'Retired' : 'Retiring';
};

const normalizeDiscoveryPool = (pool) => ({
  pool_id: pool.bech32_pool_id,
  ticker: pool.ticker || null,
  name: pool.name || null,
  logo: pool.logo || null,
  homepage: pool.website || pool.homepage || null,
  status: poolStatus(pool),
  active_stake_lovelace: pool.active_stake || pool.active_stake_lovelace || '0',
  delegators: Number(pool.delegators_numeric ?? pool.delegators ?? 0),
  lifetime_blocks: Number(pool.blocks_numeric ?? pool.lifetime_blocks ?? pool.blocks ?? 0),
  saturation_percent: Number(pool.pool_interest_numeric ?? pool.saturation_percent ?? 0),
  margin_percent: Number(pool.margin_numeric ?? pool.margin_percent ?? 0) * (Number(pool.margin_numeric ?? pool.margin_percent ?? 0) <= 1 ? 100 : 1),
  fixed_cost_lovelace: pool.fixed_cost || pool.fixed_cost_lovelace || '0',
  pledge_lovelace: pool.pledge || pool.pledge_lovelace || '0',
  registered_on: pool.registered_on || null,
  updated_at: pool.synced_at || pool.updated_at || null
});

const buildDiscoveryQuery = (query) => {
  const filters = [{ bech32_pool_id: { $type: 'string' } }];
  const search = String(query.search || '').trim();
  if (search) {
    const matcher = new RegExp(escapeRegex(search), 'i');
    filters.push({ $or: [{ ticker: matcher }, { name: matcher }, { bech32_pool_id: matcher }] });
  }

  if (query.status === 'active') {
    filters.push({ $or: [{ retiring_epoch: null }, { retiring_epoch: { $exists: false } }] });
  }
  if (query.status === 'retiring') {
    filters.push({ $expr: { $gt: [{ $ifNull: ['$retiring_epoch', -1] }, { $ifNull: ['$current_epoch', Number.MAX_SAFE_INTEGER] }] } });
  }
  if (query.status === 'retired') {
    filters.push({ $expr: { $lte: [{ $ifNull: ['$retiring_epoch', Number.MAX_SAFE_INTEGER] }, { $ifNull: ['$current_epoch', -1] }] } });
  }

  const range = (field, minKey, maxKey, multiplier = 1) => {
    const min = parseNumber(query[minKey]);
    const max = parseNumber(query[maxKey]);
    if (min === null && max === null) return;
    const filter = {};
    if (min !== null) filter.$gte = min * multiplier;
    if (max !== null) filter.$lte = max * multiplier;
    filters.push({ [field]: filter });
  };

  range('active_stake_numeric', 'minStake', 'maxStake', 1_000_000);
  range('delegators_numeric', 'minDelegators', 'maxDelegators');
  range('blocks_numeric', 'minBlocks', 'maxBlocks');
  range('margin_numeric', 'minMargin', 'maxMargin', 0.01);
  range('pool_interest_numeric', 'minSaturation', 'maxSaturation');
  range('fixed_cost_numeric', 'minFixedCost', 'maxFixedCost', 1_000_000);
  range('pledge_numeric', 'minPledge', 'maxPledge', 1_000_000);
  if (query.registeredAfter) filters.push({ registered_on: { $gte: String(query.registeredAfter) } });
  if (query.registeredBefore) filters.push({ registered_on: { $lte: `${String(query.registeredBefore)}T23:59:59Z` } });

  return filters.length === 1 ? filters[0] : { $and: filters };
};

export const registerPoolRoutes = ({ app, collections, postgres }) => {
  app.get('/api/pools/:poolId/delegators', async (req, res) => {
    const page = parsePage(req.query.page, 1, 10_000);
    const limit = Math.min(parsePage(req.query.limit, 50, 100), 100);
    const offset = (page - 1) * limit;

    if (!postgres?.isConfigured) {
      res.status(503).json({ error: 'delegator_data_unavailable' });
      return;
    }

    try {
      const result = await postgres.query(
        `
          WITH latest_epoch AS (
            SELECT COALESCE(MAX(epoch_no), 0) AS epoch_no FROM epoch_stake
          ),
          delegators AS (
            SELECT
              es.addr_id,
              sa.view AS stake_address,
              es.amount::text AS stake_lovelace,
              SUM(es.amount) OVER ()::text AS pool_stake_lovelace,
              ((es.amount::numeric / NULLIF(SUM(es.amount) OVER (), 0)) * 100)::text AS pool_share_percent,
              COUNT(*) OVER ()::integer AS total,
              ROW_NUMBER() OVER (ORDER BY es.amount DESC, sa.view ASC)::integer AS rank
            FROM epoch_stake es
            JOIN latest_epoch le ON le.epoch_no = es.epoch_no
            JOIN pool_hash ph ON ph.id = es.pool_id
            JOIN stake_address sa ON sa.id = es.addr_id
            WHERE ph.view = $1
          )
          SELECT
            delegators.*,
            last_delegation.active_epoch_no AS active_since_epoch,
            last_delegation.delegated_at,
            encode(last_delegation.tx_hash, 'hex') AS delegation_tx_hash
          FROM delegators
          LEFT JOIN LATERAL (
            SELECT d.active_epoch_no, b.time AS delegated_at, t.hash AS tx_hash
            FROM delegation d
            JOIN tx t ON t.id = d.tx_id
            JOIN block b ON b.id = t.block_id
            WHERE d.addr_id = delegators.addr_id
              AND d.pool_hash_id = (SELECT id FROM pool_hash WHERE view = $1 LIMIT 1)
            ORDER BY b.block_no DESC NULLS LAST, t.id DESC, d.cert_index DESC
            LIMIT 1
          ) last_delegation ON true
          ORDER BY delegators.rank
          LIMIT $2 OFFSET $3;
        `,
        [req.params.poolId, limit, offset]
      );

      const rows = result.rows || [];
      const total = rows.length ? Number(rows[0].total) : 0;
      res.json({
        delegators: rows.map(({ total: ignored, addr_id: ignoredAddressId, ...delegator }) => delegator),
        total,
        page,
        limit
      });
    } catch (error) {
      console.error('[adapools] Failed to load pool delegators:', error);
      res.status(500).json({ error: 'failed_to_load_pool_delegators' });
    }
  });

  app.get('/api/pools/discover', async (req, res) => {
    try {
      const page = parsePage(req.query.page);
      const limit = Math.min(parsePage(req.query.limit, 50, 100), 100);
      const sortBy = DISCOVERY_SORTS[req.query.sortBy] ? req.query.sortBy : 'active_stake';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const query = buildDiscoveryQuery(req.query);
      const sort = { [DISCOVERY_SORTS[sortBy]]: sortOrder, bech32_pool_id: 1 };
      const [pools, total] = await Promise.all([
        collections.poolCache.find(query).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
        collections.poolCache.countDocuments(query)
      ]);
      res.json({
        pools: pools.map(normalizeDiscoveryPool),
        total,
        page,
        limit,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      });
    } catch (error) {
      console.error('[adapools] Failed to load pool discovery:', error);
      res.status(500).json({ error: 'failed_to_load_pool_discovery' });
    }
  });

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
