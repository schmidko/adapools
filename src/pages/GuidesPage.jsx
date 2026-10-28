import { ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

const guides = [
  {
    path: '/guides/choose-cardano-stake-pool',
    eyebrow: 'Getting started',
    title: 'How to choose a Cardano stake pool',
    description: 'A practical framework for comparing pool status, saturation, fees, pledge and recent block activity.'
  },
  {
    path: '/guides/cardano-pool-saturation',
    eyebrow: 'Pool metrics',
    title: 'Cardano pool saturation explained',
    description: 'Learn what saturation means, why it matters to delegation and how to read it alongside stake and block history.'
  },
  {
    path: '/guides/cardano-stake-pool-fees',
    eyebrow: 'Pool metrics',
    title: 'Cardano stake pool fees: margin and fixed cost',
    description: 'Understand the two pool fee settings and why they should be considered together with pool size and performance.'
  }
];

const GuidesPage = () => (
  <section className="page-stack guides-page">
    <Seo
      title="Cardano Staking Guides & Pool Metrics Explained | adapools.xyz"
      description="Practical Cardano staking guides: compare stake pools, understand saturation, margins, fixed costs, pledge and block performance."
      path="/guides"
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Cardano staking guides',
        description: 'Practical guides to comparing Cardano stake pools and understanding pool metrics.',
        url: 'https://adapools.xyz/guides'
      }}
    />
    <header className="guides-hero">
      <Tag icon={<BookOutlined />} color="blue">Cardano staking guides</Tag>
      <Typography.Title level={1}>Make sense of Cardano stake pool data</Typography.Title>
      <Typography.Paragraph>
        Clear, practical explainers for reading pool metrics before you delegate. These guides describe how the protocol and common pool settings work; they are not investment advice or reward forecasts.
      </Typography.Paragraph>
    </header>
    <div className="guide-grid">
      {guides.map((guide) => (
        <Link key={guide.path} to={guide.path} className="guide-card-link">
          <Card className="guide-card" bordered>
            <span className="guide-card-eyebrow">{guide.eyebrow}</span>
            <Typography.Title level={2}>{guide.title}</Typography.Title>
            <Typography.Paragraph>{guide.description}</Typography.Paragraph>
            <span className="guide-card-cta">Read guide <ArrowRightOutlined /></span>
          </Card>
        </Link>
      ))}
    </div>
  </section>
);

export default GuidesPage;
