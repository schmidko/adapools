import { ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from '@ant-design/icons';
import { Empty, Spin, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import BlockTile from './BlockTile.jsx';
import { compactPoolId, formatAda } from '../utils/format.js';

const PAGE_SIZE = 20;

const groupByEpoch = (items) => {
  const groups = [];
  for (const item of items) {
    const epoch = item.epoch_no ?? 'unknown';
    const current = groups[groups.length - 1];
    if (current?.epoch === epoch) {
      current.items.push(item);
    } else {
      groups.push({ epoch, items: [item] });
    }
  }
  return groups;
};

const poolLabel = (pool) => pool?.ticker || pool?.name || compactPoolId(pool?.bech32_pool_id || '');

const DelegationChangeItem = ({ item }) => {
  const direction = item.delegation?.direction;
  const isIn = direction === 'in';
  const oldPool = item.delegation?.old_pool;
  const newPool = item.delegation?.new_pool;

  return (
    <article className={`timeline-event delegation-event ${isIn ? 'event-positive' : 'event-negative'}`}>
      <div className="timeline-event-icon"><SwapOutlined /></div>
      <div className="timeline-event-body">
        <div className="timeline-event-title">
          {isIn ? 'Delegation added' : 'Delegation removed'}
        </div>
        <div className="timeline-pool-switch">
          <Tooltip title={oldPool?.bech32_pool_id || 'No previous pool'}>
            <span>{poolLabel(oldPool) || 'New wallet'}</span>
          </Tooltip>
          <span className="timeline-switch-arrow">{'->'}</span>
          <Tooltip title={newPool?.bech32_pool_id || 'Unknown pool'}>
            <span>{poolLabel(newPool) || 'Unknown pool'}</span>
          </Tooltip>
        </div>
        <div className="timeline-event-meta">{compactPoolId(item.stake_address)}</div>
      </div>
    </article>
  );
};

const AdaFlowItem = ({ item }) => {
  const direction = item.ada_flow?.direction;
  const isIn = direction === 'in';
  const amount = formatAda(item.ada_flow?.amount_lovelace, 0);

  return (
    <article className={`timeline-event ada-flow-event ${isIn ? 'event-positive' : 'event-negative'}`}>
      <div className="timeline-event-icon">
        {isIn ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
      </div>
      <div className="timeline-event-body">
        <div className="timeline-event-title">
          {isIn ? 'ADA received' : 'ADA sent'}
        </div>
        <div className="timeline-event-amount">{isIn ? '+' : '-'}{amount}</div>
        <div className="timeline-event-meta">{compactPoolId(item.stake_address)}</div>
      </div>
    </article>
  );
};

const PoolBlockTimeline = ({ poolId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const loadBlocks = useCallback(async ({ reset = false, beforeTime } = {}) => {
    if (!poolId) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const nextItems = await api.getPoolTimeline(poolId, {
        limit: PAGE_SIZE,
        beforeTime
      });
      setItems((current) => {
        const base = reset ? [] : current;
        const known = new Set(base.map((item) => item.event_id || `block:${item.block_no}`));
        const merged = [
          ...base,
          ...nextItems.filter((item) => !known.has(item.event_id || `block:${item.block_no}`))
        ];
        return merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      });
      setHasMore(nextItems.length === PAGE_SIZE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [poolId]);

  useEffect(() => {
    setItems([]);
    setHasMore(true);
    loadBlocks({ reset: true });
  }, [loadBlocks]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadBlocks({ beforeTime: items[items.length - 1]?.time });
      }
    }, { rootMargin: '600px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items, hasMore, loadBlocks, loading, loadingMore]);

  const groups = useMemo(() => groupByEpoch(items), [items]);

  if (loading && items.length === 0) {
    return <div className="center-state"><Spin /></div>;
  }

  if (items.length === 0) {
    return <Empty description="No timeline history yet" />;
  }

  return (
    <div className="pool-block-timeline">
      {groups.map((group) => (
        <section className="epoch-block-group" key={group.epoch}>
          <div className="epoch-number">Epoch {group.epoch}</div>
          <div className="timeline-blocks">
            {group.items.map((item) => {
              if (item.kind === 'block') {
                return (
                  <div className="timeline-block-tile" key={`block-${item.block_no}`}>
                    <BlockTile block={item} showPool={false} prominentAda />
                  </div>
                );
              }
              if (item.kind === 'delegation_change') {
                return <DelegationChangeItem key={item.event_id} item={item} />;
              }
              if (item.kind === 'wallet_ada_flow') {
                return <AdaFlowItem key={item.event_id} item={item} />;
              }
              return null;
            })}
          </div>
        </section>
      ))}
      <div ref={sentinelRef} className="timeline-sentinel">
        {loadingMore ? <Spin size="small" /> : hasMore ? null : 'Full history loaded'}
      </div>
    </div>
  );
};

export default PoolBlockTimeline;
