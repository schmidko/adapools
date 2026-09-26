import BlockTicker from '../components/BlockTicker.jsx';
import MetricsBar from '../components/MetricsBar.jsx';
import PoolBlockTimeline from '../components/PoolBlockTimeline.jsx';
import PoolIdentity from '../components/PoolIdentity.jsx';
import { PoolAdsPreview } from '../components/PoolAdsBanner.jsx';
import {
  previewCardanoMetrics,
  previewGridBlocks,
  previewPoolMetrics,
  timelinePreviewItems
} from '../data/timelinePreviewData.js';

const TimelinePreviewPage = () => (
  <section className="page-stack">
    <section className="timeline-preview-section">
      <header className="timeline-preview-heading">
        <p className="timeline-preview-eyebrow">Preview area</p>
        <h1>Homepage</h1>
        <p>Live network metrics, promotion area and latest block cards.</p>
      </header>
      <PoolAdsPreview />
      <MetricsBar metrics={previewCardanoMetrics} type="cardano" />
      <BlockTicker blocks={previewGridBlocks} />
    </section>

    <section className="timeline-preview-section">
      <header className="timeline-preview-heading">
        <p className="timeline-preview-eyebrow">Preview area</p>
        <h1>Pool detail page</h1>
        <p>Pool status variants, pool metrics and the event grid.</p>
      </header>
      <PoolIdentity
        pool={{ ticker: 'RETI', name: 'Retiring Pool', retiring_epoch: 650, current_epoch: 644, saturation_percent: 45 }}
        poolId="pool1previewretiring"
      />
      <PoolIdentity
        pool={{ ticker: 'DONE', name: 'Retired Pool', retiring_epoch: 620, current_epoch: 644, saturation_percent: 45 }}
        poolId="pool1previewretired"
      />
      <PoolIdentity
        pool={{ ticker: 'SATU', name: 'Oversaturated Pool', saturation_percent: 142 }}
        poolId="pool1previewoversaturated"
      />
      <PoolIdentity
        pool={{ ticker: 'NORM', name: 'Normal Pool', retiring_epoch: null, saturation_percent: 45 }}
        poolId="pool1previewnormal"
      />
      <MetricsBar metrics={previewPoolMetrics} type="pool" epoch={previewCardanoMetrics} />
      <PoolBlockTimeline previewItems={timelinePreviewItems} layout="grid" />
    </section>
  </section>
);

export default TimelinePreviewPage;
