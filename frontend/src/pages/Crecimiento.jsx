import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import { formatearEdad } from '../utils/edad.js';
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

function etiquetaPercentil(percentil) {
  if (percentil == null) {
    return { texto: '—', color: 'default' };
  }

  const valor = Number(percentil);

  if (Number.isNaN(valor)) {
    return { texto: '—', color: 'default' };
  }

  if (valor < 5) {
    return { texto: `${percentil} - Desnutrición`, color: 'error' };
  }

  if (valor <= 85) {
    return { texto: `${percentil} - Normal`, color: 'success' };
  }

  if (valor <= 95) {
    return { texto: `${percentil} - Sobrepeso`, color: 'warning' };
  }

  return { texto: `${percentil} - Obesidad`, color: 'error' };
}

function colorPercentilTalla(percentil) {
  if (percentil == null || Number.isNaN(Number(percentil))) {
    return 'default';
  }

  const valor = Number(percentil);
  return valor >= 5 && valor <= 95 ? 'success' : 'error';
}

function formatoFechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

const KG_A_LIBRAS = 2.20462;

export default function Crecimiento() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const puedeGestionar =
    usuario?.rol === 'admin' || usuario?.rol === 'encargado' || usuario?.rol === 'personal';
  const [ninos, setNinos] = useState([]);
  const [ninoSeleccionado, setNinoSeleccionado] = useState('');
  const [ninoObj, setNinoObj] = useState(null);
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    peso: '',
    talla: '',
    fecha: formatoFechaHoy(),
  });
  const [pesoLibras, setPesoLibras] = useState('');

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
    const ninoIdParam = searchParams.get('nino');

    if (!ninoIdParam || ninos.length === 0) {
      return;
    }

    const nino = ninos.find((n) => n._id === ninoIdParam);

    if (nino) {
      setNinoObj(nino);
      setNinoSeleccionado(nino._id);
    }
  }, [ninos, searchParams]);

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
    setPesoLibras('');
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
  };

  const pedirConfirmacion = () => {
    setDialogoAbierto(false);
    setConfirmacionAbierta(true);
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

      await cargarMediciones(ninoSeleccionado);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar la medición');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    {
      label: 'Peso',
      valor: `${form.peso} kg (${(form.peso * KG_A_LIBRAS).toFixed(1)} lb)`,
    },
    { label: 'Talla (cm)', valor: form.talla },
    { label: 'Fecha', valor: form.fecha },
  ];

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
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Control de Crecimiento
          </Typography>
        </Box>

        <Autocomplete
          options={ninos}
          getOptionLabel={(option) => option.nombreCompleto || ''}
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

        {ninoObj && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Edad: ${formatearEdad(ninoObj.fechaNacimiento)}`}
              color="primary"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {ninoObj.padres?.length > 0
                ? `Padres: ${ninoObj.padres
                    .map((padre) => padre.nombreCompleto)
                    .filter(Boolean)
                    .join(', ')}`
                : 'Sin padres registrados'}
            </Typography>
          </Box>
        )}

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
              <>
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                  sx={{ mb: 2 }}
                >
                  <Chip size="small" color="error" label="🔴 Desnutrición (<5)" />
                  <Chip size="small" color="success" label="🟢 Normal (5-85)" />
                  <Chip size="small" color="warning" label="🟡 Sobrepeso (85-95)" />
                  <Chip size="small" color="error" label="🔴 Obesidad (>95)" />
                </Stack>
                <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Edad (meses)</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Talla (cm)</TableCell>
                      <TableCell>Percentil de peso</TableCell>
                      <TableCell>Percentil de talla</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mediciones.length > 0 ? (
                      mediciones.map((medicion) => {
                        const percentilPeso = etiquetaPercentil(medicion.percentilPeso);

                        return (
                        <TableRow key={medicion._id}>
                          <TableCell>
                            {medicion.fecha ? new Date(medicion.fecha).toLocaleDateString('es-GT') : '-'}
                          </TableCell>
                          <TableCell>{medicion.edadMeses ?? '-'}</TableCell>
                          <TableCell>
                            {medicion.peso != null
                              ? `${medicion.peso} kg (${(medicion.peso * KG_A_LIBRAS).toFixed(1)} lb)`
                              : '-'}
                          </TableCell>
                          <TableCell>{medicion.talla ?? '-'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={percentilPeso.texto}
                              color={percentilPeso.color}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={medicion.percentilTalla ?? '—'}
                              color={colorPercentilTalla(medicion.percentilTalla)}
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
                        );
                      })
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
              </>
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
            <Stack direction="row" spacing={2}>
              <TextField
                label="Peso (kg)"
                type="number"
                required
                fullWidth
                value={form.peso}
                onChange={(e) => {
                  const kg = e.target.value;
                  setForm({ ...form, peso: kg });
                  setPesoLibras(kg === '' ? '' : (Number(kg) * KG_A_LIBRAS).toFixed(1));
                }}
              />
              <TextField
                label="Peso (libras)"
                type="number"
                required
                fullWidth
                value={pesoLibras}
                onChange={(e) => {
                  const libras = e.target.value;
                  setPesoLibras(libras);
                  setForm({
                    ...form,
                    peso: libras === '' ? '' : (Number(libras) / KG_A_LIBRAS).toFixed(2),
                  });
                }}
              />
            </Stack>
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
          <Button variant="contained" onClick={pedirConfirmacion} disabled={guardando}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <DialogoConfirmacion
        abierto={confirmacionAbierta}
        modo="crear"
        titulo="Medición"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />
    </Box>
  );
}
