import { Card, Progress, Statistic, Typography } from 'antd';
import { formatAda, formatNumber, formatPercent } from '../utils/format.js';

const EpochProgressCard = ({ epoch = {} }) => {
  const epochNo = epoch.current_epoch;
  const percent = Math.min(Math.max(Number(epoch.epoch_progress_percent || 0), 0), 100);

  return (
    <Card className="metric-card metric-card-epoch" size="small">
      <div className="epoch-card-header">
        <Typography.Text type="secondary" className="epoch-card-label">Epoch</Typography.Text>
        <Statistic value={epochNo ?? '-'} className="epoch-card-value" />
      </div>
      <Progress percent={percent} size="small" status="active" />
    </Card>
  );
};

const FeesMarginCard = ({ metrics = {} }) => (
  <Card className="metric-card" size="small">
    <div className="metric-card-split">
      <div>
        <Typography.Text type="secondary" className="metric-split-label">Fixed cost</Typography.Text>
        <div className="metric-split-value">{formatAda(metrics.fixed_cost_lovelace, 0)}</div>
      </div>
      <div>
        <Typography.Text type="secondary" className="metric-split-label">Margin</Typography.Text>
        <div className="metric-split-value">{formatPercent(metrics.margin_percent)}</div>
      </div>
    </div>
  </Card>
);

const MetricsBar = ({ metrics = {}, type = 'cardano', epoch }) => {
  const epochMetrics = type === 'pool' ? epoch : metrics;

  const items = type === 'pool'
    ? [
        ['Active stake', formatAda(metrics.active_stake_lovelace, 0)],
        ['Delegators', formatNumber(metrics.delegators), true],
        ['Blocks this epoch', formatNumber(metrics.blocks_epoch), true],
        ['Total blocks', formatNumber(metrics.total_blocks ?? metrics.lifetime_blocks), true],
        ['Saturation', formatPercent(metrics.saturation_percent), true]
      ]
    : [
        ['Latest block', formatNumber(metrics.latest_block_no)],
        ['Active pools', formatNumber(metrics.active_pools)],
        ['Avg full 1h', formatPercent(metrics.avg_block_fullness_1h)]
      ];

  return (
    <div className="metrics-grid">
      <EpochProgressCard epoch={epochMetrics} />
      {type === 'pool' && <FeesMarginCard metrics={metrics} />}
      {items.map(([label, value, compact]) => (
        <Card key={label} className={`metric-card${compact ? ' metric-card-compact' : ''}`} size="small">
          <Statistic title={label} value={value || '-'} />
        </Card>
      ))}
    </div>
  );
};

export default MetricsBar;
