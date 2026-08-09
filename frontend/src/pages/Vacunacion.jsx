import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Chip,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import { formatearEdad } from '../utils/edad.js';

function formatoFechaHoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function Vacunacion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { usuario, logout } = useAuth();
  const puedeGestionar =
    usuario?.rol === 'admin' || usuario?.rol === 'encargado' || usuario?.rol === 'personal';
  const [ninos, setNinos] = useState([]);
  const [vacunasCatalogo, setVacunasCatalogo] = useState([]);
  const [ninoObj, setNinoObj] = useState(null);
  const [ninoSeleccionado, setNinoSeleccionado] = useState('');
  const [resumen, setResumen] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    vacuna: '',
    fechaAplicada: formatoFechaHoy(),
  });

  const cargarNinos = async () => {
    try {
      const response = await api.get('/ninos');
      setNinos(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar niños');
    }
  };

  const cargarVacunasCatalogo = async () => {
    try {
      const response = await api.get('/vacunas');
      setVacunasCatalogo(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar vacunas');
    }
  };

  const cargarRegistros = async (ninoId) => {
    if (!ninoId) {
      setResumen([]);
      setDetalle([]);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const [resumenResponse, detalleResponse] = await Promise.all([
        api.get(`/vacunacion/resumen/${ninoId}`),
        api.get(`/vacunacion/nino/${ninoId}`),
      ]);

      setResumen(resumenResponse.data);
      setDetalle(detalleResponse.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar datos de vacunación');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNinos();
    cargarVacunasCatalogo();
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
    cargarRegistros(ninoSeleccionado);
  }, [ninoSeleccionado]);

  const abrirCrear = () => {
    if (!ninoSeleccionado) {
      return;
    }

    setForm({
      vacuna: '',
      fechaAplicada: formatoFechaHoy(),
    });
    setMensaje('');
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
      const response = await api.post('/vacunacion', {
        nino: ninoSeleccionado,
        vacuna: form.vacuna,
        fechaAplicada: form.fechaAplicada,
      });

      setMensaje(response.data?.mensaje || '');
      await cargarRegistros(ninoSeleccionado);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar la dosis');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Vacuna', valor: vacunasCatalogo.find((v) => v._id === form.vacuna)?.nombre || '' },
    { label: 'Fecha de aplicación', valor: form.fechaAplicada },
  ];

  const eliminarDosis = async (id) => {
    const confirmado = window.confirm('¿Eliminar esta dosis?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/vacunacion/${id}`);
      await cargarRegistros(ninoSeleccionado);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la dosis');
    }
  };

  const vacunaSeleccionada = vacunasCatalogo.find((vacuna) => vacuna._id === form.vacuna) || null;

  const obtenerColorEstado = (estado) => {
    if (estado === 'completa') {
      return 'success';
    }

    if (estado === 'al_dia') {
      return 'info';
    }

    return 'error';
  };

  const obtenerEtiquetaEstado = (estado) => {
    if (estado === 'completa') {
      return 'Completa';
    }

    if (estado === 'al_dia') {
      return 'Al día';
    }

    return 'Atrasada';
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <VaccinesIcon fontSize="large" />
          <Typography variant="h4" component="h1">
            Control de Vacunación
          </Typography>
        </Stack>

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

        {ninoObj && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Edad: ${formatearEdad(ninoObj.fechaNacimiento)}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {!ninoSeleccionado && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Selecciona un niño para ver su esquema de vacunación.
          </Alert>
        )}

        {ninoSeleccionado && (
          <>
            {mensaje && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {mensaje}
              </Alert>
            )}

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">Esquema de vacunación</Typography>
              {puedeGestionar && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
                  Registrar Dosis
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
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Resumen del esquema
                </Typography>
                {resumen.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                    {resumen.map((item) => {
                      const porcentaje =
                        item.dosisTotales > 0
                          ? Math.min(100, (item.dosisAplicadas / item.dosisTotales) * 100)
                          : 0;

                      return (
                        <Paper key={item.vacuna?._id} sx={{ p: 2, width: 280 }}>
                          <Stack spacing={1.5}>
                            <Typography variant="h6">{item.vacuna?.nombre || '-'}</Typography>
                            <Chip
                              size="small"
                              color={obtenerColorEstado(item.estado)}
                              label={obtenerEtiquetaEstado(item.estado)}
                              sx={{ width: 'fit-content' }}
                            />
                            <Typography variant="body2">
                              Dosis {item.dosisAplicadas} de {item.dosisTotales}
                            </Typography>
                            <LinearProgress variant="determinate" value={porcentaje} />
                            {item.proximaDosis && item.estado !== 'completa' && (
                              <Typography variant="body2" color="text.secondary">
                                Próxima dosis: {new Date(item.proximaDosis).toLocaleDateString('es-GT')}
                              </Typography>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mb: 4 }}>
                    Sin vacunas registradas.
                  </Typography>
                )}

                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Historial de dosis
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Vacuna</TableCell>
                        <TableCell>N° Dosis</TableCell>
                        <TableCell>Fecha Aplicada</TableCell>
                        <TableCell>Próxima Dosis</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detalle.length > 0 ? (
                        detalle.map((registro) => (
                          <TableRow key={registro._id}>
                            <TableCell>{registro.vacuna?.nombre || '-'}</TableCell>
                            <TableCell>{registro.numeroDosis ?? '-'}</TableCell>
                            <TableCell>
                              {registro.fechaAplicada
                                ? new Date(registro.fechaAplicada).toLocaleDateString('es-GT')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {registro.proximaDosis
                                ? new Date(registro.proximaDosis).toLocaleDateString('es-GT')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {puedeGestionar ? (
                                <IconButton color="error" onClick={() => eliminarDosis(registro._id)}>
                                  <DeleteIcon />
                                </IconButton>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No hay vacunas registradas para este niño
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>Registrar Dosis</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={vacunasCatalogo}
              getOptionLabel={(option) => option.nombre || ''}
              value={vacunaSeleccionada}
              onChange={(event, nuevoValor) => {
                setForm({ ...form, vacuna: nuevoValor ? nuevoValor._id : '' });
              }}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={(params) => <TextField {...params} label="Vacuna" required />}
              noOptionsText="No se encontraron vacunas"
            />
            <TextField
              label="Fecha de aplicación"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={form.fechaAplicada}
              onChange={(e) => setForm({ ...form, fechaAplicada: e.target.value })}
            />
            <Typography variant="caption" color="text.secondary">
              El sistema calculará automáticamente qué número de dosis es y la fecha de la próxima.
            </Typography>
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
        titulo="Dosis"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />
    </Box>
  );
}