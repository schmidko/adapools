import { Avatar, Space, Typography } from 'antd';
import { compactPoolId } from '../utils/format.js';

const PoolIdentity = ({ pool = {}, poolId }) => {
  const label = pool.ticker || pool.name || poolId || 'Pool';
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <div className="pool-identity">
      <Avatar size={52} shape="square" src={pool.logo || undefined}>
        {initials}
      </Avatar>
      <Space direction="vertical" size={0}>
        <Typography.Title level={2} className="pool-title">
          {pool.ticker || pool.name || compactPoolId(poolId)}
        </Typography.Title>
        <Typography.Text type="secondary">
          {pool.name && pool.ticker ? pool.name : compactPoolId(poolId)}
        </Typography.Text>
      </Space>
    </div>
  );
};

export default PoolIdentity;
