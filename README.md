# adapools

`adapools` is a new Cardano pool explorer project in the Blox project family.
Functionally, it is inspired by `pool.pm`, but it is implemented within the
existing Blox architecture: modern JavaScript, React/Vite in the frontend,
Node.js/Express in the backend, MongoDB as the only data source for the web
backend, and Postgres/db-sync only in aggregation services.

## Target State

- The home page shows current Cardano network metrics at the top.
- Below that, a block ticker displays recently found blocks as square tiles.
- Each block tile shows:
  - block number
  - pool ticker or pool identity
  - ADA volume
  - transaction count
  - fees
  - block fullness percentage
- Pool detail pages always show pool metrics at the top.
- Below that, pool detail pages use the same block tile representation, filtered
  to the latest blocks for that pool.
- The home page receives new blocks through WebSocket with a target delay of no
  more than 15 seconds.
- Pool detail pages may be delayed by up to 60 seconds.

## Repositories And Responsibilities

### `adapools`

Contains the web app:

- fully React-based Vite frontend
- Node.js/Express backend
- WebSocket server for new home-page blocks
- read-only access to MongoDB
- no direct access to the chain-synced Postgres database

### `adablox-workers`

Extended with event-driven jobs from Postgres/db-sync to MongoDB:

- update Cardano network metrics
- update pool metrics
- enrich new blocks reported by the indexer and write normalized block documents
  to MongoDB
- after each new block, update the corresponding pool specifically
- reuse existing pool metadata from `pool_cache`
- maintain status and lag metadata

### `adablox-indexer`

The indexer is the fast trigger for new blocks. As soon as it sees a new block,
it creates a small `adapools` block event or a queue job. The job contains at
least the block number, slot, hash, time, and pool ID. After that,
`adablox-workers` handles enrichment from db-sync/Postgres and writes the result
to MongoDB.

## Technical Stack

- Language: JavaScript ES6+, no TypeScript
- Frontend: React, Vite, React Router
- UI: Ant Design in the latest stable major version, `@ant-design/icons`,
  TailwindCSS for layout utilities and targeted additions
- Theme: light and dark mode, switchable with a toggle button in the header
- Backend: Node.js, Express
- Realtime: `ws` or `socket.io`; prefer `ws` if only server-push for new blocks
  is needed
- Web database: MongoDB
- Aggregation data source: Postgres/db-sync `cexplorer`

## Proposed Project Structure

```text
adapools/
  AGENTS.md
  README.md
  package.json
  index.html
  vite.config.js
  postcss.config.js
  tailwind.config.js
  eslint.config.js
  config/
    env-example
  server/
    index.js
    mongo.js
    blockModule.js
    metricsModule.js
    websocketModule.js
  src/
    main.jsx
    App.jsx
    index.css
    api/
      client.js
    components/
      AppHeader.jsx
      BlockTicker.jsx
      BlockTile.jsx
      MetricsBar.jsx
      PoolIdentity.jsx
      SyncStatus.jsx
      ThemeToggle.jsx
    context/
      ThemeContext.jsx
    pages/
      HomePage.jsx
      PoolPage.jsx
      NotFoundPage.jsx
    utils/
      format.js
```

## MongoDB Collections

All numbers representing Lovelace or large chain values are stored as strings
and formatted carefully in the frontend.

Important: Existing pool data from `adablox` is reused. In particular, off-chain
metadata, tickers, names, homepages, logos, and logo scrape results are not
scraped again for `adapools`. `adapools` reads this information from the existing
`pool_cache` collection and only stores the snapshots required for fast block
and detail pages in its own collections.

### `adapools_blocks`

One document per block.

```js
{
  block_no: 11700000,
  hash: "...",
  slot_no: 154000000,
  epoch_no: 560,
  epoch_slot_no: 12345,
  time: "2026-07-03T12:34:56Z",
  tx_count: 42,
  size: 54321,
  max_block_size: 90112,
  fullness_percent: 60.3,
  total_output_lovelace: "123456789000",
  total_fees_lovelace: "1234567",
  pool: {
    bech32_pool_id: "pool1...",
    hex_pool_id: "...",
    ticker: "BLOX",
    name: "Ada Blox",
    homepage: "https://...",
    logo: null
  },
  created_at: "2026-07-03T12:35:03Z",
  synced_at: "2026-07-03T12:35:03Z"
}
```

