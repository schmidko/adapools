import { AppstoreOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { formatAda, formatAge, formatAgeAgo, formatPercent } from '../utils/format.js';

const fitClass = (value) => {
  const length = String(value || '').length;
  if (length > 17) return ' timeline-fit-xs';
  if (length > 13) return ' timeline-fit-sm';
  return '';
};

const HomeTooltip = ({ title, children }) => (
  <Tooltip title={title} arrow={false}>{children}</Tooltip>
);

const BlockTile = ({ block, showPool = true, prominentAda = false, now, clickable = false, homeLayout = false }) => {
  const pool = block.pool || {};
  const poolLabel = pool.ticker || pool.name || 'POOL';
  const fullness = Math.max(0, Math.min(Number(block.fullness_percent || 0), 100));
  const adaValue = formatAda(block.total_output_lovelace, 0);
  const isClickable = clickable && pool.bech32_pool_id;
  const Root = isClickable ? Link : 'article';
  const tileClassName = `block-tile${prominentAda ? ' timeline-block-card' : ''}${homeLayout ? ' home-block-tile' : ''}`;
  const rootProps = isClickable
    ? {
        to: `/pool/${pool.bech32_pool_id}`,
        className: `${tileClassName} block-tile-link`,
        'aria-label': `Open pool ${poolLabel}`
      }
    : { className: tileClassName };

  if (prominentAda) {
    return (
      <Root {...rootProps}>
        <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
        <div className="block-tile-content">
          <div className="timeline-event-header">
            <span className="timeline-event-icon block-event-icon"><AppstoreOutlined /></span>
            <div className="timeline-event-header-copy">
              <div className="timeline-event-topline">
                <time dateTime={block.time}>{formatAgeAgo(block.time, now)}</time>
              </div>
              <span className={`timeline-event-title block-event-title${fitClass('Block found')}`}>Block found</span>
            </div>
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

  if (homeLayout) {
    return (
      <Root {...rootProps}>
        <div className="block-tile-fill" style={{ height: `${fullness}%` }} />
        <div className="block-tile-content">
          <div className="home-block-summary">
            <div className="home-block-copy">
              <HomeTooltip title="Cardano block number">
                <span className="block-number home-block-info">#{block.block_no}</span>
              </HomeTooltip>
              <HomeTooltip title="Block minted by this pool">
                <div className="block-event-heading home-block-info">
                  <span className="block-event-icon"><AppstoreOutlined /></span>
                  <span>Block found</span>
                </div>
              </HomeTooltip>
              <HomeTooltip title={`Pool that minted this block${pool.name ? `: ${pool.name}` : ''}`}>
                <span className="block-pool home-block-info">{poolLabel}</span>
              </HomeTooltip>
            </div>
            <HomeTooltip title={`Pool that minted this block${pool.name ? `: ${pool.name}` : ''}`}>
              <Avatar className="home-block-pool-logo home-block-info" shape="square" size={44} src={pool.logo || undefined}>
                {poolLabel.slice(0, 2).toUpperCase()}
              </Avatar>
            </HomeTooltip>
          </div>
          <div className="home-block-footer">
            <div className="home-block-stats">
              <HomeTooltip title="Total ADA in all transaction outputs in this block. This is not the pool reward.">
                <span className="home-block-info">{adaValue}</span>
              </HomeTooltip>
              <HomeTooltip title="Total transaction fees paid in this block">
                <span className="home-block-info">{formatAda(block.total_fees_lovelace, 2)} fee</span>
              </HomeTooltip>
              <HomeTooltip title="Number of transactions included in this block">
                <span className="home-block-info">{block.tx_count || 0} tx</span>
              </HomeTooltip>
              <HomeTooltip title="Block body size as a share of the current maximum block size">
                <span className="home-block-info">{formatPercent(fullness)}</span>
              </HomeTooltip>
            </div>
            <HomeTooltip title="Time since the block was produced">
              <time className="home-block-age home-block-info" dateTime={block.time}>{formatAgeAgo(block.time, now)}</time>
            </HomeTooltip>
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
