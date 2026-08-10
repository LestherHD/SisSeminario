import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORES_MOTIVO = ['#d32f2f', '#ed6c02', '#0288d1', '#2e7d32'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await api.get('/dashboard');
      setDatos(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar el panel de control');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            SCCVI
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate('/comunidades')}>
              Comunidades
            </Button>
            <Button color="inherit" onClick={() => navigate('/padres')}>
              Padres
            </Button>
            <Button color="inherit" onClick={() => navigate('/ninos')}>
              Niños
            </Button>
            <Button color="inherit" onClick={() => navigate('/vacunas')}>
              Vacunas
            </Button>
            <Button color="inherit" onClick={() => navigate('/crecimiento')}>
              Crecimiento
            </Button>
            <Button color="inherit" onClick={() => navigate('/vacunacion')}>
              Vacunación
            </Button>
            <Button color="inherit" onClick={() => navigate('/alertas')}>
              Alertas
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">{usuario?.nombre}</Typography>
            <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
              Salir
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
          Panel de Control
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !datos ? null : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ChildCareIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                    <Typography variant="h3">{datos.totales.ninos}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Niños registrados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <LocationCityIcon sx={{ fontSize: 40, color: '#0288d1' }} />
                    <Typography variant="h3">{datos.totales.comunidades}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comunidades
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                    <Typography variant="h3">{datos.totales.padres}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Padres/Tutores
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card elevation={3}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <VaccinesIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />
                    <Typography variant="h3">{datos.totales.dosisAplicadas}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dosis aplicadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  elevation={3}
                  onClick={() => navigate('/alertas')}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: datos.totales.alertasCriticas > 0 ? '#fdecea' : '#fff8e1',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <WarningIcon sx={{ fontSize: 40, color: '#ed6c02' }} />
                    <Typography variant="h3">{datos.totales.alertasActivas}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alertas activas
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({datos.totales.alertasCriticas} críticas)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Niños por Comunidad
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datos.ninosPorComunidad}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Alertas por Motivo
                  </Typography>
                  {datos.alertasPorMotivo.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sin alertas
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={datos.alertasPorMotivo}
                          dataKey="cantidad"
                          nameKey="motivo"
                          label
                        >
                          {datos.alertasPorMotivo.map((entry, index) => (
                            <Cell
                              key={entry.motivo}
                              fill={COLORES_MOTIVO[index % COLORES_MOTIVO.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>

            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Niños con alertas críticas
              </Typography>
              {datos.ninosConAlertasCriticas.length === 0 ? (
                <Alert severity="success">
                  No hay alertas críticas en este momento. 🎉
                </Alert>
              ) : (
                <List>
                  {datos.ninosConAlertasCriticas.map((item, index) => (
                    <Box key={index}>
                      <ListItem>
                        <ListItemText primary={item.ninoNombre} secondary={item.mensaje} />
                        <Chip label={item.fecha} size="small" color="error" variant="outlined" />
                      </ListItem>
                      {index < datos.ninosConAlertasCriticas.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
