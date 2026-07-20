import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import { Segmented, Typography } from 'antd';
import { api } from '../api/client.js';
import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import PoolIdentity from '../components/PoolIdentity.jsx';

const groupBlocksByEpoch = (blocks) => {
  const groups = [];
  for (const block of blocks) {
    const epoch = block.epoch_no ?? 'Unknown';
    const current = groups[groups.length - 1];
    if (current?.epoch === epoch) {
      current.blocks.push(block);
    } else {
      groups.push({ epoch, blocks: [block] });
    }
  }
  return groups;
};

const PoolPage = () => {
  const { poolId } = useParams();
  const [metrics, setMetrics] = useState(null);
  const [cardanoMetrics, setCardanoMetrics] = useState({});
  const [recentBlocks, setRecentBlocks] = useState(null);
  const [blockView, setBlockView] = useState('history');
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
  const blocks = recentBlocks?.blocks || [];
  const poolBlocks = blocks.map((block) => ({ ...block, pool: { ...pool, bech32_pool_id: poolId } }));
  const blockEpochGroups = groupBlocksByEpoch(poolBlocks);

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
          blockEpochGroups.length === 0 ? (
            <BlockTicker blocks={poolBlocks} loading={loading} />
          ) : (
            <div className="pool-grid-epochs">
              {blockEpochGroups.map((group) => (
                <section className="pool-grid-epoch" key={group.epoch}>
                  <h4 className="pool-grid-epoch-heading">Epoch {group.epoch}</h4>
                  <BlockTicker blocks={group.blocks} />
                </section>
              ))}
            </div>
          )
        ) : (
          <PoolBlockTimeline poolId={poolId} />
        )}
      </div>
    </section>
  );
};

export default PoolPage;
