const LOVELACE_PER_ADA = 1000000;

export const formatAda = (lovelace, maximumFractionDigits = 2) => {
  const value = Number(lovelace || 0) / LOVELACE_PER_ADA;
  return `${value.toLocaleString(undefined, { maximumFractionDigits })} ADA`;
};

export const formatNumber = (value) => Number(value || 0).toLocaleString();

export const formatPercent = (value) => {
  const number = Number(value || 0);
  if (number > 0 && number < 0.1) return '<0.1%';
  return `${number.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
};

export const formatAge = (value, now = Date.now()) => {
  if (!value) return '';
  const diffSeconds = Math.max(Math.floor((now - new Date(value).getTime()) / 1000), 0);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  return `${Math.floor(diffSeconds / 86400)}d`;
};

export const compactPoolId = (poolId = '') => {
  if (poolId.length <= 16) return poolId;
  return `${poolId.slice(0, 10)}...${poolId.slice(-6)}`;
};
