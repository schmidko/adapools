import { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { compactPoolId } from '../utils/format.js';

const normalize = (value = '') => value.toLowerCase().trim();

const buildSearchText = (pool) => normalize([
  pool.ticker,
  pool.name,
  pool.pool_id
].filter(Boolean).join(' '));

const optionLabel = (pool) => (
  <div className="pool-search-option">
    <span className="pool-search-option-title">
      {pool.ticker || pool.name || compactPoolId(pool.pool_id)}
    </span>
    <span className="pool-search-option-subtitle">
      {pool.ticker && pool.name ? pool.name : compactPoolId(pool.pool_id)}
    </span>
  </div>
);

const PoolSearch = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    api.getPoolSearchIndex()
      .then((result) => {
        if (mounted) {
          setPools(result.map((pool) => ({
            ...pool,
            searchText: buildSearchText(pool)
          })));
        }
      })
      .catch((error) => {
        console.error('[adapools] Failed to load pool search index:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(() => {
    const needle = normalize(query);
    if (needle.length < 3) return [];

    return pools
      .filter((pool) => pool.searchText.includes(needle))
      .sort((a, b) => {
        const aTicker = normalize(a.ticker);
        const bTicker = normalize(b.ticker);
        const aName = normalize(a.name);
        const bName = normalize(b.name);
        const scoreA = aTicker.startsWith(needle) ? 0 : aName.startsWith(needle) ? 1 : 2;
        const scoreB = bTicker.startsWith(needle) ? 0 : bName.startsWith(needle) ? 1 : 2;
        return scoreA - scoreB || (a.ticker || a.name || '').localeCompare(b.ticker || b.name || '');
      })
      .slice(0, 10)
      .map((pool) => ({
        value: pool.pool_id,
        label: optionLabel(pool)
      }));
  }, [pools, query]);

  const navigateToPool = (poolId) => {
    if (!poolId) return;
    setQuery('');
    navigate(`/pool/${encodeURIComponent(poolId)}`);
  };

  return (
    <AutoComplete
      className="pool-search"
      options={options}
      value={query}
      onChange={setQuery}
      onSelect={navigateToPool}
      popupMatchSelectWidth={false}
    >
      <Input
        allowClear
        className="pool-search-input"
        prefix={<SearchOutlined />}
        placeholder="Search pools"
        onPressEnter={() => {
          if (options[0]?.value) navigateToPool(options[0].value);
        }}
      />
    </AutoComplete>
  );
};

export default PoolSearch;
