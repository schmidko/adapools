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

export const formatAgeAgo = (value, now = Date.now()) => {
  if (!value) return '';
  const diffSeconds = Math.max(Math.floor((now - new Date(value).getTime()) / 1000), 0);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 30 * 86400) {
    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const dayLabel = `${days} ${days === 1 ? 'day' : 'days'}`;
    return `${dayLabel} ${hours}h ago`;
  }
  if (diffSeconds < 365 * 86400) {
    const months = Math.floor(diffSeconds / (30 * 86400));
    const remainderSeconds = diffSeconds % (30 * 86400);
    const days = Math.floor(remainderSeconds / 86400);
    const hours = Math.floor((remainderSeconds % 86400) / 3600);
    const dayLabel = days ? ` ${days}d` : '';
    return `${months} ${months === 1 ? 'month' : 'months'}${dayLabel} ${hours}h ago`;
  }
  const years = Math.floor(diffSeconds / (365 * 86400));
  const remainderSeconds = diffSeconds % (365 * 86400);
  const months = Math.floor(remainderSeconds / (30 * 86400));
  const hours = Math.floor((remainderSeconds % (30 * 86400)) / 3600);
  const monthLabel = months ? ` ${months}mo` : '';
  return `${years} ${years === 1 ? 'year' : 'years'}${monthLabel} ${hours}h ago`;
};

export const compactPoolId = (poolId = '') => {
  if (poolId.length <= 16) return poolId;
  return `${poolId.slice(0, 10)}...${poolId.slice(-6)}`;
};
