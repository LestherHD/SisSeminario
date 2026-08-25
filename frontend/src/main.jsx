import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
  palette: {
    primary: { main: '#118AB2' },
    secondary: { main: '#073B4C' },
    background: { default: '#f5f7fa' },
  },
  typography: { fontFamily: 'system-ui, Roboto, sans-serif' },
  shape: { borderRadius: 8 },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
