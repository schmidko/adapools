import { Alert } from 'antd';

const SyncStatus = ({ states = [] }) => {
  const stale = states.find((state) => Number(state.lag_seconds || 0) > 60);
  if (!stale) return null;

  return (
    <Alert
      type="warning"
      showIcon
      message={`Data lag: ${stale.lag_seconds}s`}
      className="sync-alert"
    />
  );
};

export default SyncStatus;
