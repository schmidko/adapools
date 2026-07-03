import { Button, Tooltip } from 'antd';
import { BulbOutlined, MoonOutlined } from '@ant-design/icons';
import { useThemeMode } from '../context/ThemeContext.jsx';

const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
      <Button
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        icon={isDark ? <BulbOutlined /> : <MoonOutlined />}
        onClick={toggleMode}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
