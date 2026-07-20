import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import PoolIdentity from '../components/PoolIdentity.jsx';
import {
  previewCardanoMetrics,
  previewGridBlocks,
  previewPoolMetrics,
  timelinePreviewItems
} from '../data/timelinePreviewData.js';

const TimelinePreviewPage = () => (
  <section className="page-stack">
    <PoolIdentity
      pool={{ ticker: 'RETI', name: 'Retiring Pool', retiring_epoch: 650, saturation_percent: 45 }}
      poolId="pool1previewretiring"
    />
    <PoolIdentity
      pool={{ ticker: 'SATU', name: 'Oversaturated Pool', saturation_percent: 142 }}
      poolId="pool1previewoversaturated"
    />
    <PoolIdentity
      pool={{ ticker: 'NORM', name: 'Normal Pool', retiring_epoch: null, saturation_percent: 45 }}
      poolId="pool1previewnormal"
    />
    <MetricsBar metrics={previewCardanoMetrics} type="cardano" />
    <MetricsBar metrics={previewPoolMetrics} type="pool" epoch={previewCardanoMetrics} />
    <BlockTicker blocks={previewGridBlocks} tileProps={{ clickable: true }} />
    <PoolBlockTimeline previewItems={timelinePreviewItems} layout="grid" />
    <PoolBlockTimeline previewItems={timelinePreviewItems} />
  </section>
);

export default TimelinePreviewPage;
