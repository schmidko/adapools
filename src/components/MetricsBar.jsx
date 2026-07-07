import { Card, Statistic } from 'antd';
import { formatAda, formatNumber, formatPercent } from '../utils/format.js';

const MetricsBar = ({ metrics = {}, type = 'cardano' }) => {
  const items = type === 'pool'
    ? [
        ['Active stake', formatAda(metrics.active_stake_lovelace, 0)],
        ['Delegators', formatNumber(metrics.delegators)],
        ['Blocks this epoch', formatNumber(metrics.blocks_epoch)],
        ['Total blocks', formatNumber(metrics.total_blocks ?? metrics.lifetime_blocks)],
        ['Saturation', formatPercent(metrics.saturation_percent)]
      ]
    : [
        ['Epoch', formatNumber(metrics.current_epoch)],
        ['Latest block', formatNumber(metrics.latest_block_no)],
        ['Active pools', formatNumber(metrics.active_pools)],
        ['Avg full 1h', formatPercent(metrics.avg_block_fullness_1h)]
      ];

  return (
    <div className="metrics-grid">
      {items.map(([label, value]) => (
        <Card key={label} className="metric-card" size="small">
          <Statistic title={label} value={value || '-'} />
        </Card>
      ))}
    </div>
  );
};

export default MetricsBar;
