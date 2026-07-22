import { useEffect, useMemo, useState } from 'react';
import { Typography } from 'antd';
import { api } from '../api/client.js';
import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import Seo from '../components/Seo.jsx';
import SyncStatus from '../components/SyncStatus.jsx';
import PoolAdsBanner from '../components/PoolAdsBanner.jsx';

const mergeBlock = (blocks, nextBlock) => {
  if (!nextBlock?.block_no) return blocks;
  const filtered = blocks.filter((block) => block.block_no !== nextBlock.block_no);
  return [nextBlock, ...filtered].sort((a, b) => b.block_no - a.block_no).slice(0, 120);
};

const HomePage = () => {
  const [metrics, setMetrics] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [syncStates, setSyncStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const wsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/blocks`;
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [metricsResult, blocksResult, syncResult] = await Promise.all([
          api.getCardanoMetrics(),
          api.getLatestBlocks(120),
          api.getSyncStatus()
        ]);
        if (!mounted) return;
        setMetrics(metricsResult || {});
        setBlocks(blocksResult || []);
        setSyncStates(syncResult || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let socket;
    let retryTimer;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'snapshot') {
          setBlocks(payload.blocks || []);
        }
        if (payload.type === 'block.created') {
          setBlocks((current) => mergeBlock(current, payload.block));
        }
      };
      socket.onclose = () => {
        if (!closed) retryTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="page-stack">
      <Seo
        title="adapools.xyz | Cardano Stake Pool Explorer"
        description="Real-time Cardano stake pool explorer: live block ticker, epoch progress and pool metrics for the Cardano mainnet, updated within seconds of each new block."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'adapools.xyz',
          url: 'https://adapools.xyz/',
          description: 'Real-time Cardano stake pool explorer with a live block ticker and pool metrics.'
        }}
      />
      <div className="page-heading-with-ads">
        <div>
          <Typography.Title level={1}>Latest blocks</Typography.Title>
          <Typography.Text type="secondary">Live Cardano pool blocks</Typography.Text>
        </div>
        <PoolAdsBanner />
      </div>
      <MetricsBar metrics={metrics} />
      <SyncStatus states={syncStates} />
      <BlockTicker
        blocks={blocks}
        loading={loading}
        now={now}
        className="home-block-grid"
        tileProps={{ clickable: true }}
      />
    </section>
  );
};

export default HomePage;
