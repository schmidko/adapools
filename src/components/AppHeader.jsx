import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import AdapoolsLogo from './AdapoolsLogo.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => (
  <Layout.Header className="app-header">
    <Link to="/" className="brand">
      <AdapoolsLogo />
    </Link>
    <ThemeToggle />
  </Layout.Header>
);

export default AppHeader;
