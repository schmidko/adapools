import { Layout } from 'antd';
import { ClockCircleOutlined, CompassOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import logo from '../assets/adapools-logo-128-wide.png';
import PoolSearch from './PoolSearch.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <div className="app-header-inner">
      <Link to="/" className="brand">
        <img className="brand-logo" src={logo} alt="adapools.xyz" />
      </Link>
      <div className="header-actions">
        <PoolSearch />
        <Link to="/discover" className="discover-pools-link">
          <CompassOutlined />
          <span>Discover new pools</span>
        </Link>
        <Link to="/pools/retired" className="discover-pools-link">
          <ClockCircleOutlined />
          <span>Retired pools</span>
        </Link>
        <ThemeToggle />
      </div>
    </div>
  </Layout.Header>
);

export default AppHeader;
