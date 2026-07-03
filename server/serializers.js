const toIso = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

export const serializeBlock = (block) => {
  if (!block) return null;
  const { _id, ...rest } = block;
  return {
    ...rest,
    time: toIso(rest.time),
    created_at: toIso(rest.created_at),
    synced_at: toIso(rest.synced_at)
  };
};

export const serializeDocument = (document) => {
  if (!document) return null;
  const { _id, ...rest } = document;
  return Object.fromEntries(
    Object.entries(rest).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  );
};

export const parseLimit = (value, fallback = 120, max = 240) => {
  const parsed = parseInt(value || fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};
