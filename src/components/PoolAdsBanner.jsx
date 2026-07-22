import { useEffect, useMemo, useState } from 'react';
import { ArrowRightOutlined, CheckCircleFilled, RocketOutlined, WalletOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Empty, InputNumber, Modal, Select, Space, Spin, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const AD_METADATA_LABEL = 674;
const loadMesh = async () => {
  const [{ BrowserWallet }, { Transaction }] = await Promise.all([
    import('@meshsdk/wallet'),
    import('@meshsdk/transaction')
  ]);
  return { BrowserWallet, Transaction };
};

const campaignCopy = [
  'Delegate to',
  'Support',
  'Discover'
];

const poolLabel = (pool = {}) => pool.ticker || pool.name || 'Cardano pool';
const poolDescription = (pool = {}) => String(pool.description || 'A Cardano stake pool listed on adapools.xyz.').trim();

const PoolAdTile = ({ slot, booking, onPromote, preview = false }) => {
  const pool = booking?.pool;
  const title = poolLabel(pool);
  const campaign = campaignCopy[slot === 'header-2' ? 1 : 0];
  const content = booking ? (
    <>
      <Avatar className="pool-ad-logo" shape="square" size={52} src={pool.logo || undefined}>
        {title.slice(0, 2).toUpperCase()}
      </Avatar>
      <div className="pool-ad-copy">
        <strong>{campaign} {title}</strong>
        <span className="pool-ad-description">{poolDescription(pool)}</span>
        <span className="pool-ad-sponsored">Sponsored pool placement</span>
      </div>
      <ArrowRightOutlined className="pool-ad-arrow" aria-hidden="true" />
    </>
  ) : (
    <>
      <div className="pool-ad-promo-icon"><RocketOutlined /></div>
      <div className="pool-ad-copy">
        <strong>Promote your pool</strong>
        <span className="pool-ad-description">Only 1 ADA per day. Book this header slot instantly.</span>
        <span className="pool-ad-sponsored">Pool promotion</span>
      </div>
      <ArrowRightOutlined className="pool-ad-arrow" aria-hidden="true" />
    </>
  );

  const className = `pool-ad-tile${booking ? ' pool-ad-tile-booked' : ' pool-ad-tile-promo'}${preview ? ' pool-ad-tile-preview' : ''}`;
  if (booking?.pool?.pool_id) {
    return <Link className={className} to={`/pool/${encodeURIComponent(booking.pool.pool_id)}`}>{content}</Link>;
  }
  return (
    <button type="button" className={className} onClick={() => onPromote(slot)}>
      {content}
    </button>
  );
};

const buildAndSubmitPayment = async (quote, walletName) => {
  const { BrowserWallet, Transaction } = await loadMesh();
  const wallet = await BrowserWallet.enable(walletName);
  if (await wallet.getNetworkId() !== 1) {
    throw new Error('Please switch your wallet to Cardano mainnet.');
  }
  const transaction = new Transaction({ initiator: wallet });
  const unsignedTx = await transaction
    .sendLovelace({ address: quote.payment_address }, String(quote.amount_lovelace))
    .setTxInputs(await wallet.getUtxos())
    .setChangeAddress(await wallet.getChangeAddress())
    .setMetadata(quote.metadata_label || AD_METADATA_LABEL, {
      adapools: { booking: quote.payment_reference }
    })
    .build();
  const signedTx = await wallet.signTx(unsignedTx);
  return wallet.submitTx(signedTx);
};

const BookingModal = ({ open, slotId, onCancel, onComplete }) => {
  const [pools, setPools] = useState([]);
  const [poolId, setPoolId] = useState();
  const [days, setDays] = useState(7);
  const [wallets, setWallets] = useState([]);
  const [walletName, setWalletName] = useState();
  const [loadingPools, setLoadingPools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const loadPools = async (query = '') => {
    setLoadingPools(true);
    try {
      setPools(await api.searchPoolAds(query));
    } catch (error) {
      message.error('Pool list could not be loaded.');
    } finally {
      setLoadingPools(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    setStatus('');
    setPoolId(undefined);
    setDays(7);
    loadPools();
    loadMesh()
      .then(({ BrowserWallet }) => {
        const installedWallets = BrowserWallet.getInstalledWallets();
        setWallets(installedWallets);
        setWalletName(installedWallets[0]?.name);
      })
      .catch(() => message.error('Wallet support could not be loaded.'));
    return undefined;
  }, [open]);

  const amount = days || 0;
  const poolOptions = useMemo(() => pools.map((pool) => ({
    value: pool.pool_id,
    label: `${pool.ticker || pool.name || 'Pool'}${pool.name && pool.ticker ? ` - ${pool.name}` : ''}`
  })), [pools]);

  const submit = async () => {
    if (!poolId || !walletName || !days) return;
    setSubmitting(true);
    setStatus('Creating your booking...');
    try {
      const quote = await api.createPoolAdQuote({ pool_id: poolId, slot_id: slotId, days });
      setStatus('Confirm the transaction in your wallet...');
      const txHash = await buildAndSubmitPayment(quote, walletName);
      setStatus('Waiting for the payment to be confirmed...');
      let verified;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          verified = await api.verifyPoolAdPayment({ booking_id: quote.id, tx_hash: txHash });
          break;
        } catch (error) {
          if (error.code !== 'pool_ad_payment_not_verified' || attempt === 11) throw error;
          await new Promise((resolve) => setTimeout(resolve, 10_000));
        }
      }
      setStatus('Your pool promotion is active.');
      onComplete(verified.booking);
    } catch (error) {
      setStatus('');
      message.error(error.message || 'The booking could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Promote a pool"
      open={open}
      onCancel={submitting ? undefined : onCancel}
      footer={null}
      destroyOnHidden
    >
      <div className="pool-ad-booking-form">
        <Typography.Text type="secondary">Slot {slotId === 'header-1' ? '1' : '2'} will be live after the payment is confirmed.</Typography.Text>
        <label htmlFor="pool-ad-pool">Pool</label>
        <Select
          id="pool-ad-pool"
          showSearch
          filterOption={false}
          placeholder="Search pools"
          value={poolId}
          options={poolOptions}
          loading={loadingPools}
          onSearch={loadPools}
          onChange={setPoolId}
          notFoundContent={loadingPools ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No pools found" />}
        />
        <label htmlFor="pool-ad-days">Days</label>
        <InputNumber id="pool-ad-days" min={1} max={30} value={days} onChange={setDays} addonAfter="days" />
        <label htmlFor="pool-ad-wallet">Wallet</label>
        <Select
          id="pool-ad-wallet"
          placeholder="Choose a Cardano wallet"
          value={walletName}
          options={wallets.map((wallet) => ({ value: wallet.name, label: wallet.name }))}
          onChange={setWalletName}
          notFoundContent="No CIP-30 wallet detected"
        />
        {!wallets.length && <Alert type="warning" showIcon message="Install or unlock a Cardano wallet such as Lace or Eternl to continue." />}
        <div className="pool-ad-price"><span>Total</span><strong>{amount} ADA</strong></div>
        {status && <Alert type="info" showIcon message={status} />}
        <Button type="primary" size="large" icon={<WalletOutlined />} block disabled={!poolId || !walletName || !days} loading={submitting} onClick={submit}>
          Pay {amount} ADA
        </Button>
      </div>
    </Modal>
  );
};

const PoolAdsBanner = () => {
  const [status, setStatus] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState(null);

  const load = async () => {
    try {
      const result = await api.getPoolAdsStatus();
      setStatus(result);
      if (result.enabled) {
        const slotsResult = await api.getPoolAdSlots();
        setSlots(slotsResult.slots || []);
      }
    } catch (error) {
      console.error('[adapools] Failed to load pool ads:', error);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!status?.enabled) return null;
  const slotsById = new Map(slots.map((slot) => [slot.slot_id, slot]));

  return (
    <>
      <div className="pool-ads-inline" aria-label="Sponsored pool placements">
        {status.configured ? status.slots.map((id) => (
          <PoolAdTile key={id} slot={id} booking={slotsById.get(id)?.booking} onPromote={setSlotId} />
        )) : (
          <Alert className="pool-ad-config-alert" type="warning" message="Pool ads are enabled but payment details have not been configured." />
        )}
      </div>
      <BookingModal open={Boolean(slotId)} slotId={slotId} onCancel={() => setSlotId(null)} onComplete={() => { setSlotId(null); load(); }} />
    </>
  );
};

export const PoolAdsPreview = () => {
  const booked = {
    pool: {
      pool_id: 'pool1previewadapools',
      ticker: 'BLOX',
      name: 'Ada Blox',
      description: 'Independent Cardano pool focused on reliable infrastructure and a strong community.'
    }
  };
  return (
    <section className="pool-ad-preview-section">
      <div className="pool-ad-preview-heading">
        <CheckCircleFilled /> Header banner previews
      </div>
      <div className="pool-ads-inline pool-ad-preview-grid">
        <PoolAdTile slot="header-1" booking={null} onPromote={() => {}} preview />
        <PoolAdTile slot="header-2" booking={booked} onPromote={() => {}} preview />
      </div>
    </section>
  );
};

export default PoolAdsBanner;
