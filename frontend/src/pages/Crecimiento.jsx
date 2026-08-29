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
  Chip,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import { formatearEdad } from '../utils/edad.js';
import { etiquetaPercentil, etiquetaPercentilTalla } from '../utils/percentiles.js';
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
  const [editando, setEditando] = useState(null);
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
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (medicion) => {
    setForm({
      peso: medicion.peso ?? '',
      talla: medicion.talla ?? '',
      fecha: medicion.fecha ? String(medicion.fecha).slice(0, 10) : formatoFechaHoy(),
    });
    setPesoLibras(
      medicion.peso == null ? '' : (Number(medicion.peso) * KG_A_LIBRAS).toFixed(1)
    );
    setEditando(medicion);
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
      const payload = {
        nino: ninoSeleccionado,
        peso: form.peso,
        talla: form.talla,
        fecha: form.fecha,
      };

      if (editando) {
        await api.patch(`/crecimiento/${editando._id}`, payload);
      } else {
        await api.post('/crecimiento', payload);
      }

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
      valorAnterior: editando
        ? `${editando.peso} kg (${(editando.peso * KG_A_LIBRAS).toFixed(1)} lb)`
        : undefined,
    },
    { label: 'Talla (cm)', valor: form.talla, valorAnterior: editando?.talla },
    {
      label: 'Fecha',
      valor: form.fecha,
      valorAnterior: editando?.fecha ? String(editando.fecha).slice(0, 10) : undefined,
    },
  ];

  const datosGrafica = mediciones.map((medicion) => ({
    ...medicion,
    fechaGrafica: medicion.fecha
      ? new Date(medicion.fecha).toLocaleDateString('es-GT', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        })
      : '-',
  }));

  return (
    <Box>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0 }}>
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
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', sm: '2.125rem' } }}
          >
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
          sx={{ width: { xs: '100%', sm: 350 }, mb: 3 }}
          noOptionsText="No se encontraron niños"
        />

        {ninoObj && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ mb: 2 }}
          >
            <Chip
              label={`Edad: ${formatearEdad(ninoObj.fechaNacimiento)}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={
                ninoObj.padres?.length > 0
                  ? `Padres: ${ninoObj.padres
                      .map((padre) => padre.nombreCompleto)
                      .filter(Boolean)
                      .join(', ')}`
                  : 'Sin padres registrados'
              }
              color="primary"
              variant="outlined"
            />
          </Stack>
        )}

        {!ninoSeleccionado && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Selecciona un niño para ver su historial de crecimiento.
          </Alert>
        )}

        {ninoSeleccionado && (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="h6">Historial de mediciones</Typography>
              {puedeGestionar && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={abrirCrear}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Nueva Medición
                </Button>
              )}
            </Box>

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
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                    Percentil de peso
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
                    <Chip size="small" color="error" label="Desnutrición (<5)" />
                    <Chip size="small" color="success" label="Normal (5-85)" />
                    <Chip size="small" color="warning" label="Sobrepeso (85-95)" />
                    <Chip size="small" color="error" label="Obesidad (>95)" />
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                    Percentil de talla
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" color="error" label="Talla baja (<5)" />
                    <Chip size="small" color="success" label="Normal (5-95)" />
                    <Chip size="small" color="info" label="Talla alta (>95)" />
                  </Stack>
                </Box>
                <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
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
                        const percentilTalla = etiquetaPercentilTalla(medicion.percentilTalla);

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
                              label={percentilTalla.texto}
                              color={percentilTalla.color}
                            />
                          </TableCell>
                          <TableCell>
                            {puedeGestionar && (
                              <IconButton
                                aria-label="editar medición"
                                color="primary"
                                onClick={() => abrirEditar(medicion)}
                              >
                                <EditIcon />
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
                  Evolución del crecimiento
                </Typography>
                <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, width: '100%', minWidth: 0, overflow: 'hidden' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Peso y talla por fecha de control. Pase el cursor sobre un punto para ver
                    los valores y la edad registrada.
                  </Typography>
                  <Box sx={{ width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={360}>
                      <LineChart
                        data={datosGrafica}
                        margin={{ top: 10, right: 20, left: 5, bottom: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="fechaGrafica"
                          tickMargin={10}
                          label={{ value: 'Fecha de control', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                          yAxisId="peso"
                          domain={[
                            (minimo) => Math.max(0, Math.floor(minimo - 1)),
                            (maximo) => Math.ceil(maximo + 1),
                          ]}
                          label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis
                          yAxisId="talla"
                          orientation="right"
                          domain={[
                            (minimo) => Math.max(0, Math.floor(minimo - 3)),
                            (maximo) => Math.ceil(maximo + 3),
                          ]}
                          label={{ value: 'Talla (cm)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip
                          formatter={(valor, nombre) => [
                            nombre === 'Peso' ? `${valor} kg` : `${valor} cm`,
                            nombre,
                          ]}
                          labelFormatter={(etiqueta, elementos) => {
                            const edad = elementos?.[0]?.payload?.edadMeses;
                            return edad == null ? etiqueta : `${etiqueta} · ${edad} meses`;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          yAxisId="peso"
                          type="monotone"
                          dataKey="peso"
                          stroke="#1976d2"
                          strokeWidth={3}
                          name="Peso"
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          yAxisId="talla"
                          type="monotone"
                          dataKey="talla"
                          stroke="#2e7d32"
                          strokeWidth={3}
                          name="Talla"
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>
            )}
          </>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Medición' : 'Nueva Medición'}</DialogTitle>
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
        modo={editando ? 'editar' : 'crear'}
        titulo="Medición"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />
    </Box>
  );
}
