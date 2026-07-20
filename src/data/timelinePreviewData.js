const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

const EPOCH_LENGTH_SLOTS = 432000;
const previewEpochSlotNo = 210000;

export const previewCardanoMetrics = {
  current_epoch: 560,
  epoch_slot_no: previewEpochSlotNo,
  epoch_progress_percent: Number(((previewEpochSlotNo / EPOCH_LENGTH_SLOTS) * 100).toFixed(2)),
  latest_block_no: 11700000,
  active_pools: 3000,
  avg_block_fullness_1h: 47.2
};

export const previewPoolMetrics = {
  active_stake_lovelace: '123456789000000',
  delegators: 1234,
  blocks_epoch: 3,
  total_blocks: 12345,
  lifetime_blocks: 12345,
  saturation_percent: 63.1
};

export const previewGridBlocks = [
  {
    block_no: 13700432,
    time: minutesAgo(1),
    total_output_lovelace: '256400000000',
    total_fees_lovelace: '3980000',
    tx_count: 21,
    fullness_percent: 62.4,
    pool: { ticker: 'BLOX', bech32_pool_id: 'pool1previewblox8q7ylx2n39x' }
  },
  {
    block_no: 13700427,
    time: minutesAgo(7),
    total_output_lovelace: '183000000000',
    total_fees_lovelace: '2740000',
    tx_count: 16,
    fullness_percent: 44.8,
    pool: { ticker: 'HAM', bech32_pool_id: 'pool1previewham8q7ylx2n39x' }
  },
  {
    block_no: 13700421,
    time: minutesAgo(13),
    total_output_lovelace: '94200000000',
    total_fees_lovelace: '1880000',
    tx_count: 9,
    fullness_percent: 26.2,
    pool: { ticker: 'LACE', bech32_pool_id: 'pool1previewlace8q7ylx2n39x' }
  },
  {
    block_no: 13700416,
    time: minutesAgo(19),
    total_output_lovelace: '318600000000',
    total_fees_lovelace: '4760000',
    tx_count: 28,
    fullness_percent: 78.1,
    pool: { ticker: 'NOVA', bech32_pool_id: 'pool1previewnova8q7ylx2n39x' }
  },
  {
    block_no: 13700412,
    time: minutesAgo(24),
    total_output_lovelace: '126700000000',
    total_fees_lovelace: '2190000',
    tx_count: 12,
    fullness_percent: 35.6,
    pool: { ticker: 'WAVE', bech32_pool_id: 'pool1previewwave8q7ylx2n39x' }
  },
  {
    block_no: 13700406,
    time: minutesAgo(31),
    total_output_lovelace: '289500000000',
    total_fees_lovelace: '4310000',
    tx_count: 24,
    fullness_percent: 69.3,
    pool: { ticker: 'MINT', bech32_pool_id: 'pool1previewmint8q7ylx2n39x' }
  }
];

export const timelinePreviewItems = [
  {
    event_id: 'preview-lifecycle-retired',
    kind: 'pool_lifecycle',
    epoch_no: 644,
    time: minutesAgo(60 * 24 * 12),
    tx_hash: 'previewretirementtransaction8q7ylx2n39x',
    lifecycle: {
      stage: 'retired',
      retiring_epoch: 644,
      announced_time: minutesAgo(60 * 24 * 18)
    }
  },
  {
    event_id: 'preview-delegation-in',
    kind: 'delegation_change',
    epoch_no: 644,
    time: minutesAgo(1),
    stake_address: 'stake1u9previewnewdelegation9n39x8qr8q7ylx2',
    delegation: {
      direction: 'in',
      stake_lovelace: '987654321000',
      old_pool: null,
      new_pool: { ticker: 'BLOX', bech32_pool_id: 'pool1previewblox8q7ylx2n39x' }
    }
  },
  {
    event_id: 'preview-ada-in',
    kind: 'wallet_ada_flow',
    epoch_no: 644,
    time: minutesAgo(42),
    stake_address: 'stake1u9previewaddedada9n39x8qr8q7ylx2',
    ada_flow: { direction: 'in', amount_lovelace: '1250000000000' }
  },
  {
    event_id: 'preview-delegation-out',
    kind: 'delegation_change',
    epoch_no: 643,
    time: minutesAgo(60 * 24 * 2),
    stake_address: 'stake1u9previewremoveddelegation9n39x8q',
    delegation: {
      direction: 'out',
      stake_lovelace: '123456789000',
      old_pool: { ticker: 'BLOX', bech32_pool_id: 'pool1previewblox8q7ylx2n39x' },
      new_pool: { ticker: 'NEXT', bech32_pool_id: 'pool1previewnext8q7ylx2n39x' }
    }
  },
  {
    event_id: 'preview-ada-out',
    kind: 'wallet_ada_flow',
    epoch_no: 643,
    time: minutesAgo(60 * 24 * 35),
    stake_address: 'stake1u9previewremovedada9n39x8qr8q7yl',
    ada_flow: { direction: 'out', amount_lovelace: '75000000000' }
  },
  {
    event_id: 'preview-lifecycle-registered',
    kind: 'pool_lifecycle',
    epoch_no: 580,
    time: minutesAgo(60 * 24 * 360),
    tx_hash: 'previewregistrationtransaction8q7ylx2n39x',
    lifecycle: { stage: 'registered' }
  },
  {
    kind: 'block',
    block_no: 13697514,
    epoch_no: 643,
    time: minutesAgo(60 * 24 * 90),
    total_output_lovelace: '127569763000',
    fees_lovelace: '4330000',
    tx_count: 9,
    fullness_percent: 11.7,
    pool: { ticker: 'BLOX', bech32_pool_id: 'pool1previewblox8q7ylx2n39x' }
  }
];