Indexes:

- `{ block_no: -1 }` unique
- `{ time: -1 }`
- `{ "pool.bech32_pool_id": 1, block_no: -1 }`
- `{ synced_at: -1 }`

### `adapools_pool_recent_blocks`

One optimized document per pool for the pool detail page. This document is
updated by the block worker whenever the pool finds a new block and contains
only the latest N blocks, for example 240. This allows the detail page to load
with a single MongoDB lookup.

```js
{
  bech32_pool_id: "pool1...",
  hex_pool_id: "...",
  pool: {
    ticker: "BLOX",
    name: "Ada Blox",
    logo: null
  },
  latest_block_no: 11700000,
  latest_block_time: "2026-07-03T12:34:56Z",
  blocks: [
    {
      block_no: 11700000,
      hash: "...",
      slot_no: 154000000,
      epoch_no: 560,
      time: "2026-07-03T12:34:56Z",
      tx_count: 42,
      size: 54321,
      max_block_size: 90112,
      fullness_percent: 60.3,
      total_output_lovelace: "123456789000",
      total_fees_lovelace: "1234567"
    }
  ],
  block_count_cached: 240,
  updated_at: "2026-07-03T12:35:03Z"
}
```

Indexes:

- `{ bech32_pool_id: 1 }` unique
- `{ latest_block_no: -1 }`
- `{ updated_at: -1 }`

### `adapools_cardano_metrics`

A snapshot document with `_id: "current"`.

```js
{
  _id: "current",
  current_epoch: 560,
  latest_block_no: 11700000,
  latest_block_time: "2026-07-03T12:34:56Z",
  active_pools: 3000,
  total_pools: 3600,
  total_stake_lovelace: "23000000000000000",
  circulating_supply_lovelace: "35000000000000000",
  tx_count_24h: 50000,
  fees_24h_lovelace: "12000000000",
  avg_block_fullness_1h: 47.2,
  updated_at: "2026-07-03T12:35:05Z"
}
```

Index:

- `{ updated_at: -1 }`

### `adapools_pool_metrics`

One document per pool.

```js
{
  bech32_pool_id: "pool1...",
  hex_pool_id: "...",
  ticker: "BLOX",
  name: "Ada Blox",
  description: "...",
  homepage: "https://...",
  logo: null,
  active_stake_lovelace: "123456789000000",
  live_stake_lovelace: "123456789000000",
  delegators: 1234,
  pledge_lovelace: "500000000000",
  active_pledge_lovelace: "500000000000",
  margin_percent: 1.5,
  fixed_cost_lovelace: "340000000",
  lifetime_blocks: 12345,
  blocks_24h: 12,
  blocks_epoch: 220,
  saturation_percent: 63.1,
  retiring_epoch: null,
  updated_at: "2026-07-03T12:35:05Z"
}
```

The fields `ticker`, `name`, `description`, `homepage`, and `logo` come from the
existing `pool_cache` collection. The pool metrics worker only calculates the
numbers needed by `adapools` or writes an optimized snapshot. It does not start
its own logo or metadata scraper.

Indexes:

- `{ bech32_pool_id: 1 }` unique
- `{ ticker: 1 }`
- `{ active_stake_lovelace_numeric: -1 }` optional for sorting
- `{ updated_at: -1 }`

### `adapools_sync_state`

Status for aggregators and API diagnostics.

```js
{
  _id: "blocks",
  last_block_no: 11700000,
  last_postgres_seen_at: "2026-07-03T12:34:56Z",
  last_mongo_write_at: "2026-07-03T12:35:03Z",
  lag_seconds: 7,
  updated_at: "2026-07-03T12:35:03Z"
}
```

## Postgres/db-sync Aggregation

Aggregation is implemented in `adablox-workers` so the web backend does not need
Postgres access.

### New Block Flow

The preferred flow is event-driven:

1. `adablox-indexer` detects a new block through ChainSync.
2. The indexer writes a small event to MongoDB, for example
   `adapools_block_events`, or creates a worker queue job.
3. `adablox-workers` starts a block worker for this event.
4. The worker reads the missing detail data from Postgres/db-sync.
5. The worker merges pool metadata from `pool_cache`.
6. The worker writes the block to `adapools_blocks`.
7. The worker updates `adapools_pool_recent_blocks` for exactly this pool.
8. The worker updates `adapools_pool_metrics` for exactly this pool.
9. The `adapools` backend detects the new MongoDB block through a Change Stream
   or lightweight fallback polling and pushes it to connected frontend clients
   through WebSocket.

