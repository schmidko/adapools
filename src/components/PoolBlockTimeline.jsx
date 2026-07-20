import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FlagOutlined,
  StopOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { Empty, Spin, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import BlockTile from './BlockTile.jsx';
import { compactPoolId, formatAda, formatAgeAgo } from '../utils/format.js';

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

const StakeAddressLink = ({ stakeAddress }) => {
  if (!stakeAddress) return null;
  return (
    <a
      className="timeline-event-meta"
      href={`https://adablox.com/stake/${stakeAddress}`}
      target="_blank"
      rel="noreferrer"
    >
      {compactPoolId(stakeAddress)}
    </a>
  );
};

const EventAge = ({ time, now }) => (
  <time className="timeline-event-age" dateTime={time}>
    {formatAgeAgo(time, now)}
  </time>
);

const eventTime = (item) => item.time || item.created_at || item.updated_at;

const fitClass = (value) => {
  const length = String(value || '').length;
  if (length > 17) return ' timeline-fit-xs';
  if (length > 13) return ' timeline-fit-sm';
  return '';
};

const titleFitClass = (value) => {
  const length = String(value || '').length;
  if (length > 17) return ' timeline-fit-xs';
  if (length > 10) return ' timeline-fit-sm';
  return '';
};

const DelegationChangeItem = ({ item, now }) => {
  const direction = item.delegation?.direction;
  const isIn = direction === 'in';
  const oldPool = item.delegation?.old_pool;
  const newPool = item.delegation?.new_pool;
  const title = isIn ? 'New delegation' : 'Removed delegation';
  const stakeAmount = item.delegation?.stake_lovelace
    ? formatAda(item.delegation.stake_lovelace, 0)
    : null;

  return (
    <article className={`timeline-event delegation-event ${isIn ? 'event-positive' : 'event-negative'}`}>
      <div className="timeline-event-header">
        <div className="timeline-event-icon"><SwapOutlined /></div>
        <div className="timeline-event-header-copy">
          <div className="timeline-event-topline">
            <EventAge time={eventTime(item)} now={now} />
          </div>
          <div className={`timeline-event-title${titleFitClass(title)}`}>
            {title}
          </div>
        </div>
      </div>
      {stakeAmount && (
        <div className={`timeline-event-amount${fitClass(stakeAmount)}`}>
          {isIn ? '+' : '-'}{stakeAmount}
        </div>
      )}
      <div className="timeline-event-body">
        <div className="timeline-pool-switch">
          <Tooltip title={oldPool?.bech32_pool_id || 'No previous pool'}>
            <span>from: {poolLabel(oldPool) || 'New wallet'}</span>
          </Tooltip>
          <Tooltip title={newPool?.bech32_pool_id || 'Unknown pool'}>
            <span>to: {poolLabel(newPool) || 'Unknown pool'}</span>
          </Tooltip>
        </div>
        <StakeAddressLink stakeAddress={item.stake_address} />
      </div>
    </article>
  );
};

const AdaFlowItem = ({ item, now }) => {
  const direction = item.ada_flow?.direction;
  const isIn = direction === 'in';
  const amount = formatAda(item.ada_flow?.amount_lovelace, 0);
  const title = isIn ? 'ADA added' : 'ADA removed';
  const signedAmount = `${isIn ? '+' : '-'}${amount}`;

  return (
    <article className={`timeline-event ada-flow-event ${isIn ? 'event-positive' : 'event-negative'}`}>
      <div className="timeline-event-header">
        <div className="timeline-event-icon">
          {isIn ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        </div>
        <div className="timeline-event-header-copy">
          <div className="timeline-event-topline">
            <EventAge time={eventTime(item)} now={now} />
          </div>
          <div className={`timeline-event-title${titleFitClass(title)}`}>
            {title}
          </div>
        </div>
      </div>
      <div className={`timeline-event-amount${fitClass(signedAmount)}`}>{signedAmount}</div>
      <div className="timeline-event-body">
        <StakeAddressLink stakeAddress={item.stake_address} />
      </div>
    </article>
  );
};

const PoolLifecycleItem = ({ item, now }) => {
  const isRetired = item.lifecycle?.stage === 'retired';
  const title = isRetired ? 'Pool retired' : 'Pool registered';
  const epoch = isRetired ? item.lifecycle?.retiring_epoch : item.epoch_no;
  const epochLabel = Number.isFinite(Number(epoch)) ? `Epoch ${epoch}` : null;
  const announcedAt = item.lifecycle?.announced_time;

  return (
    <article className={`timeline-event lifecycle-event ${isRetired ? 'event-retired' : 'event-registered'}`}>
      <div className="timeline-event-header">
        <div className="timeline-event-icon">
          {isRetired ? <StopOutlined /> : <FlagOutlined />}
        </div>
        <div className="timeline-event-header-copy">
          <div className="timeline-event-topline">
            <EventAge time={eventTime(item)} now={now} />
          </div>
          <div className={`timeline-event-title${titleFitClass(title)}`}>
            {title}
          </div>
        </div>
      </div>
      {epochLabel && <div className={`timeline-event-amount${fitClass(epochLabel)}`}>{epochLabel}</div>}
      <div className="timeline-event-body">
        {announcedAt && (
          <span className="timeline-event-meta">
            Announced {formatAgeAgo(announcedAt, now)}
          </span>
        )}
        {item.tx_hash && (
          <a
            className="timeline-event-meta"
            href={`https://adablox.com/tx/${item.tx_hash}`}
            target="_blank"
            rel="noreferrer"
            title={item.tx_hash}
          >
            {item.tx_hash.slice(0, 12)}
          </a>
        )}
      </div>
    </article>
  );
};

const EVENT_FILTER_KINDS = {
  blocks: 'block',
  ada: 'wallet_ada_flow',
  delegation: 'delegation_change'
};

const PoolBlockTimeline = ({ poolId, previewItems, eventFilter = 'all', layout = 'history' }) => {
  const hasPreviewItems = Array.isArray(previewItems);
  const isGridLayout = layout === 'grid';
  const [items, setItems] = useState(() => previewItems || []);
  const [loading, setLoading] = useState(!hasPreviewItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [now, setNow] = useState(Date.now());
  const sentinelRef = useRef(null);

  const loadBlocks = useCallback(async ({ reset = false, beforeTime } = {}) => {
    if (hasPreviewItems) return;
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
  }, [hasPreviewItems, poolId]);

  useEffect(() => {
    if (hasPreviewItems) {
      setItems(previewItems);
      setLoading(false);
      setHasMore(false);
      return;
    }
    setItems([]);
    setHasMore(true);
    loadBlocks({ reset: true });
  }, [hasPreviewItems, loadBlocks, previewItems]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasPreviewItems) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadBlocks({ beforeTime: items[items.length - 1]?.time });
      }
    }, { rootMargin: '600px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasPreviewItems, items, hasMore, loadBlocks, loading, loadingMore]);

  const visibleItems = useMemo(() => {
    const kind = EVENT_FILTER_KINDS[eventFilter];
    return kind ? items.filter((item) => item.kind === kind) : items;
  }, [items, eventFilter]);
  const groups = useMemo(() => groupByEpoch(visibleItems), [visibleItems]);

  if (loading && items.length === 0) {
    return <div className="center-state"><Spin /></div>;
  }

  if (visibleItems.length === 0) {
    return <Empty description={items.length === 0 ? 'No timeline history yet' : 'No events match this filter'} />;
  }

  return (
    <div className={`pool-block-timeline pool-block-timeline-${layout}`}>
      {groups.map((group) => (
        <section className={`epoch-block-group epoch-block-group-${layout}`} key={group.epoch}>
          {isGridLayout ? (
            <h4 className="pool-grid-epoch-heading">Epoch {group.epoch}</h4>
          ) : (
            <div className="epoch-number">Epoch {group.epoch}</div>
          )}
          <div className="timeline-blocks">
            {group.items.map((item) => {
              if (item.kind === 'block') {
                return (
                  <div className="timeline-block-tile" key={`block-${item.block_no}`}>
                    <BlockTile block={item} showPool={isGridLayout} prominentAda={!isGridLayout} now={now} />
                  </div>
                );
              }
              if (item.kind === 'delegation_change') {
                return <DelegationChangeItem key={item.event_id} item={item} now={now} />;
              }
              if (item.kind === 'wallet_ada_flow') {
                return <AdaFlowItem key={item.event_id} item={item} now={now} />;
              }
              if (item.kind === 'pool_lifecycle') {
                return <PoolLifecycleItem key={item.event_id} item={item} now={now} />;
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
