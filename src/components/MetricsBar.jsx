import { Card, Progress, Statistic, Typography } from 'antd';
import { formatAda, formatNumber, formatPercent } from '../utils/format.js';

const EpochProgressCard = ({ epoch = {} }) => {
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

const FeesMarginCard = ({ metrics = {} }) => (
  <Card className="metric-card metric-card-compact metric-card-fees" size="small">
    <div className="metric-card-fees-stack">
      <Statistic title="Fixed cost" value={formatAda(metrics.fixed_cost_lovelace, 0) || '-'} />
      <Statistic title="Margin" value={formatPercent(metrics.margin_percent) || '-'} />
    </div>
  </Card>
);

const MetricsBar = ({ metrics = {}, type = 'cardano', epoch }) => {
  const epochMetrics = type === 'pool' ? epoch : metrics;

  const items = type === 'pool'
    ? [
        { label: 'Active stake', value: formatAda(metrics.active_stake_lovelace, 0), variant: 'wide' },
        { label: 'Delegators', value: formatNumber(metrics.delegators), variant: 'compact' },
        { label: 'Blocks this epoch', value: formatNumber(metrics.blocks_epoch), variant: 'compact' },
        { label: 'Total blocks', value: formatNumber(metrics.total_blocks ?? metrics.lifetime_blocks), variant: 'compact' },
        { label: 'Saturation', value: formatPercent(metrics.saturation_percent), variant: 'compact' }
      ]
    : [
        { label: 'Latest block', value: formatNumber(metrics.latest_block_no) },
        { label: 'Active pools', value: formatNumber(metrics.active_pools) },
        { label: 'Avg full 1h', value: formatPercent(metrics.avg_block_fullness_1h) }
      ];

  return (
    <div className="metrics-grid">
      <EpochProgressCard epoch={epochMetrics} />
      {items.map(({ label, value, variant }) => (
        <Card key={label} className={`metric-card${variant ? ` metric-card-${variant}` : ''}`} size="small">
          <Statistic title={label} value={value || '-'} />
        </Card>
      ))}
      {type === 'pool' && <FeesMarginCard metrics={metrics} />}
    </div>
  );
};

export default MetricsBar;
