import { Empty, Spin } from 'antd';
import HomeBlockTile from './HomeBlockTile.jsx';

const BlockTicker = ({ blocks = [], loading = false, now, className = '' }) => {
  if (loading && blocks.length === 0) {
    return <div className="center-state"><Spin /></div>;
  }

  if (blocks.length === 0) {
    return <Empty description="No blocks yet" />;
  }

  return (
    <div className={`block-grid ${className}`.trim()}>
      {blocks.map((block) => (
        <HomeBlockTile key={block.block_no || block.hash} block={block} now={now} />
      ))}
    </div>
  );
};

export default BlockTicker;
