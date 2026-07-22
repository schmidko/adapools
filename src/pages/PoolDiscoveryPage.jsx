import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Avatar, Button, Input, InputNumber, Select, Table, Tag, Typography } from 'antd';
import { api } from '../api/client.js';
import Seo from '../components/Seo.jsx';
import { compactPoolId, formatAda, formatNumber, formatPercent } from '../utils/format.js';

const DEFAULT_PARAMS = {
  page: '1',
  limit: '50',
  sortBy: 'active_stake',
  sortOrder: 'desc'
};

const FILTER_KEYS = [
  'search', 'status', 'minStake', 'maxStake', 'minDelegators', 'maxDelegators',
  'minBlocks', 'maxBlocks', 'minMargin', 'maxMargin', 'minSaturation',
  'maxSaturation', 'minFixedCost', 'maxFixedCost', 'minPledge', 'maxPledge',
  'registeredAfter', 'registeredBefore'
];

const getParams = (searchParams) => ({
  ...DEFAULT_PARAMS,
  ...Object.fromEntries([...searchParams.entries()].filter(([, value]) => value !== ''))
});

const PoolDiscoveryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const params = useMemo(() => getParams(new URLSearchParams(queryString)), [queryString]);
  const [inputSearch, setInputSearch] = useState(params.search || '');
  const [result, setResult] = useState({ pools: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => setInputSearch(params.search || ''), [params.search]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getPoolDiscovery(params)
      .then((nextResult) => {
        if (mounted) setResult(nextResult);
      })
      .catch((error) => {
        console.error('[adapools] Failed to load pool discovery:', error);
        if (mounted) setResult({ pools: [], total: 0 });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params]);

  const updateParams = (updates, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage) next.set('page', '1');
    setSearchParams(next);
  };

  const resetFilters = () => {
    setInputSearch('');
    setSearchParams(DEFAULT_PARAMS);
  };

  const sortOrder = params.sortOrder === 'asc' ? 'ascend' : 'descend';
  const columns = [
    {
      title: 'Pool',
      key: 'pool',
      width: 260,
      sorter: true,
      sortOrder: params.sortBy === 'pool' ? sortOrder : null,
      render: (_, pool) => {
        const label = pool.ticker || pool.name || compactPoolId(pool.pool_id);
        return (
          <Link className="discovery-pool" to={`/pool/${encodeURIComponent(pool.pool_id)}`}>
            <Avatar shape="square" size={40} src={pool.logo || undefined}>{label.slice(0, 2).toUpperCase()}</Avatar>
            <span>
              <strong>{label}</strong>
              <small>{pool.name || compactPoolId(pool.pool_id)}</small>
            </span>
          </Link>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 104,
      render: (status) => <Tag color={status === 'Active' ? 'success' : status === 'Retiring' ? 'warning' : 'default'}>{status}</Tag>
    },
    {
      title: 'Active stake',
      dataIndex: 'active_stake_lovelace',
      key: 'active_stake',
      align: 'right',
      width: 150,
      sorter: true,
      sortOrder: params.sortBy === 'active_stake' ? sortOrder : null,
      render: (value) => formatAda(value, 0)
    },
    {
      title: 'Delegators',
      dataIndex: 'delegators',
      key: 'delegators',
      align: 'right',
      width: 120,
      sorter: true,
      sortOrder: params.sortBy === 'delegators' ? sortOrder : null,
      render: formatNumber
    },
    {
      title: 'Blocks',
      dataIndex: 'lifetime_blocks',
      key: 'blocks',
      align: 'right',
      width: 105,
      sorter: true,
      sortOrder: params.sortBy === 'blocks' ? sortOrder : null,
      render: formatNumber
    },
    {
      title: 'Saturation',
      dataIndex: 'saturation_percent',
      key: 'saturation',
      align: 'right',
      width: 120,
      sorter: true,
      sortOrder: params.sortBy === 'saturation' ? sortOrder : null,
      render: formatPercent
    },
    {
      title: 'Margin',
      dataIndex: 'margin_percent',
      key: 'margin',
      align: 'right',
      width: 100,
      sorter: true,
      sortOrder: params.sortBy === 'margin' ? sortOrder : null,
      render: formatPercent
    },
    {
      title: 'Fixed cost',
      dataIndex: 'fixed_cost_lovelace',
      key: 'fixed_cost',
      align: 'right',
      width: 125,
      sorter: true,
      sortOrder: params.sortBy === 'fixed_cost' ? sortOrder : null,
      render: (value) => formatAda(value, 0)
    },
    {
      title: 'Pledge',
      dataIndex: 'pledge_lovelace',
      key: 'pledge',
      align: 'right',
      width: 135,
      sorter: true,
      sortOrder: params.sortBy === 'pledge' ? sortOrder : null,
      render: (value) => formatAda(value, 0)
    },
    {
      title: 'Registered',
      dataIndex: 'registered_on',
      key: 'registered',
      width: 128,
      sorter: true,
      sortOrder: params.sortBy === 'registered' ? sortOrder : null,
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      title: 'Website',
      dataIndex: 'homepage',
      width: 190,
      ellipsis: true,
      render: (value) => value ? <a href={value} target="_blank" rel="noreferrer">{value.replace(/^https?:\/\//, '')}</a> : '-'
    }
  ];

  const handleTableChange = (pagination, _, sorter) => {
    const nextSort = Array.isArray(sorter) ? sorter[0] : sorter;
    if (nextSort?.order) {
      updateParams({
        sortBy: nextSort.columnKey || 'active_stake',
        sortOrder: nextSort.order === 'ascend' ? 'asc' : 'desc'
      });
      return;
    }
    if (pagination.current !== Number(params.page) || pagination.pageSize !== Number(params.limit)) {
      updateParams({ page: pagination.current, limit: pagination.pageSize }, false);
    }
  };

  const hasFilters = FILTER_KEYS.some((key) => params[key]);

  return (
    <section className="page-stack pool-discovery-page">
      <Seo
        title="Discover Cardano Pools | adapools.xyz"
        description="Find Cardano stake pools by stake, delegators, saturation, margin, pledge, blocks and registration date."
        path="/discover"
      />
      <div className="discovery-heading">
        <div>
          <Typography.Title level={1}>Discover new pools</Typography.Title>
          <Typography.Text type="secondary">Search and compare Cardano stake pools</Typography.Text>
        </div>
        <Typography.Text type="secondary">{formatNumber(result.total)} pools</Typography.Text>
      </div>
      <div className="discovery-controls">
        <Input.Search
          allowClear
          value={inputSearch}
          prefix={<SearchOutlined />}
          placeholder="Ticker, name or pool ID"
          onChange={(event) => {
            setInputSearch(event.target.value);
            if (!event.target.value) updateParams({ search: null });
          }}
          onSearch={(value) => updateParams({ search: value.trim() })}
        />
        <Select
          value={params.status || 'all'}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'retiring', label: 'Retiring' },
            { value: 'retired', label: 'Retired' }
          ]}
          onChange={(value) => updateParams({ status: value === 'all' ? null : value })}
        />
        <Button icon={<ReloadOutlined />} disabled={!hasFilters} onClick={resetFilters}>Reset</Button>
      </div>
      <div className="discovery-filters">
        <InputNumber addonBefore="Stake min" addonAfter="ADA" min={0} value={params.minStake || null} onChange={(value) => updateParams({ minStake: value })} />
        <InputNumber addonBefore="Stake max" addonAfter="ADA" min={0} value={params.maxStake || null} onChange={(value) => updateParams({ maxStake: value })} />
        <InputNumber addonBefore="Delegators min" min={0} value={params.minDelegators || null} onChange={(value) => updateParams({ minDelegators: value })} />
        <InputNumber addonBefore="Delegators max" min={0} value={params.maxDelegators || null} onChange={(value) => updateParams({ maxDelegators: value })} />
        <InputNumber addonBefore="Blocks min" min={0} value={params.minBlocks || null} onChange={(value) => updateParams({ minBlocks: value })} />
        <InputNumber addonBefore="Blocks max" min={0} value={params.maxBlocks || null} onChange={(value) => updateParams({ maxBlocks: value })} />
        <InputNumber addonBefore="Margin min" addonAfter="%" min={0} value={params.minMargin || null} onChange={(value) => updateParams({ minMargin: value })} />
        <InputNumber addonBefore="Margin max" addonAfter="%" min={0} value={params.maxMargin || null} onChange={(value) => updateParams({ maxMargin: value })} />
        <InputNumber addonBefore="Saturation min" addonAfter="%" min={0} value={params.minSaturation || null} onChange={(value) => updateParams({ minSaturation: value })} />
        <InputNumber addonBefore="Saturation max" addonAfter="%" min={0} value={params.maxSaturation || null} onChange={(value) => updateParams({ maxSaturation: value })} />
        <InputNumber addonBefore="Fixed cost min" addonAfter="ADA" min={0} value={params.minFixedCost || null} onChange={(value) => updateParams({ minFixedCost: value })} />
        <InputNumber addonBefore="Fixed cost max" addonAfter="ADA" min={0} value={params.maxFixedCost || null} onChange={(value) => updateParams({ maxFixedCost: value })} />
        <InputNumber addonBefore="Pledge min" addonAfter="ADA" min={0} value={params.minPledge || null} onChange={(value) => updateParams({ minPledge: value })} />
        <InputNumber addonBefore="Pledge max" addonAfter="ADA" min={0} value={params.maxPledge || null} onChange={(value) => updateParams({ maxPledge: value })} />
        <Input addonBefore="Registered after" type="date" value={params.registeredAfter || ''} onChange={(event) => updateParams({ registeredAfter: event.target.value })} aria-label="Registered after" />
        <Input addonBefore="Registered before" type="date" value={params.registeredBefore || ''} onChange={(event) => updateParams({ registeredBefore: event.target.value })} aria-label="Registered before" />
      </div>
      <Table
        className="pool-discovery-table"
        columns={columns}
        dataSource={result.pools}
        loading={loading}
        rowKey="pool_id"
        scroll={{ x: 1530 }}
        onChange={handleTableChange}
        pagination={{
          current: Number(params.page),
          pageSize: Number(params.limit),
          total: result.total,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
        }}
      />
    </section>
  );
};

export default PoolDiscoveryPage;
