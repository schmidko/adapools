import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { formatAda, formatAge, formatPercent } from '../utils/format.js';

const BlockTile = ({ block, showPool = true, prominentAda = false, now, clickable = false }) => {
  const pool = block.pool || {};
  const fullness = Math.max(0, Math.min(Number(block.fullness_percent || 0), 100));
  const adaValue = formatAda(block.total_output_lovelace, 0);
  const isClickable = clickable && pool.bech32_pool_id;
  const Root = isClickable ? Link : 'article';
  const rootProps = isClickable
    ? {
        to: `/pool/${pool.bech32_pool_id}`,
        className: 'block-tile block-tile-link',
        'aria-label': `Open pool ${pool.ticker || pool.name || pool.bech32_pool_id}`
      }
    : { className: 'block-tile' };

  return (
    <Root {...rootProps}>
      <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
      <div className="block-tile-content">
        <div className="block-topline">
          <span className="block-number">#{block.block_no}</span>
          <span>{formatAge(block.time, now)}</span>
        </div>
        {prominentAda ? (
          <div className="block-pool block-ada-primary">{adaValue}</div>
        ) : isClickable && showPool ? (
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
        ) : (
          <div className="block-pool block-ada-primary">{adaValue}</div>
        )}
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
