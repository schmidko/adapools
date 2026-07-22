import { MongoClient } from 'mongodb';

export const createMongo = async () => {
  const mongoConfig = {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || '27017'),
    user: process.env.MONGO_USER || '',
    password: String(process.env.MONGO_PASSWORD || ''),
    database: process.env.MONGO_DB || 'adablox',
    authSource: process.env.MONGO_AUTH_SOURCE || 'admin'
  };
  const mongoAuth = mongoConfig.user
    ? `${encodeURIComponent(mongoConfig.user)}:${encodeURIComponent(mongoConfig.password)}@`
    : '';
  const mongoQueryParams = [];
  if (mongoConfig.authSource) {
    mongoQueryParams.push(`authSource=${encodeURIComponent(mongoConfig.authSource)}`);
  }
  const mongoQueryString = mongoQueryParams.length ? `?${mongoQueryParams.join('&')}` : '';
  const mongoUri = process.env.MONGODB_URI ||
    `mongodb://${mongoAuth}${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database}${mongoQueryString}`;

  const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(mongoConfig.database);
  const collections = {
    blocks: db.collection('adapools_blocks'),
    cardanoMetrics: db.collection('adapools_cardano_metrics'),
    poolCache: db.collection('pool_cache'),
    poolMetrics: db.collection('adapools_pool_metrics'),
    poolTimelineEvents: db.collection('adapools_pool_timeline_events'),
    poolRecentBlocks: db.collection('adapools_pool_recent_blocks'),
    poolAdBookings: db.collection('adapools_pool_ad_bookings'),
    poolAdSlotLocks: db.collection('adapools_pool_ad_slot_locks'),
    syncState: db.collection('adapools_sync_state')
  };

  await Promise.all([
    collections.poolAdBookings.createIndex({ status: 1, expires_at: 1 }),
    collections.poolAdBookings.createIndex({ tx_hash: 1 }, { unique: true, sparse: true }),
    collections.poolCache.createIndex({ active_stake_numeric: -1 }),
    collections.poolCache.createIndex({ delegators_numeric: -1 }),
    collections.poolCache.createIndex({ blocks_numeric: -1 }),
    collections.poolCache.createIndex({ pool_interest_numeric: -1 }),
    collections.poolCache.createIndex({ registered_on: -1 })
  ]);

  return {
    client,
    db,
    collections
  };
};
