import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import PoolSearch from './PoolSearch.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <Link to="/" className="brand">
      <img className="brand-logo" src={logo} alt="adapools.xyz" />
    </Link>
    <div className="header-actions">
      <PoolSearch />
      <ThemeToggle />
    </div>
  </Layout.Header>
);

export default AppHeader;
