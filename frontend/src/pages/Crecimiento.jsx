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
import {
  etiquetaEstadoNutricional,
  etiquetaEstadoTalla,
} from '../utils/percentiles.js';
import {
  ComposedChart,
  Line,
  Scatter,
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

const LINEAS_PERCENTILES = [
  { clave: 'p3', nombre: 'P3', color: '#d32f2f', guiones: '5 4' },
  { clave: 'p15', nombre: 'P15', color: '#ed6c02', guiones: '4 4' },
  { clave: 'p50', nombre: 'P50', color: '#2e7d32' },
  { clave: 'p85', nombre: 'P85', color: '#ed6c02', guiones: '4 4' },
  { clave: 'p97', nombre: 'P97', color: '#d32f2f', guiones: '5 4' },
];

function GraficaOms({ titulo, unidad, datos }) {
  if (!datos?.referencia?.length) return null;

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, minWidth: 0, overflow: 'hidden' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
        {titulo}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Líneas de referencia OMS y mediciones del niño o niña.
      </Typography>
      <Box sx={{ width: '100%', minWidth: 0, mt: 1.5 }}>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart
            data={datos.referencia}
            margin={{ top: 10, right: 12, left: 0, bottom: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              type="number"
              dataKey="edadMeses"
              domain={['dataMin', 'dataMax']}
              tickMargin={8}
              label={{ value: 'Edad (meses)', position: 'insideBottom', offset: -12 }}
            />
            <YAxis
              domain={['auto', 'auto']}
              label={{ value: unidad, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(valor, nombre) => [
                `${Number(valor).toFixed(2)} ${unidad}`,
                nombre,
              ]}
              labelFormatter={(edad) => `${Number(edad).toFixed(1)} meses`}
            />
            <Legend verticalAlign="top" height={42} />
            {LINEAS_PERCENTILES.map((linea) => (
              <Line
                key={linea.clave}
                type="monotone"
                dataKey={linea.clave}
                name={linea.nombre}
                stroke={linea.color}
                strokeWidth={linea.clave === 'p50' ? 2.5 : 1.5}
                strokeDasharray={linea.guiones}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Scatter
              data={datos.mediciones}
              dataKey="valor"
              name="Medición"
              fill="#1565c0"
              line={{ stroke: '#1565c0', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

export default function Crecimiento() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();
  const puedeGestionar =
    usuario?.rol === 'admin' || usuario?.rol === 'encargado' || usuario?.rol === 'personal';
  const [ninos, setNinos] = useState([]);
  const [ninoSeleccionado, setNinoSeleccionado] = useState('');
  const [ninoObj, setNinoObj] = useState(null);
  const [mediciones, setMediciones] = useState([]);
  const [curvasOms, setCurvasOms] = useState(null);
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
      setCurvasOms(null);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const [respuestaMediciones, respuestaCurvas] = await Promise.all([
        api.get(`/crecimiento/nino/${ninoId}`),
        api.get(`/crecimiento/curvas/${ninoId}`),
      ]);
      setMediciones(respuestaMediciones.data);
      setCurvasOms(respuestaCurvas.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar mediciones');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // La carga inicial sincroniza esta vista con la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarNinos();
  }, []);

  useEffect(() => {
    const ninoIdParam = searchParams.get('nino');

    if (!ninoIdParam || ninos.length === 0) {
      return;
    }

    const nino = ninos.find((n) => n._id === ninoIdParam);

    if (nino) {
      // Sincroniza el parámetro de la URL con el selector visible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNinoObj(nino);
      setNinoSeleccionado(nino._id);
    }
  }, [ninos, searchParams]);

  useEffect(() => {
    // Recarga el historial al cambiar el niño seleccionado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
                  <Alert severity="info">
                    Evaluación con estándares internacionales OMS según edad exacta y sexo:
                    OMS 2006 para menores de 5 años y OMS 2007 desde los 5 años.
                  </Alert>
                </Box>
                <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1120 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Edad (meses)</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Talla (cm)</TableCell>
                      <TableCell>IMC</TableCell>
                      <TableCell>Estado nutricional OMS</TableCell>
                      <TableCell>Talla para edad OMS</TableCell>
                      <TableCell>Peso para edad</TableCell>
                      <TableCell>Referencia</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mediciones.length > 0 ? (
                      mediciones.map((medicion) => {
                        const estadoNutricional = etiquetaEstadoNutricional(
                          medicion.estadoNutricional,
                          medicion.percentilImc
                        );
                        const estadoTalla = etiquetaEstadoTalla(
                          medicion.estadoTalla,
                          medicion.percentilTalla
                        );

                        return (
                        <TableRow key={medicion._id}>
                          <TableCell>
                            {medicion.fecha ? new Date(medicion.fecha).toLocaleDateString('es-GT') : '-'}
                          </TableCell>
                          <TableCell>{medicion.edadMesesExacta ?? medicion.edadMeses ?? '-'}</TableCell>
                          <TableCell>
                            {medicion.peso != null
                              ? `${medicion.peso} kg (${(medicion.peso * KG_A_LIBRAS).toFixed(1)} lb)`
                              : '-'}
                          </TableCell>
                          <TableCell>{medicion.talla ?? '-'}</TableCell>
                          <TableCell>
                            {medicion.imc != null ? `${medicion.imc} (Z ${medicion.zImcEdad})` : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={estadoNutricional.texto}
                              color={estadoNutricional.color}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={estadoTalla.texto}
                              color={estadoTalla.color}
                            />
                          </TableCell>
                          <TableCell>
                            {medicion.percentilPeso == null
                              ? '—'
                              : `P${medicion.percentilPeso} · Z ${medicion.zPesoEdad}`}
                          </TableCell>
                          <TableCell>{medicion.referenciaOms || 'Pendiente de recalcular'}</TableCell>
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
                        <TableCell colSpan={10} align="center">
                          No hay mediciones registradas para este niño
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </TableContainer>
              </>
            )}

            {!cargando && !error && mediciones.length > 0 && curvasOms && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Curvas de crecimiento contra estándares OMS
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2.5,
                  }}
                >
                  <GraficaOms titulo="Peso para la edad" unidad="kg" datos={curvasOms.peso} />
                  <GraficaOms titulo="Talla para la edad" unidad="cm" datos={curvasOms.talla} />
                  <GraficaOms titulo="IMC para la edad" unidad="kg/m²" datos={curvasOms.imc} />
                </Box>
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
