import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Table, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api/client.js';
import { compactPoolId, formatAda, formatPercent } from '../utils/format.js';
import Seo from '../components/Seo.jsx';

const PAGE_SIZE = 50;

const formatDate = (value) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : '—';

const PoolDelegatorsPage = () => {
  const { poolId } = useParams();
  const [data, setData] = useState({ delegators: [], total: 0, page: 1, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getPoolDelegators(poolId, { page, limit: PAGE_SIZE }));
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, [poolId]);

  const columns = [
    { title: '#', dataIndex: 'rank', width: 72 },
    {
      title: 'Stake address',
      dataIndex: 'stake_address',
      render: (address) => <span className="stake-address" title={address}>{compactPoolId(address)}</span>
    },
    {
      title: 'Delegated stake',
      dataIndex: 'stake_lovelace',
      align: 'right',
      render: (stake) => formatAda(stake)
    },
    {
      title: 'Pool share',
      key: 'share',
      align: 'right',
      render: (_, row) => formatPercent(row.pool_share_percent)
    },
    {
      title: 'Active since epoch',
      dataIndex: 'active_since_epoch',
      align: 'right',
      render: (epoch) => epoch ?? '—'
    },
    {
      title: 'Last delegation',
      dataIndex: 'delegated_at',
      render: formatDate
    }
  ];

  return (
    <section className="page-stack">
      <Seo
        title={`Delegators | ${compactPoolId(poolId)} | adapools.xyz`}
        description={`Current delegators for Cardano stake pool ${poolId}, ranked by delegated stake.`}
        path={`/pool/${poolId}/delegators`}
      />
      <div className="delegators-page-heading">
        <div>
          <Link className="back-link" to={`/pool/${encodeURIComponent(poolId)}`}><ArrowLeftOutlined /> Pool details</Link>
          <Typography.Title level={2}>Pool delegators</Typography.Title>
          <Typography.Text type="secondary">{compactPoolId(poolId)} · Current epoch snapshot · Ranked by delegated stake</Typography.Text>
        </div>
      </div>
      {error ? (
        <Alert
          type="error"
          showIcon
          message="Delegators could not be loaded"
          description="Please try again in a moment."
          action={<Button size="small" onClick={() => load(data.page)}>Retry</Button>}
        />
      ) : (
        <Table
          className="pool-delegators-table"
          columns={columns}
          dataSource={data.delegators}
          rowKey="stake_address"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: data.page,
            pageSize: PAGE_SIZE,
            total: data.total,
            showSizeChanger: false,
            showTotal: (total) => `${total.toLocaleString()} delegators`,
            onChange: load
          }}
        />
      )}
    </section>
  );
};

export default PoolDelegatorsPage;
