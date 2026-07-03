import { Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <Link to="/" className="brand">
      <span className="brand-mark">A</span>
      <Typography.Title level={4} className="brand-title">adapools</Typography.Title>
    </Link>
    <ThemeToggle />
  </Layout.Header>
);

export default AppHeader;
