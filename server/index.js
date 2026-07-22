import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createMongo } from './mongo.js';
import { createPostgres } from './postgres.js';
import { registerBlockRoutes } from './blockModule.js';
import { registerMetricsRoutes } from './metricsModule.js';
import { registerPoolRoutes } from './poolModule.js';
import { registerPoolAdRoutes } from './poolAdsModule.js';
import { attachBlockWebSocket } from './websocketModule.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const app = express();
const port = parseInt(process.env.PORT || '5056');
const corsOrigin = process.env.CORS_ORIGIN || true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const mongo = await createMongo();
const postgres = createPostgres();

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'adapools', mongo: true });
});

registerBlockRoutes({ app, collections: mongo.collections });
registerMetricsRoutes({ app, collections: mongo.collections });
registerPoolRoutes({ app, collections: mongo.collections });
registerPoolAdRoutes({ app, collections: mongo.collections, postgres });

const distDir = path.resolve(__dirname, '../dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const server = http.createServer(app);
const closeWebSocket = attachBlockWebSocket({ server, collections: mongo.collections });

server.listen(port, () => {
  console.log(`[adapools] API and WebSocket listening on ${port}`);
});

let shuttingDown = false;
const shutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  await closeWebSocket();
  await mongo.client.close().catch(() => {});
  await postgres.close().catch(() => {});
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
