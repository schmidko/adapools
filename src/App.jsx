import { ConfigProvider, theme } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { ThemeProvider, useThemeMode } from './context/ThemeContext.jsx';
import AppHeader from './components/AppHeader.jsx';
import HomePage from './pages/HomePage.jsx';
import PoolPage from './pages/PoolPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const ThemedApp = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }
      }}
    >
      <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
        <AppHeader />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pool/:poolId" element={<PoolPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </ConfigProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);

export default App;
