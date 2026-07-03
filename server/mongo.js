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

  return {
    client,
    db,
    collections: {
      blocks: db.collection('adapools_blocks'),
      cardanoMetrics: db.collection('adapools_cardano_metrics'),
      poolMetrics: db.collection('adapools_pool_metrics'),
      poolRecentBlocks: db.collection('adapools_pool_recent_blocks'),
      syncState: db.collection('adapools_sync_state')
    }
  };
};
