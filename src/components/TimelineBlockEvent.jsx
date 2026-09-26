import { AppstoreOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { formatAda, formatAgeAgo, formatPercent } from '../utils/format.js';

const fitClass = (value) => {
  const length = String(value || '').length;
  if (length > 17) return ' timeline-fit-xs';
  if (length > 13) return ' timeline-fit-sm';
  return '';
};

const TimelineBlockEvent = ({ block, now, layout = 'history' }) => {
  const pool = block.pool || {};
  const poolLabel = pool.ticker || pool.name || 'POOL';
  const fullness = Math.max(0, Math.min(Number(block.fullness_percent || 0), 100));
  const adaValue = formatAda(block.total_output_lovelace, 0);

  if (layout === 'history') {
    return (
      <article className="block-tile timeline-block-card">
        <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
        <div className="block-tile-content">
          <div className="timeline-event-header">
            <span className="timeline-event-icon block-event-icon"><AppstoreOutlined /></span>
            <div className="timeline-event-header-copy">
              <span className={`timeline-event-title block-event-title${fitClass('Block found')}`}>Block found</span>
            </div>
          </div>
          <div className={`block-pool block-ada-primary${fitClass(adaValue)}`}>{adaValue}</div>
          <div className="block-tile-footer">
            <div className="block-stats">
              <span className="block-number">#{block.block_no}</span>
              <span>{formatAda(block.total_fees_lovelace, 2)} fee</span>
              <span>{block.tx_count || 0} tx</span>
              <span>{formatPercent(fullness)}</span>
            </div>
            <time className="block-age" dateTime={block.time}>{formatAgeAgo(block.time, now)}</time>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="block-tile">
      <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
      <div className="block-tile-content">
        <div className="block-event-heading">
          <span className="block-event-icon"><AppstoreOutlined /></span>
          <span>Block found</span>
        </div>
        {pool.bech32_pool_id ? (
          <Link to={`/pool/${pool.bech32_pool_id}`} className="block-pool">
            <Tooltip title={pool.name || pool.bech32_pool_id}>
              <span>{poolLabel}</span>
            </Tooltip>
          </Link>
        ) : (
          <span className="block-pool">Unknown</span>
        )}
        <div className="block-tile-footer">
          <div className="block-stats">
            <span className="block-number">#{block.block_no}</span>
            <span>{adaValue}</span>
            <span>{formatAda(block.total_fees_lovelace, 2)} fee</span>
            <span>{block.tx_count || 0} tx</span>
            <span>{formatPercent(fullness)}</span>
          </div>
          <time className="block-age" dateTime={block.time}>{formatAgeAgo(block.time, now)}</time>
        </div>
      </div>
    </article>
  );
};

export default TimelineBlockEvent;
