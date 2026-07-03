import { WebSocketServer } from 'ws';
import { serializeBlock } from './serializers.js';

const sendJson = (client, payload) => {
  if (client.readyState === client.OPEN) {
    client.send(JSON.stringify(payload));
  }
};

export const attachBlockWebSocket = ({ server, collections }) => {
  const wss = new WebSocketServer({ server, path: '/ws/blocks' });
  const pollIntervalMs = Math.max(parseInt(process.env.ADAPOOLS_WS_POLL_INTERVAL_MS || '3000'), 1000);
  let lastSeenBlockNo = 0;

  const broadcastBlock = (block) => {
    const serialized = serializeBlock(block);
    if (!serialized?.block_no || serialized.block_no <= lastSeenBlockNo) return;
    lastSeenBlockNo = serialized.block_no;
    for (const client of wss.clients) {
      sendJson(client, { type: 'block.created', block: serialized });
    }
  };

  wss.on('connection', async (client) => {
    sendJson(client, { type: 'connected' });
    try {
      const blocks = await collections.blocks.find({}).sort({ block_no: -1 }).limit(30).toArray();
      if (blocks[0]?.block_no) {
        lastSeenBlockNo = Math.max(lastSeenBlockNo, blocks[0].block_no);
      }
      sendJson(client, { type: 'snapshot', blocks: blocks.map(serializeBlock) });
    } catch (error) {
      sendJson(client, { type: 'error', error: 'snapshot_failed' });
    }
  });

  let changeStream = null;
  const startChangeStream = () => {
    try {
      changeStream = collections.blocks.watch([
        { $match: { operationType: { $in: ['insert', 'replace'] } } }
      ], { fullDocument: 'updateLookup' });

      changeStream.on('change', (change) => {
        if (change.fullDocument) broadcastBlock(change.fullDocument);
      });
      changeStream.on('error', (error) => {
        console.warn('[adapools] Mongo change stream unavailable, keeping polling fallback:', error.message);
      });
    } catch (error) {
      console.warn('[adapools] Mongo change stream unavailable, using polling fallback:', error.message);
    }
  };

  const pollTimer = setInterval(async () => {
    try {
      const query = lastSeenBlockNo > 0 ? { block_no: { $gt: lastSeenBlockNo } } : {};
      const blocks = await collections.blocks.find(query).sort({ block_no: 1 }).limit(20).toArray();
      for (const block of blocks) broadcastBlock(block);
    } catch (error) {
      console.error('[adapools] WebSocket block poll failed:', error.message);
    }
  }, pollIntervalMs);

  startChangeStream();

  return async () => {
    clearInterval(pollTimer);
    await changeStream?.close().catch(() => {});
    await new Promise((resolve) => wss.close(resolve));
  };
};