This makes the found block visible in the frontend immediately, while pool
detail data is refreshed shortly afterward and only for the affected pool.

### Block Worker

Trigger: a new block from the indexer. Fallback: a short polling job if an event
is lost or the indexer trigger is temporarily disabled.

Tasks:

1. Read the block event from the indexer.
2. Load the block from Postgres by `block_no`, `hash`, or `slot_no`.
3. For each block, join transaction count, output sum, fee sum, block size, slot
   leader, and pool ID.
4. Determine `max_block_size` from the current protocol parameters.
5. Calculate `fullness_percent = size / max_block_size * 100`.
6. Merge pool metadata from the existing MongoDB collection `pool_cache`.
7. Write documents to `adapools_blocks` with `bulkWrite(..., { upsert: true })`.
8. For every affected pool, update `adapools_pool_recent_blocks` with `$push`,
   `$each`, `$position: 0`, and `$slice` so only the latest N blocks per pool are
   stored in the optimized detail-page format.
9. Start a targeted pool metrics refresh for the affected pool.
10. Update sync state.

Target: A new block is visible in the frontend no later than 15 seconds after
detection by the indexer. Pool metrics may be updated afterward, but should be
fresh for detail pages within 60 seconds.

### Cardano Metrics Aggregator

Run interval: every 30 seconds.

Tasks:

- latest block number and block time
- current epoch
- active pools
- total stake
- 24h transactions
- 24h fees
- average block fullness over the last hour

The result is replaced as `_id: "current"` in `adapools_cardano_metrics`.

### Pool Metrics Worker

Trigger: specifically after a new block for the affected pool. Fallback:
periodic full or partial refresh, for example every 60 seconds for pools with new
blocks or stale metrics.

Tasks:

- reuse pool master data and off-chain metadata from the existing `pool_cache`
- calculate stake, delegators, pledge, margin, and fixed cost
- calculate lifetime, 24h, and epoch block counters
- calculate saturation
- set retiring status

Existing logic from `adablox-workers/src/poolModule.js` should be reused or
extracted into shared helpers so pool definitions and metadata remain consistent.
`adapools` must not scrape metadata again; it consumes the existing cache.

### Block Event Collection Or Queue

If MongoDB is used as a simple queue:

```js
{
  _id: "...",
  block_no: 11700000,
  hash: "...",
  slot_no: 154000000,
  time: "2026-07-03T12:34:56Z",
  bech32_pool_id: "pool1...",
  status: "pending",
  attempts: 0,
  created_at: "2026-07-03T12:34:57Z",
  started_at: null,
  finished_at: null,
  error: null
}
```

Indexes:

- `{ status: 1, created_at: 1 }`
- `{ block_no: 1 }` unique

## Backend API

The `adapools` backend only reads from MongoDB.

### REST

```text
GET /api/health
GET /api/cardano/metrics
GET /api/blocks/latest?limit=120
GET /api/pools/:poolId/metrics
GET /api/pools/:poolId/blocks?limit=120&beforeBlockNo=11700000
GET /api/pools/:poolId/recent-blocks
GET /api/sync/status
```

Details:

- `poolId` accepts at least `pool1...`; ticker search or hex ID may be added
  later.
- Enforce a hard `limit`, for example a maximum of 240 blocks.
- Responses already provide normalized field names for the frontend.
- Do not add Postgres fallbacks to the backend.
- `GET /api/pools/:poolId/recent-blocks` preferably reads
  `adapools_pool_recent_blocks`, so detail pages can load without expensive
  block queries.

### WebSocket

Path: `/ws/blocks`

Server behavior:

- The client connects from the home page.
- The server initially sends either the latest N blocks or just a
  `connected`/`snapshot` status.
- The server preferably uses MongoDB Change Streams on `adapools_blocks` if
  MongoDB runs as a replica set.
- Fallback: every 3 to 5 seconds, the server checks `adapools_blocks` for new
  `block_no` values.
- New blocks are sent as events:

```js
{
  type: "block.created",
  block: { /* normalized block document */ }
}
```

MongoDB Change Streams are the preferred push mechanism between MongoDB and the
backend. Polling remains as a robust fallback if Change Streams are unavailable
in the current MongoDB environment.

