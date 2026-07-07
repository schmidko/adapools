import { Empty, Spin } from 'antd';
import BlockTile from './BlockTile.jsx';

const BlockTicker = ({ blocks = [], loading = false, tileProps = {}, now, className = '' }) => {
  if (loading && blocks.length === 0) {
    return <div className="center-state"><Spin /></div>;
  }

  if (blocks.length === 0) {
    return <Empty description="No blocks yet" />;
  }

  return (
    <div className={`block-grid ${className}`.trim()}>
      {blocks.map((block) => (
        <BlockTile key={block.block_no || block.hash} block={block} now={now} {...tileProps} />
      ))}
    </div>
  );
};

export default BlockTicker;
