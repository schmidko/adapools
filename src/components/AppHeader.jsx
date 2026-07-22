import { Layout } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import logo from '../assets/logobw.png';
import PoolSearch from './PoolSearch.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <Link to="/" className="brand">
      <img className="brand-logo" src={logo} alt="adapools.xyz" />
    </Link>
    <div className="header-actions">
      <PoolSearch />
      <Link to="/discover" className="discover-pools-link">
        <CompassOutlined />
        <span>Discover new pools</span>
      </Link>
      <ThemeToggle />
    </div>
  </Layout.Header>
);

export default AppHeader;
