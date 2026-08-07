import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
  MenuItem,
  Chip,
  Grid,
  Autocomplete,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function obtenerColorPercentil(percentil) {
  const valor = Number(percentil);

  if (Number.isNaN(valor)) {
    return 'default';
  }

  if (valor < 5 || valor > 95) {
    return 'error';
  }

  if ((valor >= 5 && valor <= 15) || (valor >= 85 && valor <= 95)) {
    return 'warning';
  }

  return 'success';
}

function formatoFechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function Crecimiento() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const puedeGestionar =
    usuario?.rol === 'admin' || usuario?.rol === 'encargado' || usuario?.rol === 'personal';
  const [ninos, setNinos] = useState([]);
  const [ninoSeleccionado, setNinoSeleccionado] = useState('');
  const [ninoObj, setNinoObj] = useState(null);
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    peso: '',
    talla: '',
    fecha: formatoFechaHoy(),
  });

  const cargarNinos = async () => {
    try {
      const response = await api.get('/ninos');
      setNinos(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar niños');
    }
  };

  const cargarMediciones = async (ninoId) => {
    if (!ninoId) {
      setMediciones([]);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const response = await api.get(`/crecimiento/nino/${ninoId}`);
      setMediciones(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar mediciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNinos();
  }, []);

  useEffect(() => {
    cargarMediciones(ninoSeleccionado);
  }, [ninoSeleccionado]);

  const abrirCrear = () => {
    if (!ninoSeleccionado) {
      return;
    }

    setForm({
      peso: '',
      talla: '',
      fecha: formatoFechaHoy(),
    });
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');

    try {
      await api.post('/crecimiento', {
        nino: ninoSeleccionado,
        peso: form.peso,
        talla: form.talla,
        fecha: form.fecha,
      });

      cerrarDialogo();
      await cargarMediciones(ninoSeleccionado);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar la medición');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar esta medición?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/crecimiento/${id}`);
      await cargarMediciones(ninoSeleccionado);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la medición');
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            SCCVI
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          Control de Crecimiento
        </Typography>

        <Autocomplete
          options={ninos}
          getOptionLabel={(option) => option.nombre || ''}
          value={ninoObj}
          onChange={(event, nuevoValor) => {
            setNinoObj(nuevoValor);
            setNinoSeleccionado(nuevoValor ? nuevoValor._id : '');
          }}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          renderInput={(params) => <TextField {...params} label="Buscar niño" />}
          sx={{ width: 350, mb: 3 }}
          noOptionsText="No se encontraron niños"
        />

        {!ninoSeleccionado && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Selecciona un niño para ver su historial de crecimiento.
          </Alert>
        )}

        {ninoSeleccionado && (
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Historial de mediciones</Typography>
              {puedeGestionar && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
                  Nueva Medición
                </Button>
              )}
            </Stack>

            {cargando && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!cargando && !error && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Edad (meses)</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Talla (cm)</TableCell>
                      <TableCell>Percentil Peso</TableCell>
                      <TableCell>Percentil Talla</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mediciones.length > 0 ? (
                      mediciones.map((medicion) => (
                        <TableRow key={medicion._id}>
                          <TableCell>
                            {medicion.fecha ? new Date(medicion.fecha).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{medicion.edadMeses ?? '-'}</TableCell>
                          <TableCell>{medicion.peso ?? '-'}</TableCell>
                          <TableCell>{medicion.talla ?? '-'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={medicion.percentilPeso ?? '-'}
                              color={obtenerColorPercentil(medicion.percentilPeso)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={medicion.percentilTalla ?? '-'}
                              color={obtenerColorPercentil(medicion.percentilTalla)}
                            />
                          </TableCell>
                          <TableCell>
                            {puedeGestionar && (
                              <IconButton color="error" onClick={() => eliminar(medicion._id)}>
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay mediciones registradas para este niño
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {!cargando && !error && mediciones.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Curvas de crecimiento
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Peso vs Edad (meses)
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mediciones}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="edadMeses" label={{ value: 'Edad (meses)', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="peso"
                            stroke="#1976d2"
                            name="Peso (kg)"
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Talla vs Edad (meses)
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mediciones}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="edadMeses" label={{ value: 'Edad (meses)', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'Talla (cm)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="talla"
                            stroke="#2e7d32"
                            name="Talla (cm)"
                            dot
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>Nueva Medición</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Peso (kg)"
              type="number"
              required
              value={form.peso}
              onChange={(e) => setForm({ ...form, peso: e.target.value })}
            />
            <TextField
              label="Talla (cm)"
              type="number"
              required
              value={form.talla}
              onChange={(e) => setForm({ ...form, talla: e.target.value })}
            />
            <TextField
              label="Fecha de medición"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button variant="contained" onClick={guardar} disabled={guardando}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}