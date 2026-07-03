import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { formatAda, formatAge, formatPercent } from '../utils/format.js';

const BlockTile = ({ block }) => {
  const pool = block.pool || {};
  const fullness = Math.max(0, Math.min(Number(block.fullness_percent || 0), 100));

  return (
    <article className="block-tile">
      <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
      <div className="block-tile-content">
        <div className="block-topline">
          <span className="block-number">#{block.block_no}</span>
          <span>{formatAge(block.time)}</span>
        </div>
        {pool.bech32_pool_id ? (
          <Link to={`/pool/${pool.bech32_pool_id}`} className="block-pool">
            <Tooltip title={pool.name || pool.bech32_pool_id}>
              <span>{pool.ticker || pool.name || 'POOL'}</span>
            </Tooltip>
          </Link>
        ) : (
          <span className="block-pool">Unknown</span>
        )}
        <div className="block-stats">
          <span>{block.tx_count || 0} tx</span>
          <span>{formatAda(block.total_fees_lovelace, 4)}</span>
          <span>{formatPercent(fullness)}</span>
        </div>
        <div className="block-volume">{formatAda(block.total_output_lovelace, 0)}</div>
      </div>
    </article>
  );
};

export default BlockTile;
