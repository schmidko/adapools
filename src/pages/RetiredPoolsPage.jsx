import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import { Alert, Avatar, Card, Empty, Spin, Tag, Typography } from 'antd';
import { api } from '../api/client.js';
import Seo from '../components/Seo.jsx';
import { compactPoolId, formatAda, formatAgeAgo } from '../utils/format.js';

const PAGE_TITLE = 'Recently Retired Cardano Pools | adapools.xyz';
const PAGE_DESCRIPTION = 'Monitor recent Cardano stake pool retirement filings, their effective epochs, and the active stake remaining at retirement.';

const formatTimestamp = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const RetiredPoolsPage = () => {
  const [result, setResult] = useState({ retirements: [], stale: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api.getRetiredPools()
      .then((nextResult) => {
        if (mounted) setResult(nextResult);
      })
      .catch(() => {
        if (mounted) setError('Recent retirement filings are temporarily unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Recently Retired Cardano Pools',
    description: PAGE_DESCRIPTION,
    url: 'https://adapools.xyz/pools/retired',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: result.retirements?.length || 0,
      itemListElement: (result.retirements || []).map((pool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://adapools.xyz/pool/${pool.pool_id}`,
        name: pool.ticker || pool.name || pool.pool_id
      }))
    }
  }), [result.retirements]);

  return (
    <div className="page-stack retired-pools-page">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/pools/retired" jsonLd={jsonLd} />
      <div className="retired-pools-heading">
        <div>
          <Typography.Title level={1}>Recently retired pools</Typography.Title>
          <Typography.Paragraph type="secondary">
            The latest Cardano pool retirement filings, including the effective epoch and remaining active stake.
          </Typography.Paragraph>
        </div>
        <Link className="back-link" to="/discover"><ArrowLeftOutlined /> Discover pools</Link>
      </div>

      {result.stale && <Alert showIcon type="warning" message="Showing recently cached retirement data." />}
      {error && <Alert showIcon type="error" message={error} />}
      {loading && <div className="retired-pools-loading"><Spin size="large" /></div>}

      {!loading && !error && (
        <Card
          className="retired-pools-card"
          title={<span className="retired-pools-card-title"><ClockCircleOutlined /> Recent retirement filings</span>}
          extra={<Tag>{result.retirements?.length || 0} pools</Tag>}
        >
          {result.retirements?.length ? (
            <div className="retired-pools-list">
              {result.retirements.map((pool) => {
                const label = pool.ticker || pool.name || compactPoolId(pool.pool_id);
                return (
                  <article className="retired-pool-row" key={pool.pool_id}>
                    <Avatar shape="square" size={48} src={pool.logo || undefined}>{label.slice(0, 2).toUpperCase()}</Avatar>
                    <div className="retired-pool-identity">
                      <Link to={`/pool/${encodeURIComponent(pool.pool_id)}`}>{label}</Link>
                      <span title={pool.pool_id}>{pool.name || compactPoolId(pool.pool_id)}</span>
                    </div>
                    <div className="retired-pool-metric">
                      <span>Filed</span>
                      <strong>Epoch {pool.announced_epoch ?? '—'}</strong>
                      <small title={formatTimestamp(pool.announced_time)}>{formatAgeAgo(pool.announced_time)}</small>
                    </div>
                    <div className="retired-pool-metric">
                      <span>Effective</span>
                      <strong>Epoch {pool.retiring_epoch ?? '—'}</strong>
                    </div>
                    <div className="retired-pool-metric retired-pool-stake">
                      <span>Remaining stake</span>
                      <strong>{formatAda(pool.active_stake, 0)}</strong>
                    </div>
                    {pool.website && (
                      <a className="retired-pool-website" href={pool.website} target="_blank" rel="noreferrer" aria-label={`Open ${label} website`}>
                        <GlobalOutlined />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          ) : <Empty description="No recent retirement filings found." />}
        </Card>
      )}
    </div>
  );
};

export default RetiredPoolsPage;
