import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import HomeRounded from '@mui/icons-material/HomeRounded';
import LocationCityRounded from '@mui/icons-material/LocationCityRounded';
import PeopleRounded from '@mui/icons-material/PeopleRounded';
import ChildCareRounded from '@mui/icons-material/ChildCareRounded';
import VaccinesRounded from '@mui/icons-material/VaccinesRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import HealthAndSafetyRounded from '@mui/icons-material/HealthAndSafetyRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../context/AuthContext.jsx';
import { useThemeMode } from '../context/ThemeContext.jsx';

const anchoSidebar = 260;

const secciones = [
  { texto: 'Inicio', icono: <HomeRounded />, ruta: '/inicio' },
  { texto: 'Comunidades', icono: <LocationCityRounded />, ruta: '/comunidades' },
  { texto: 'Padres', icono: <PeopleRounded />, ruta: '/padres' },
  { texto: 'Niños', icono: <ChildCareRounded />, ruta: '/ninos' },
  { texto: 'Vacunas', icono: <VaccinesRounded />, ruta: '/vacunas' },
  { texto: 'Crecimiento', icono: <TrendingUpRounded />, ruta: '/crecimiento' },
  { texto: 'Vacunación', icono: <HealthAndSafetyRounded />, ruta: '/vacunacion' },
  { texto: 'Alertas', icono: <NotificationsActiveRounded />, ruta: '/alertas' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const esMovil = useMediaQuery(theme.breakpoints.down('md'));
  const { usuario, logout } = useAuth();
  const { modo, toggleModo } = useThemeMode();
  const [movilAbierto, setMovilAbierto] = useState(false);
  const [anclaMenu, setAnclaMenu] = useState(null);
  const colorSidebar = '#263041';

  const irA = (ruta) => {
    navigate(ruta);

    if (esMovil) {
      setMovilAbierto(false);
    }
  };

  const cerrarSesion = () => {
    setAnclaMenu(null);
    logout();
    navigate('/login');
  };

  const contenidoSidebar = (
    <Box sx={{ height: '100%', bgcolor: colorSidebar, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 3 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem' }}>
          SCCVI
        </Typography>
        <Typography variant="caption" sx={{ color: '#fff', opacity: 0.8 }}>
          Centro de Salud Infantil
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

      <List sx={{ flexGrow: 1, px: 1, py: 1 }}>
        {secciones.map((seccion) => {
          const activo = location.pathname === seccion.ruta;

          return (
            <ListItem key={seccion.ruta} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => irA(seccion.ruta)}
                sx={{
                  borderRadius: 1,
                  bgcolor: activo ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: '#fff', minWidth: 42 }}>{seccion.icono}</ListItemIcon>
                <ListItemText
                  primary={seccion.texto}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '1rem',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          width: { md: `calc(100% - ${anchoSidebar}px)` },
          ml: { md: `${anchoSidebar}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {esMovil ? (
            <IconButton edge="start" onClick={() => setMovilAbierto(true)}>
              <MenuRounded />
            </IconButton>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Cambiar tema">
              <IconButton onClick={toggleModo} color="inherit">
                {modo === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Typography variant="body2">{usuario?.nombre}</Typography>
            <IconButton onClick={(e) => setAnclaMenu(e.currentTarget)}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anclaMenu} open={Boolean(anclaMenu)} onClose={() => setAnclaMenu(null)}>
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {usuario?.nombre}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {usuario?.rol}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={cerrarSesion}>
                <ListItemIcon>
                  <LogoutRounded fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: anchoSidebar }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={esMovil ? 'temporary' : 'permanent'}
          open={esMovil ? movilAbierto : true}
          onClose={() => setMovilAbierto(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: anchoSidebar,
              border: 'none',
            },
          }}
        >
          {contenidoSidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${anchoSidebar}px)` },
          ml: { md: `${anchoSidebar}px` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: 0,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
