import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Segmented, Select, Typography } from 'antd';
import { api } from '../api/client.js';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import PoolIdentity from '../components/PoolIdentity.jsx';

const PoolPage = () => {
  const { poolId } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [cardanoMetrics, setCardanoMetrics] = useState({});
  const [recentBlocks, setRecentBlocks] = useState(null);
  const [blockView, setBlockView] = useState('history');
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [metricsResult, blocksResult, cardanoMetricsResult] = await Promise.all([
          api.getPoolMetrics(poolId),
          api.getPoolRecentBlocks(poolId),
          api.getCardanoMetrics()
        ]);
        if (!mounted) return;
        setMetrics(metricsResult);
        setRecentBlocks(blocksResult);
        setCardanoMetrics(cardanoMetricsResult || {});
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

  useEffect(() => {
    const previousTitle = document.title;
    const label = pool.ticker || pool.name || poolId;
    if (label) {
      document.title = `${label} | adapools.xyz`;
    }
    return () => {
      document.title = previousTitle;
    };
  }, [pool.ticker, pool.name, poolId]);

  return (
    <section className="page-stack">
      <PoolIdentity pool={pool} poolId={poolId} />
      <MetricsBar metrics={metrics || {}} type="pool" epoch={cardanoMetrics} />
      <div className="block-view-section">
        <div className="section-toolbar">
          <Typography.Title level={3}>
            {blockView === 'grid' ? 'Recent pool blocks' : 'Pool block history'}
          </Typography.Title>
          <div className="section-toolbar-actions">
            <Select
              value={eventFilter}
              onChange={setEventFilter}
              className="event-filter-select"
              aria-label="Filter events"
              options={[
                { label: 'All events', value: 'all' },
                { label: 'Only blocks', value: 'blocks' },
                { label: 'Ada events', value: 'ada' },
                { label: 'Delegation events', value: 'delegation' }
              ]}
            />
            <Segmented
              value={blockView}
              onChange={setBlockView}
              options={[
                { label: 'Grid', value: 'grid', icon: <AppstoreOutlined /> },
                { label: 'History', value: 'history', icon: <BarsOutlined /> }
              ]}
            />
          </div>
        </div>
        {blockView === 'grid' ? (
          <PoolBlockTimeline poolId={poolId} layout="grid" eventFilter={eventFilter} />
        ) : (
          <PoolBlockTimeline poolId={poolId} eventFilter={eventFilter} />
        )}
      </div>
    </section>
  );
};

export default PoolPage;
