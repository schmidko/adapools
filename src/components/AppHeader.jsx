import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import logoBlack from '../assets/logoblack.png';
import logoWhite from '../assets/logowhite.png';
import { useThemeMode } from '../context/ThemeContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const AppHeader = () => {
  const { mode } = useThemeMode();
  const logo = mode === 'dark' ? logoBlack : logoWhite;

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