## Frontend

The entire frontend is implemented as a React application. Only functional
components and hooks are used. Ant Design is the primary UI framework; new
components should first be implemented with Ant Design building blocks and only
use TailwindCSS/vanilla CSS where layout, ticker behavior, or block tiles need
project-specific fine control.

### Theme System

- Ant Design is configured centrally through `ConfigProvider`.
- The current mode is stored in a `ThemeContext`.
- `ThemeToggle` is placed in `AppHeader` and switches between light and dark
  mode.
- The mode is saved in `localStorage`.
- If no saved setting exists, the browser's `prefers-color-scheme` is used as
  the initial value.
- Ant Design tokens are maintained for both modes so tiles, tables, buttons,
  tooltips, and the header feel consistent.
- CSS variables for project-specific surfaces such as block tiles are derived
  from the active theme.

### Home Page

Components:

- `MetricsBar`: compact Cardano metrics at the very top
- `BlockTicker`: horizontal, responsive grid/ticker band
- `BlockTile`: square tile for one block
- `SyncStatus`: subtle status indicator for stale data

Behavior:

- Initial data is loaded through `GET /api/cardano/metrics` and
  `GET /api/blocks/latest`.
- WebSocket prepends new blocks to the list.
- If the WebSocket disconnects, reconnect automatically with backoff.
- Fallback polling every 15 seconds if WebSocket is unavailable.

### Pool Detail Page

Route:

```text
/pool/:poolId
```

Components:

- `MetricsBar` with pool metrics
- `PoolIdentity` for name, ticker, logo, and pool ID
- `BlockTicker` with pool blocks

Behavior:

- Load data through REST.
- Refresh every 60 seconds.
- No WebSocket required.
- Prepare pagination or "load more" through `beforeBlockNo`.

### Design

- Block tiles are true squares with stable `aspect-ratio: 1 / 1`.
- Color may signal pool, fullness, or age, but must not be the only carrier of
  information.
- The most important numbers must remain readable on mobile: block number,
  ticker, transaction count, fees, and fullness.
- Long pool names are shortened; ticker and pool ID get tooltips.
- The home page is the application itself, not a landing page.

## Block Tile Data Format In The Frontend

```js
{
  blockNo: 11700000,
  time: "2026-07-03T12:34:56Z",
  poolId: "pool1...",
  poolTicker: "BLOX",
  poolName: "Ada Blox",
  ada: "123456.789",
  txCount: 42,
  feesAda: "1.234567",
  fullnessPercent: 60.3
}
```

## Error And Lag Handling

- If `adapools_sync_state.lag_seconds > 60`, the home page shows a subtle notice
  that data is delayed.
- If MongoDB is empty, the API returns empty lists plus `sync` status, not 500.
- The aggregator writes idempotently through `block_no` upserts.
- The backend validates limits and pool IDs.
- Worker logs include the number of blocks read and written for each run.

## Implementation Phases

### Phase 1: Project Skeleton

- Status: implemented.
- Create `package.json`, Vite, React, Express, and MongoDB connection.
- Install the latest stable Ant Design version and `@ant-design/icons`.
- Define `config/env-example`.
- Set up the global Ant Design `ConfigProvider` and `ThemeContext`.
- Add a header with light/dark `ThemeToggle`.
- Build shared formatting helpers for ADA, percentages, dates, and compact
  numbers.
- Add base routes and empty pages.

### Phase 2: Mongo Schema And Indexes

- Status: implemented in the worker collector; sample data still open.
- Finalize MongoDB collection names.
- Define existing `pool_cache` fields as the source for pool metadata.
- Implement index creation in the worker or a separate deploy script.
- Load sample documents locally.
- Build backend REST against sample data.

### Phase 3: Indexer Trigger And Worker

- Status: implemented as additive worker/indexer extension behind feature flags.
- Extend `adablox-indexer` with a minimal `adapools` block event.
- Extend `adablox-workers` with `adapools` modules.
- Implement a block worker for indexer events.
- Implement the block worker with a `pool_cache` join for pool metadata.
- Maintain `adapools_pool_recent_blocks` as an optimized per-pool block cache.
- Implement the Cardano metrics aggregator with a 30s interval.
- Start the pool metrics worker after every new block for the affected pool.
- Add a fallback scanner for lost block events or stale pools.
- Add sync state and lag measurement.

