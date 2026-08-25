import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext.jsx';
import './index.css';
import App from './App.jsx';

function AppConTema() {
  const { modo } = useThemeMode();

  const theme = useMemo(
    () =>
      createTheme({
        palette:
          modo === 'dark'
            ? {
                mode: 'dark',
                primary: { main: '#118AB2' },
                secondary: { main: '#073B4C' },
                background: { default: '#1A2330', paper: '#263041' },
                text: { primary: '#ffffff' },
              }
            : {
                mode: 'light',
                primary: { main: '#118AB2' },
                secondary: { main: '#073B4C' },
                background: { default: '#f5f7fa', paper: '#ffffff' },
              },
        typography: { fontFamily: 'system-ui, Roboto, sans-serif' },
        shape: { borderRadius: 8 },
      }),
    [modo],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <AppConTema />
      </ThemeModeProvider>
    </BrowserRouter>
  </StrictMode>,
);
