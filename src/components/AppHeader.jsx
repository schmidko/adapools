import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <Link to="/" className="brand">
      <img className="brand-logo" src={logo} alt="adapools.xyz" />
    </Link>
    <ThemeToggle />
  </Layout.Header>
);

export default AppHeader;