### Phase 4: Backend

- Status: implemented.
- Implement the Express server with only a MongoDB connection.
- Build REST endpoints for metrics and block lists.
- Implement WebSocket `/ws/blocks` with MongoDB Change Stream and polling
  fallback.
- Provide health and sync endpoints.

### Phase 5: Frontend

- Status: implemented.
- Build the home page with Cardano metrics and block ticker.
- Integrate WebSocket including reconnect and polling fallback.
- Build the pool detail page with pool metrics and pool block list.
- Verify light and dark mode for all views, tiles, header, and loading states.
- Verify responsive styling and stable tile sizes.

### Phase 6: Verification

- Test local MongoDB sample data.
- Run workers against local db-sync sample Postgres data.
- Test API responses for empty, normal, and delayed data.
- Verify that no new pool metadata or logo scrapes are started for `adapools`.
- Measure WebSocket latency: target below 15 seconds from indexer detection.
- Measure pool detail page refresh: target below 60 seconds.
- Visually test the frontend in desktop and mobile viewports.

### Phase 7: Deployment

- Status: implemented with Docker Compose and Makefile analogous to `adablox`.
- Define systemd or an existing deploy pattern analogous to `adablox`.
- Document `.env` for MongoDB, port, CORS, and WebSocket origin.
- Configure the reverse proxy for REST and WebSocket.
- Add monitoring for aggregator lag and backend health.

## Deployment

`adapools` runs in a Docker setup analogous to `adablox`: `node:22`, bind mount
to `/app`, `npm ci`, `npm run build`, and then `node server/index.js`. The
Node/Express server serves both the REST/WebSocket API and the built Vite
frontend from `dist/` inside the container.

Local Compose check:

```bash
docker compose config
```

Prepare the server:

```bash
make bootstrap
```

Deploy:

```bash
make deploy
```

Status and logs:

```bash
make status
make logs
```

Expected server files:

- Repository: `/var/www/adapools`
- Env file: `/home/mog/env/adapools/.env`
- Deploy copies env to: `/var/www/adapools/config/.env`
- Container: `adapools`
- Port: `5056`

The env file should contain at least the MongoDB connection and CORS. If MongoDB
runs on the Docker host, `MONGO_HOST=host.docker.internal` is expected.

## Pool Header Ads

The optional pool ads consist of two header slots. Free slots show self-promotion;
booked slots are generated exclusively from pool ticker, name, description, and
logo. One slot costs 1 ADA per day and is activated for the booked duration
after a confirmed payment.

The feature is disabled by default and is only enabled through the server env:

```env
POOL_ADS_ENABLED=true
POOL_ADS_PAYMENT_ADDRESS=addr1...
ADAPOOLS_DATABASE_URL=postgresql://...
```

`POOL_ADS_PAYMENT_ADDRESS` and `ADAPOOLS_DATABASE_URL` remain server-only. Without
both values, booking and payment verification are disabled even if the feature
flag is active. Payment verification queries the local db-sync Postgres database
and checks the recipient, the exact Lovelace amount, and the booking reference
in transaction metadata. `adapools_pool_ad_bookings` stores bookings;
`adapools_pool_ad_slot_locks` prevents parallel bookings. Expired slots are
released again during API calls and by a minutely job.

Locally, `http://localhost:5173/__timeline-preview` shows both banner variants.
The route is only available in Vite development mode.

## Pool Discovery

`/discover` is the standalone pool list for adapools. The page reads only from
MongoDB `pool_cache`, paginates server-side, and can filter and sort by pool,
status, stake, delegators, blocks, saturation, margin, fixed cost, pledge, and
first registration time. The pool worker writes `registered_on` as the first
on-chain pool registration, not as the time of the latest pool update.

## Open Decisions

- Should `adapools` use the same MongoDB database `adablox` or get its own
  database `adapools`? Recommendation: same MongoDB instance, own collections
  with the `adapools_` prefix.
- Should WebSocket be implemented with `ws` or `socket.io`? Recommendation:
  `ws`, as long as only new block events are sent.
- Should the pool route only accept `pool1...`, or also ticker/name?
  Recommendation: start with `pool1...`, add a search route later.
- Should `max_block_size` be set per block from historical protocol parameters
  or only from the current parameter? Recommendation: use the parameter valid at
  the block time for new blocks; for the first version, the current parameter is
  acceptable as a controlled approximation.
