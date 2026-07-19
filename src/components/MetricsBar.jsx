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

const MetricsBar = ({ metrics = {}, type = 'cardano', epoch }) => {
  const epochMetrics = type === 'pool' ? epoch : metrics;

  const items = type === 'pool'
    ? [
        ['Active stake', formatAda(metrics.active_stake_lovelace, 0)],
        ['Delegators', formatNumber(metrics.delegators)],
        ['Blocks this epoch', formatNumber(metrics.blocks_epoch)],
        ['Total blocks', formatNumber(metrics.total_blocks ?? metrics.lifetime_blocks)],
        ['Saturation', formatPercent(metrics.saturation_percent)]
      ]
    : [
        ['Latest block', formatNumber(metrics.latest_block_no)],
        ['Active pools', formatNumber(metrics.active_pools)],
        ['Avg full 1h', formatPercent(metrics.avg_block_fullness_1h)]
      ];

  return (
    <div className="metrics-grid">
      <EpochProgressCard epoch={epochMetrics} />
      {items.map(([label, value]) => (
        <Card key={label} className="metric-card" size="small">
          <Statistic title={label} value={value || '-'} />
        </Card>
      ))}
    </div>
  );
};

export default MetricsBar;
