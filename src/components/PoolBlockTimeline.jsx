import { Empty, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import BlockTile from './BlockTile.jsx';

const PAGE_SIZE = 20;

const groupByEpoch = (blocks) => {
  const groups = [];
  for (const block of blocks) {
    const epoch = block.epoch_no ?? 'unknown';
    const current = groups[groups.length - 1];
    if (current?.epoch === epoch) {
      current.blocks.push(block);
    } else {
      groups.push({ epoch, blocks: [block] });
    }
  }
  return groups;
};

const PoolBlockTimeline = ({ poolId }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const loadBlocks = useCallback(async ({ reset = false, beforeBlockNo } = {}) => {
    if (!poolId) return;

    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const nextBlocks = await api.getPoolBlocks(poolId, {
        limit: PAGE_SIZE,
        beforeBlockNo
      });
      setBlocks((current) => {
        const base = reset ? [] : current;
        const known = new Set(base.map((block) => block.block_no));
        const merged = [
          ...base,
          ...nextBlocks.filter((block) => !known.has(block.block_no))
        ];
        return merged.sort((a, b) => b.block_no - a.block_no);
      });
      setHasMore(nextBlocks.length === PAGE_SIZE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [poolId]);

  useEffect(() => {
    setBlocks([]);
    setHasMore(true);
    loadBlocks({ reset: true });
  }, [loadBlocks]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadBlocks({ beforeBlockNo: blocks[blocks.length - 1]?.block_no });
      }
    }, { rootMargin: '600px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [blocks, hasMore, loadBlocks, loading, loadingMore]);

  const groups = useMemo(() => groupByEpoch(blocks), [blocks]);

  if (loading && blocks.length === 0) {
    return <div className="center-state"><Spin /></div>;
  }

  if (blocks.length === 0) {
    return <Empty description="No block history yet" />;
  }

  return (
    <div className="pool-block-timeline">
      {groups.map((group) => (
        <section className="epoch-block-group" key={group.epoch}>
          <div className="epoch-number">Epoch {group.epoch}</div>
          <div className="timeline-blocks">
            {group.blocks.map((block) => (
              <div className="timeline-block-tile" key={block.block_no}>
                <BlockTile block={block} />
              </div>
            ))}
          </div>
        </section>
      ))}
      <div ref={sentinelRef} className="timeline-sentinel">
        {loadingMore ? <Spin size="small" /> : hasMore ? null : 'Full loaded history'}
      </div>
    </div>
  );
};

export default PoolBlockTimeline;
