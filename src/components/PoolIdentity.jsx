import { Avatar, Space, Tag, Tooltip, Typography } from 'antd';
import { compactPoolId } from '../utils/format.js';

const PoolIdentity = ({ pool = {}, poolId }) => {
  const label = pool.ticker || pool.name || poolId || 'Pool';
  const initials = label.slice(0, 2).toUpperCase();

  const retiringEpoch = Number(pool.retiring_epoch);
  const hasRetirement = pool.retiring_epoch != null && Number.isFinite(retiringEpoch);
  const currentEpoch = Number(pool.current_epoch);
  const isRetired = hasRetirement && Number.isFinite(currentEpoch) && currentEpoch >= retiringEpoch;
  const isRetiring = hasRetirement && !isRetired;
  const saturationPercent = Number(pool.saturation_percent);
  const isOversaturated = Number.isFinite(saturationPercent) && saturationPercent > 100;

  return (
    <div className="pool-identity">
      <Avatar size={80} shape="square" src={pool.logo || undefined}>
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
          {isRetired && (
            <Tooltip title={`This pool retired at epoch ${retiringEpoch}`}>
              <Tag color="default">Retired</Tag>
            </Tooltip>
          )}
          {isOversaturated && (
            <Tooltip title="This pool is above 100% saturation. New delegations may earn reduced rewards.">
              <Tag color="warning">Oversaturated</Tag>
            </Tooltip>
          )}
        </Space>
        {pool.name && pool.ticker && (
          <Typography.Text type="secondary">{pool.name}</Typography.Text>
        )}
        <Typography.Text
          type="secondary"
          className="pool-id-text"
          copyable={{ text: poolId, tooltips: ['Copy pool ID', 'Copied'] }}
        >
          {compactPoolId(poolId)}
        </Typography.Text>
      </Space>
    </div>
  );
};

export default PoolIdentity;
