import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import { previewCardanoMetrics, previewPoolMetrics, timelinePreviewItems } from '../data/timelinePreviewData.js';

const TimelinePreviewPage = () => (
  <section className="page-stack">
    <MetricsBar metrics={previewCardanoMetrics} type="cardano" />
    <MetricsBar metrics={previewPoolMetrics} type="pool" epoch={previewCardanoMetrics} />
    <PoolBlockTimeline previewItems={timelinePreviewItems} />
  </section>
);

export default TimelinePreviewPage;
