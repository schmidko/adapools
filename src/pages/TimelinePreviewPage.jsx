import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import { timelinePreviewItems } from '../data/timelinePreviewData.js';

const TimelinePreviewPage = () => (
  <section className="page-stack">
    <PoolBlockTimeline previewItems={timelinePreviewItems} />
  </section>
);

export default TimelinePreviewPage;
