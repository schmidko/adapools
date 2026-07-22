import { randomBytes, randomUUID } from 'crypto';

const SLOT_IDS = ['header-1', 'header-2'];
const LOVELACE_PER_ADA = 1_000_000;
const DAILY_PRICE_LOVELACE = LOVELACE_PER_ADA;
const MIN_DAYS = 1;
const MAX_DAYS = 30;
const QUOTE_LIFETIME_MS = 15 * 60 * 1000;
const METADATA_LABEL = 674;
const quoteRequests = new Map();
const verificationRequests = new Map();

const isEnabled = () => process.env.POOL_ADS_ENABLED === 'true';
const paymentAddress = () => String(process.env.POOL_ADS_PAYMENT_ADDRESS || '').trim();
const getNow = () => new Date();
const toIso = (value) => value instanceof Date ? value.toISOString() : value;

const serializeBooking = (booking) => {
  if (!booking) return null;
  return {
    id: booking._id,
    slot_id: booking.slot_id,
    pool: booking.pool,
    status: booking.status,
    starts_at: toIso(booking.starts_at),
    expires_at: toIso(booking.expires_at),
    created_at: toIso(booking.created_at)
  };
};

const serializeQuote = (booking) => ({
  id: booking._id,
  slot_id: booking.slot_id,
  pool: booking.pool,
  days: booking.days,
  amount_lovelace: booking.amount_lovelace,
  amount_ada: booking.days,
  payment_address: paymentAddress(),
  metadata_label: METADATA_LABEL,
  payment_reference: booking.payment_reference,
  quote_expires_at: toIso(booking.quote_expires_at)
});

const releaseExpiredBookings = async (collections) => {
  const now = getNow();
  await collections.poolAdBookings.updateMany(
    {
      status: { $in: ['awaiting_payment', 'active'] },
      $or: [
        { quote_expires_at: { $lte: now } },
        { expires_at: { $lte: now } }
      ]
    },
    { $set: { status: 'expired', expired_at: now } }
  );
  await collections.poolAdSlotLocks.deleteMany({ locked_until: { $lte: now } });
};

const findPool = async (collections, poolId) => {
  const query = { bech32_pool_id: poolId };
  const [cached, metrics] = await Promise.all([
    collections.poolCache.findOne(query, { projection: { _id: 0, bech32_pool_id: 1, ticker: 1, name: 1, description: 1, logo: 1 } }),
    collections.poolMetrics.findOne(query, { projection: { _id: 0, bech32_pool_id: 1, ticker: 1, name: 1, description: 1, logo: 1, retiring_epoch: 1 } })
  ]);
  const pool = { ...cached, ...metrics };
  if (!pool.bech32_pool_id || pool.retiring_epoch != null) return null;
  return {
    pool_id: pool.bech32_pool_id,
    ticker: pool.ticker || null,
    name: pool.name || null,
    description: pool.description || null,
    logo: pool.logo || null
  };
};

const buildPoolSearchQuery = (query) => {
  const text = String(query || '').trim();
  if (!text) return { bech32_pool_id: { $type: 'string' } };
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(escaped, 'i');
  return {
    bech32_pool_id: { $type: 'string' },
    $or: [{ ticker: matcher }, { name: matcher }, { bech32_pool_id: matcher }]
  };
};

const verifyPayment = async ({ postgres, booking, txHash }) => {
  const result = await postgres.query(
    `SELECT
      EXISTS (
        SELECT 1
        FROM tx
        JOIN tx_out ON tx_out.tx_id = tx.id
        WHERE encode(tx.hash, 'hex') = $1
          AND tx_out.address = $2
          AND tx_out.value = $3::bigint
      ) AS has_expected_output,
      EXISTS (
        SELECT 1
        FROM tx
        JOIN tx_metadata ON tx_metadata.tx_id = tx.id
        WHERE encode(tx.hash, 'hex') = $1
          AND tx_metadata.key = $4::bigint
          AND CAST(tx_metadata.json AS text) LIKE '%' || $5 || '%'
      ) AS has_payment_reference`,
    [txHash, paymentAddress(), String(booking.amount_lovelace), METADATA_LABEL, booking.payment_reference]
  );
  const row = result.rows[0] || {};
  return Boolean(row.has_expected_output && row.has_payment_reference);
};

const requireEnabled = (postgres) => (req, res, next) => {
  if (!isEnabled()) return res.status(404).json({ error: 'pool_ads_disabled' });
  if (!paymentAddress() || !postgres.isConfigured) return res.status(503).json({ error: 'pool_ads_not_configured' });
  return next();
};

const createRateLimit = (store, limit, windowMs) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = (store.get(key) || []).filter((timestamp) => timestamp > now - windowMs);
  if (current.length >= limit) return res.status(429).json({ error: 'pool_ads_rate_limited' });
  current.push(now);
  store.set(key, current);
  return next();
};

