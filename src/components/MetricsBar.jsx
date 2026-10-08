import { LinkOutlined } from '@ant-design/icons';
import { Card, Progress, Statistic, Tooltip, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {formatAda, formatNumber, formatPercent} from '../utils/format.js';

const EpochProgressCard = ({epoch = {}}) => {
  const epochNo = epoch.current_epoch;
  const percent = Math.min(Math.max(Number(epoch.epoch_progress_percent || 0), 0), 100);

  return (
    <Card className="metric-card metric-card-wide metric-card-epoch" size="small">
      <div className="epoch-card-header">
        <Typography.Text type="secondary" className="epoch-card-label">Epoch</Typography.Text>
        <Statistic value={epochNo ?? '-'} className="epoch-card-value" />
      </div>
      <Progress percent={percent} size="small" status="active" />
    </Card>
  );
};

const MetricsBar = ({metrics = {}, type = 'cardano', epoch, poolId}) => {
  const epochMetrics = type === 'pool' ? epoch : metrics;

  const items = type === 'pool'
    ? [
      {
        label: 'Delegators',
        value: formatNumber(metrics.delegators),
        variant: 'compact',
        href: poolId ? `/pool/${encodeURIComponent(poolId)}/delegators` : null
      },
      {label: 'Epoch blocks', value: formatNumber(metrics.blocks_epoch), variant: 'compact'},
      {label: 'Total blocks', value: formatNumber(metrics.total_blocks ?? metrics.lifetime_blocks), variant: 'compact'},
      {label: 'Saturation', value: formatPercent(metrics.saturation_percent), variant: 'compact'},
      {label: 'Fixed cost', value: formatAda(metrics.fixed_cost_lovelace, 0), variant: 'compact'},
      {label: 'Margin', value: formatPercent(metrics.margin_percent), variant: 'compact'}
    ]
    : [
      {label: 'Latest block', value: formatNumber(metrics.latest_block_no)},
      {label: 'Active pools', value: formatNumber(metrics.active_pools)},
      {label: 'Avg full 1h', value: formatPercent(metrics.avg_block_fullness_1h)}
    ];

  const currentPoolItems = [
    {
      label: 'Current balance',
      value: formatAda(metrics.current_balance_lovelace, 0),
      description: 'Confirmed unspent ADA held by payment addresses currently delegated to this pool. Updates after indexed blocks.'
    },
    {
      label: 'Current stake',
      value: formatAda(metrics.current_stake_lovelace ?? metrics.active_stake_lovelace, 0),
      description: 'The latest active stake snapshot. Newly delegated ADA becomes active after Cardano’s stake activation delay.'
    }
  ];

  const renderItem = ({ label, value, variant, href, description }) => {
    const slotClassName = `metric-card-slot${variant ? ` metric-card-${variant}` : ''}`;
    const title = description ? <Tooltip title={description}>{label}</Tooltip> : label;
    const card = (
      <Card className={`metric-card${variant ? ` metric-card-${variant}` : ''}`} size="small">
        <Statistic
          title={href ? <>{title} <LinkOutlined className="metric-card-link-icon" /></> : title}
          value={value || '-'}
        />
      </Card>
    );
    return href
      ? <Link key={label} className={`metric-card-link ${slotClassName}`} to={href}>{card}</Link>
      : <span key={label} className={slotClassName}>{card}</span>;
  };

  return (
    type === 'pool' ? (
      <div className="pool-metrics">
        <div className="metrics-grid metrics-grid-pool metrics-grid-pool-primary">
          <EpochProgressCard epoch={epochMetrics} />
          {items.map(renderItem)}
        </div>
        <div className="metrics-grid metrics-grid-pool-current">
          {currentPoolItems.map(renderItem)}
        </div>
      </div>
    ) : (
      <div className="metrics-grid">
        <EpochProgressCard epoch={epochMetrics} />
        {items.map(renderItem)}
      </div>
    )
  );
};

export default MetricsBar;
