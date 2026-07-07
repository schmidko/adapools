import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Segmented, Typography } from 'antd';
import { api } from '../api/client.js';
import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import PoolIdentity from '../components/PoolIdentity.jsx';

const PoolPage = () => {
  const { poolId } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState(null);
  const [blockView, setBlockView] = useState('history');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [metricsResult, blocksResult] = await Promise.all([
          api.getPoolMetrics(poolId),
          api.getPoolRecentBlocks(poolId)
        ]);
        if (!mounted) return;
        setMetrics(metricsResult);
        setRecentBlocks(blocksResult);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 60000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [poolId]);

  const pool = metrics || recentBlocks?.pool || {};
  const blocks = recentBlocks?.blocks || [];

  return (
    <section className="page-stack">
      <PoolIdentity pool={pool} poolId={poolId} />
      <MetricsBar metrics={metrics || {}} type="pool" />
      <div className="block-view-section">
        <div className="section-toolbar">
          <Typography.Title level={3}>
            {blockView === 'grid' ? 'Recent pool blocks' : 'Pool block history'}
          </Typography.Title>
          <Segmented
            value={blockView}
            onChange={setBlockView}
            options={[
              { label: 'Grid', value: 'grid', icon: <AppstoreOutlined /> },
              { label: 'History', value: 'history', icon: <BarsOutlined /> }
            ]}
          />
        </div>
        {blockView === 'grid' ? (
          <BlockTicker blocks={blocks.map((block) => ({ ...block, pool: { ...pool, bech32_pool_id: poolId } }))} loading={loading} />
        ) : (
          <PoolBlockTimeline poolId={poolId} />
        )}
      </div>
    </section>
  );
};

export default PoolPage;
