import { AppstoreOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { formatAda, formatAge, formatAgeAgo, formatPercent } from '../utils/format.js';

const fitClass = (value) => {
  const length = String(value || '').length;
  if (length > 24) return ' timeline-fit-xs';
  if (length > 18) return ' timeline-fit-sm';
  return '';
};

const BlockTile = ({ block, showPool = true, prominentAda = false, now, clickable = false }) => {
  const pool = block.pool || {};
  const fullness = Math.max(0, Math.min(Number(block.fullness_percent || 0), 100));
  const adaValue = formatAda(block.total_output_lovelace, 0);
  const isClickable = clickable && pool.bech32_pool_id;
  const Root = isClickable ? Link : 'article';
  const rootProps = isClickable
    ? {
        to: `/pool/${pool.bech32_pool_id}`,
        className: `block-tile block-tile-link${prominentAda ? ' timeline-block-card' : ''}`,
        'aria-label': `Open pool ${pool.ticker || pool.name || pool.bech32_pool_id}`
      }
    : { className: `block-tile${prominentAda ? ' timeline-block-card' : ''}` };

  if (prominentAda) {
    return (
      <Root {...rootProps}>
        <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
        <div className="block-tile-content">
          <div className="timeline-event-topline">
            <time dateTime={block.time}>{formatAgeAgo(block.time, now)}</time>
          </div>
          <div className="block-event-heading">
            <span className="block-event-icon"><AppstoreOutlined /></span>
            <span className={`block-event-title${fitClass('Block found')}`}>Block found</span>
          </div>
          <div className={`block-pool block-ada-primary${fitClass(adaValue)}`}>{adaValue}</div>
          <div className="block-stats">
            <span className="block-number">#{block.block_no}</span>
            <span>{formatAda(block.total_fees_lovelace, 2)} fee</span>
            <span>{block.tx_count || 0} tx</span>
            <span>{formatPercent(fullness)}</span>
          </div>
        </div>
      </Root>
    );
  }

  return (
    <Root {...rootProps}>
      <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
      <div className="block-tile-content">
        <div className="block-topline">
          <span className="block-number">#{block.block_no}</span>
          <span>{formatAge(block.time, now)}</span>
        </div>
        <div className="block-event-heading">
          <span className="block-event-icon"><AppstoreOutlined /></span>
          <span>Block found</span>
        </div>
        {isClickable && showPool ? (
          <div className="block-pool">
            <Tooltip title={pool.name || pool.bech32_pool_id}>
              <span>{pool.ticker || pool.name || 'POOL'}</span>
            </Tooltip>
          </div>
        ) : showPool && pool.bech32_pool_id ? (
          <Link to={`/pool/${pool.bech32_pool_id}`} className="block-pool">
            <Tooltip title={pool.name || pool.bech32_pool_id}>
              <span>{pool.ticker || pool.name || 'POOL'}</span>
            </Tooltip>
          </Link>
        ) : showPool ? (
          <span className="block-pool">Unknown</span>
        ) : null}
        <div className="block-stats">
          {!prominentAda && <span>{adaValue}</span>}
          <span>{formatAda(block.total_fees_lovelace, 2)} fee</span>
          <span>{block.tx_count || 0} tx</span>
          <span>{formatPercent(fullness)}</span>
        </div>
      </div>
    </Root>
  );
};

export default BlockTile;
