import pg from 'pg';

const getConnectionString = () => String(
  process.env.ADAPOOLS_DATABASE_URL || process.env.DATABASE_URL || ''
).trim();

export const createPostgres = () => {
  const connectionString = getConnectionString();
  const pool = connectionString
    ? new pg.Pool({ connectionString, max: 2, idleTimeoutMillis: 30_000 })
    : null;

  return {
    isConfigured: Boolean(pool),
    query: (...args) => {
      if (!pool) throw new Error('Postgres is not configured for pool ad verification');
      return pool.query(...args);
    },
    close: () => pool?.end() || Promise.resolve()
  };
};
