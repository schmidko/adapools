import {Card, Progress, Statistic, Typography} from 'antd';
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

const MetricsBar = ({metrics = {}, type = 'cardano', epoch}) => {
  const epochMetrics = type === 'pool' ? epoch : metrics;

  const items = type === 'pool'
    ? [
      {label: 'Active stake', value: formatAda(metrics.active_stake_lovelace, 0), variant: 'big'},
      {label: 'Delegators', value: formatNumber(metrics.delegators), variant: 'compact'},
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

  return (
    <div className={`metrics-grid${type === 'pool' ? ' metrics-grid-pool' : ''}`}>
      <EpochProgressCard epoch={epochMetrics} />
      {items.map(({label, value, variant}) => (
        <Card key={label} className={`metric-card${variant ? ` metric-card-${variant}` : ''}`} size="small">
          <Statistic title={label} value={value || '-'} />
        </Card>
      ))}
    </div>
  );
};

export default MetricsBar;
