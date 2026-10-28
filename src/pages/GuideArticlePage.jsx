import { ArrowLeftOutlined, CompassOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Tag, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

const GUIDE_DATA = {
  'choose-cardano-stake-pool': {
    title: 'How to Choose a Cardano Stake Pool | adapools.xyz',
    heading: 'How to choose a Cardano stake pool',
    description: 'A practical guide to comparing Cardano stake pools by status, saturation, fees, pledge and block activity.',
    intro: 'A good pool choice is more than a rank or a single reward estimate. Use a small set of current, comparable metrics and check that the pool is active, transparently operated and aligned with your preferences.',
    sections: [
      ['Start with pool status and identity', 'Confirm that the pool is active, has a clear ticker or name, and publishes enough information for you to understand who operates it. A current website and a consistent pool identity are useful signals to investigate, not guarantees of quality.'],
      ['Read saturation with active stake', 'Saturation shows how close a pool is to the protocol’s target stake level. Compare it with active stake and recent block history instead of treating any one percentage as a standalone verdict.'],
      ['Compare fees in context', 'Margin and fixed cost are both part of the pool’s declared economics. Small pools can be affected differently by fixed cost than larger pools, so compare the full fee structure alongside pool size and observed activity.'],
      ['Check block history over time', 'Block production is probabilistic. A short window can be noisy, especially for smaller pools. Look for an established history and use more than one epoch or recent-block snapshot before drawing conclusions.'],
      ['Review pledge and communication', 'Pledge is one protocol input and can signal operator commitment. It should not replace checking status, fee settings, history and public communication. Delegation does not transfer ownership of your ada.']
    ]
  },
  'cardano-pool-saturation': {
    title: 'Cardano Pool Saturation Explained | adapools.xyz',
    heading: 'Cardano pool saturation explained',
    description: 'Learn what Cardano stake pool saturation means, how it relates to rewards and why it should be read with other pool metrics.',
    intro: 'Saturation is a protocol concept that helps distribute stake across pools. It is useful for comparing delegation choices, but it does not describe operator quality or future rewards on its own.',
    sections: [
      ['What saturation measures', 'Saturation relates a pool’s delegated stake to the protocol’s target pool size. As a pool approaches that target, additional stake does not increase the pool reward in the same way as before.'],
      ['Why it matters for delegation', 'The incentive design encourages stake to spread across pools rather than concentrate indefinitely. A pool near or above saturation deserves a closer look when you compare alternatives.'],
      ['Why the number can change', 'Active stake, protocol parameters and delegation changes all affect the calculation. Treat the displayed value as a current signal, not a permanent classification.'],
      ['Use saturation with other metrics', 'Pair it with pool status, fees, pledge, recent blocks and operator information. This gives a more useful picture than optimizing for a single number.']
    ]
  },
  'cardano-stake-pool-fees': {
    title: 'Cardano Stake Pool Fees: Margin and Fixed Cost | adapools.xyz',
    heading: 'Cardano stake pool fees: margin and fixed cost',
    description: 'Understand Cardano stake pool margin and fixed cost, and how both settings relate to pool size, block production and delegation.',
    intro: 'Pool fees are declared as a fixed cost and a margin. They help cover pool operation and shape how rewards are distributed after a pool produces rewards; they do not predict a future return by themselves.',
    sections: [
      ['Fixed cost', 'The fixed cost is deducted from pool rewards before the remaining rewards are shared. Its practical effect depends on the pool’s reward amount, so it is important to view it alongside the pool’s size and activity.'],
      ['Margin', 'Margin is the operator’s percentage share after the fixed cost. It is one comparison point, but a lower margin does not by itself establish reliability, performance or suitability.'],
      ['Read fees with block history', 'A pool’s ability to produce blocks and its delegated stake affect the reward pool from which costs and margin are taken. Compare the same time horizon across pools.'],
      ['Avoid headline-only comparisons', 'Use the pool’s current settings, saturation and recent activity together. Protocol conditions and pool parameters can change, so revisit the data before making a delegation decision.']
    ]
  }
};

const GuideArticlePage = () => {
  const { guideSlug } = useParams();
  const guide = GUIDE_DATA[guideSlug];

  if (!guide) return null;

  const path = `/guides/${guideSlug}`;
  return (
    <article className="guide-article">
      <Seo
        title={guide.title}
        description={guide.description}
        path={path}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.heading,
          description: guide.description,
          mainEntityOfPage: `https://adapools.xyz${path}`,
          publisher: { '@type': 'Organization', name: 'adapools.xyz' }
        }}
      />
      <div className="guide-article-topline">
        <Link className="back-link" to="/guides"><ArrowLeftOutlined /> All guides</Link>
        <Tag color="blue">Cardano staking guide</Tag>
      </div>
      <header className="guide-article-header">
        <Typography.Title level={1}>{guide.heading}</Typography.Title>
        <Typography.Paragraph>{guide.intro}</Typography.Paragraph>
      </header>
      <Alert
        className="guide-notice"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Use live data for a current comparison"
        description="Pool settings, stake and network conditions can change. This guide explains the metrics; adapools.xyz shows their current values."
      />
      <div className="guide-article-layout">
        <aside className="guide-toc" aria-label="Guide sections">
          <strong>In this guide</strong>
          {guide.sections.map(([heading], index) => <a key={heading} href={`#section-${index + 1}`}>{heading}</a>)}
        </aside>
        <div className="guide-content">
          {guide.sections.map(([heading, text], index) => (
            <section id={`section-${index + 1}`} key={heading} className="guide-section">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <Typography.Title level={2}>{heading}</Typography.Title>
                <Typography.Paragraph>{text}</Typography.Paragraph>
              </div>
            </section>
          ))}
          <section className="guide-action">
            <div>
              <span>Next step</span>
              <Typography.Title level={3}>Compare live Cardano pool data</Typography.Title>
              <Typography.Paragraph>Use the pool explorer to filter pools and review current stake, saturation, fees, delegators and block history.</Typography.Paragraph>
            </div>
            <Link to="/discover" className="guide-action-link"><CompassOutlined /> Compare pools</Link>
          </section>
          <p className="guide-source">Protocol background: <a href="https://docs.cardano.org/learn/pledging-and-delegation-options/" target="_blank" rel="noreferrer">Cardano Docs on pledging and rewards</a>.</p>
        </div>
      </div>
    </article>
  );
};

export default GuideArticlePage;
