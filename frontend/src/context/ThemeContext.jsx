import { createContext, useContext, useMemo, useState } from 'react';

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [modo, setModo] = useState('light');

  const toggleModo = () => {
    setModo((actual) => (actual === 'light' ? 'dark' : 'light'));
  };

  const valor = useMemo(() => ({ modo, toggleModo }), [modo]);

  return <ThemeModeContext.Provider value={valor}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const contexto = useContext(ThemeModeContext);

  if (!contexto) {
    throw new Error('useThemeMode debe usarse dentro de ThemeModeProvider');
  }

  return contexto;
}
