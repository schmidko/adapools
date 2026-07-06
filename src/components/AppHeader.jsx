import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import logoDark from '../assets/logodark.png';
import logoLight from '../assets/logolight.png';
import { useThemeMode } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => {
  const { mode } = useThemeMode();
  const logo = mode === 'dark' ? logoDark : logoLight;

  return (
    <Layout.Header className="app-header">
      <Link to="/" className="brand">
        <img className="brand-logo" src={logo} alt="adapools.xyz" />
      </Link>
      <ThemeToggle />
    </Layout.Header>
  );
};

export default AppHeader;
