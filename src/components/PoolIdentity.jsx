import { Avatar, Space, Tag, Tooltip, Typography } from 'antd';
import { compactPoolId } from '../utils/format.js';

const PoolIdentity = ({ pool = {}, poolId }) => {
  const label = pool.ticker || pool.name || poolId || 'Pool';
  const initials = label.slice(0, 2).toUpperCase();

  const retiringEpoch = Number(pool.retiring_epoch);
  const isRetiring = pool.retiring_epoch != null && Number.isFinite(retiringEpoch);
  const saturationPercent = Number(pool.saturation_percent);
  const isOversaturated = Number.isFinite(saturationPercent) && saturationPercent > 100;

  return (
    <div className="pool-identity">
      <Avatar size={52} shape="square" src={pool.logo || undefined}>
        {initials}
      </Avatar>
      <Space direction="vertical" size={0}>
        <Space size={10} align="center" wrap>
          <Typography.Title level={2} className="pool-title">
            {pool.ticker || pool.name || compactPoolId(poolId)}
          </Typography.Title>
          {isRetiring && (
            <Tooltip title={`This pool is retiring at epoch ${retiringEpoch}`}>
              <Tag color="error">Retiring</Tag>
            </Tooltip>
          )}
          {isOversaturated && (
            <Tooltip title="This pool is above 100% saturation. New delegations may earn reduced rewards.">
              <Tag color="warning">Oversaturated</Tag>
            </Tooltip>
          )}
        </Space>
        <Typography.Text type="secondary">
          {pool.name && pool.ticker ? pool.name : compactPoolId(poolId)}
        </Typography.Text>
      </Space>
    </div>
  );
};

export default PoolIdentity;
