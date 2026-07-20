import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import {
  previewCardanoMetrics,
  previewGridBlocks,
  previewPoolMetrics,
  timelinePreviewItems
} from '../data/timelinePreviewData.js';

const TimelinePreviewPage = () => (
  <section className="page-stack">
    <MetricsBar metrics={previewCardanoMetrics} type="cardano" />
    <MetricsBar metrics={previewPoolMetrics} type="pool" epoch={previewCardanoMetrics} />
    <BlockTicker blocks={previewGridBlocks} tileProps={{ clickable: true }} />
    <PoolBlockTimeline previewItems={timelinePreviewItems} />
  </section>
);

export default TimelinePreviewPage;