export const registerPoolAdRoutes = ({ app, collections, postgres }) => {
  const isConfigured = () => Boolean(paymentAddress() && postgres.isConfigured);
  const requireConfigured = requireEnabled(postgres);
  const expire = () => releaseExpiredBookings(collections).catch((error) => {
    console.error('[adapools] Failed to expire pool ads:', error);
  });
  const expiryTimer = setInterval(expire, 60_000);
  expiryTimer.unref?.();

  app.get('/api/pool-ads/status', (req, res) => {
    res.json({
      enabled: isEnabled(),
      configured: isConfigured(),
      daily_price_lovelace: DAILY_PRICE_LOVELACE,
      daily_price_ada: 1,
      slots: SLOT_IDS
    });
  });

  app.get('/api/pool-ads/slots', async (req, res) => {
    if (!isEnabled()) return res.json({ enabled: false, slots: [] });
    try {
      await releaseExpiredBookings(collections);
      const bookings = await collections.poolAdBookings.find({
        status: 'active',
        expires_at: { $gt: getNow() }
      }).toArray();
      const bySlot = new Map(bookings.map((booking) => [booking.slot_id, booking]));
      return res.json({
        enabled: true,
        slots: SLOT_IDS.map((slotId) => ({
          slot_id: slotId,
          booking: serializeBooking(bySlot.get(slotId))
        }))
      });
    } catch (error) {
      console.error('[adapools] Failed to load pool ad slots:', error);
      return res.status(500).json({ error: 'failed_to_load_pool_ads' });
    }
  });

  app.get('/api/pool-ads/pools', requireConfigured, async (req, res) => {
    try {
      const documents = await collections.poolCache
        .find(buildPoolSearchQuery(req.query.query), {
          projection: { _id: 0, bech32_pool_id: 1, ticker: 1, name: 1, description: 1, logo: 1 }
        })
        .sort({ ticker: 1, name: 1 })
        .limit(30)
        .toArray();
      return res.json(documents.map((pool) => ({
        pool_id: pool.bech32_pool_id,
        ticker: pool.ticker || null,
        name: pool.name || null,
        description: pool.description || null,
        logo: pool.logo || null
      })));
    } catch (error) {
      console.error('[adapools] Failed to search pool ads:', error);
      return res.status(500).json({ error: 'failed_to_search_pools' });
    }
  });

  app.post('/api/pool-ads/quotes', requireConfigured, createRateLimit(quoteRequests, 10, 15 * 60 * 1000), async (req, res) => {
    try {
      const poolId = String(req.body?.pool_id || '');
      const slotId = String(req.body?.slot_id || '');
      const days = Number(req.body?.days);
      if (!SLOT_IDS.includes(slotId) || !Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
        return res.status(400).json({ error: 'invalid_pool_ad_quote' });
      }

      await releaseExpiredBookings(collections);
      const pool = await findPool(collections, poolId);
      if (!pool) return res.status(404).json({ error: 'pool_not_available_for_ads' });

      const now = getNow();
      const quoteExpiresAt = new Date(now.getTime() + QUOTE_LIFETIME_MS);
      const bookingId = randomUUID();
      const lock = await collections.poolAdSlotLocks.findOneAndUpdate(
        {
          _id: slotId,
          $or: [{ locked_until: { $lte: now } }, { locked_until: { $exists: false } }]
        },
        {
          $set: { booking_id: bookingId, locked_until: quoteExpiresAt, updated_at: now },
          $setOnInsert: { slot_id: slotId }
        },
        { upsert: true, returnDocument: 'after' }
      );
      if (lock?.booking_id !== bookingId) {
        return res.status(409).json({ error: 'pool_ad_slot_unavailable' });
      }

      const booking = {
        _id: bookingId,
        slot_id: slotId,
        pool,
        days,
        amount_lovelace: days * DAILY_PRICE_LOVELACE,
        payment_reference: `adapools:${bookingId}:${randomBytes(6).toString('hex')}`,
        status: 'awaiting_payment',
        quote_expires_at: quoteExpiresAt,
        created_at: now,
        updated_at: now
      };
      await collections.poolAdBookings.insertOne(booking);
      return res.status(201).json(serializeQuote(booking));
    } catch (error) {
      console.error('[adapools] Failed to create pool ad quote:', error);
      if (error?.code === 11000) return res.status(409).json({ error: 'pool_ad_slot_unavailable' });
      return res.status(500).json({ error: 'failed_to_create_pool_ad_quote' });
    }
  });

  app.post('/api/pool-ads/verify', requireConfigured, createRateLimit(verificationRequests, 30, 15 * 60 * 1000), async (req, res) => {
    try {
      const bookingId = String(req.body?.booking_id || '');
      const txHash = String(req.body?.tx_hash || '').toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(txHash)) return res.status(400).json({ error: 'invalid_transaction_hash' });
      await releaseExpiredBookings(collections);
      const booking = await collections.poolAdBookings.findOne({ _id: bookingId });
      if (!booking) return res.status(404).json({ error: 'pool_ad_booking_not_found' });
      if (booking.status === 'active') return res.json({ booking: serializeBooking(booking) });
      if (booking.status !== 'awaiting_payment') return res.status(409).json({ error: 'pool_ad_booking_not_payable' });

      const validPayment = await verifyPayment({ postgres, booking, txHash });
      if (!validPayment) return res.status(422).json({ error: 'pool_ad_payment_not_verified' });

      const now = getNow();
      const expiresAt = new Date(now.getTime() + booking.days * 24 * 60 * 60 * 1000);
      await collections.poolAdBookings.updateOne(
        { _id: bookingId, status: 'awaiting_payment' },
        {
          $set: {
            status: 'active',
            tx_hash: txHash,
            starts_at: now,
            expires_at: expiresAt,
            activated_at: now,
            updated_at: now
          },
          $unset: { quote_expires_at: '' }
        }
      );
      await collections.poolAdSlotLocks.updateOne(
        { _id: booking.slot_id, booking_id: bookingId },
        { $set: { locked_until: expiresAt, updated_at: now } }
      );
      const activeBooking = await collections.poolAdBookings.findOne({ _id: bookingId });
      return res.json({ booking: serializeBooking(activeBooking) });
    } catch (error) {
      console.error('[adapools] Failed to verify pool ad payment:', error);
      if (error?.code === 11000) return res.status(409).json({ error: 'pool_ad_payment_already_claimed' });
      const status = error.status === 404 ? 422 : 500;
      return res.status(status).json({ error: status === 422 ? 'pool_ad_payment_not_verified' : 'failed_to_verify_pool_ad_payment' });
    }
  });
};
