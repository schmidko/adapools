import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const getInitialMode = () => {
  const stored = localStorage.getItem('adapools-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem('adapools-theme', mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo(() => ({
    mode,
    toggleMode: () => setMode((current) => current === 'dark' ? 'light' : 'dark')
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
