import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { departamentos } from '../data/guatemala.js';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import DialogoEliminar from '../components/DialogoEliminar.jsx';

const FORM_INICIAL = {
  nombre: '',
  descripcion: '',
  alcance: 'municipio',
  departamento: '',
  municipio: '',
  comunidad: '',
  fechaRealizacion: '',
};

const ESTADOS = {
  proxima: { etiqueta: 'Próxima', color: 'info' },
  en_curso: { etiqueta: 'En curso', color: 'warning' },
  finalizada: { etiqueta: 'Finalizada', color: 'default' },
};

const ETIQUETAS_ALCANCE = {
  departamento: 'Todo el departamento',
  municipio: 'Todo el municipio',
  comunidad: 'Comunidad / aldea específica',
};

function fechaActualLocal() {
  const hoy = new Date();
  const desplazamiento = hoy.getTimezoneOffset() * 60_000;
  return new Date(hoy.getTime() - desplazamiento).toISOString().slice(0, 10);
}

function fechaParaFormulario(fecha) {
  return fecha ? String(fecha).slice(0, 10) : '';
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeZone: 'America/Guatemala',
  }).format(new Date(fecha));
}

function destinoCampana(campana) {
  if (campana.alcance === 'comunidad') {
    return `${campana.comunidad?.nombre || 'Comunidad'}, ${campana.municipio}`;
  }
  if (campana.alcance === 'municipio') return `${campana.municipio}, ${campana.departamento}`;
  return campana.departamento;
}

function resumenNotificacion(campana) {
  if (!campana.notificacionEnviada) return 'Pendiente de envío';
  return `Email: ${campana.correosEnviados || 0} · Telegram: ${campana.telegramEnviados || 0}`;
}

export default function Campanas() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [campanas, setCampanas] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [campanaAEnviar, setCampanaAEnviar] = useState(null);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      const [respuestaCampanas, respuestaComunidades] = await Promise.all([
        api.get('/campanas'),
        api.get('/comunidades'),
      ]);
      setCampanas(respuestaCampanas.data);
      setComunidades(respuestaComunidades.data.filter((comunidad) => comunidad.activo));
    } catch (errorCarga) {
      setError(errorCarga.response?.data?.mensaje || 'Error al cargar las campañas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const [respuestaCampanas, respuestaComunidades] = await Promise.all([
          api.get('/campanas'),
          api.get('/comunidades'),
        ]);
        if (!activo) return;
        setCampanas(respuestaCampanas.data);
        setComunidades(respuestaComunidades.data.filter((comunidad) => comunidad.activo));
      } catch (errorCarga) {
        if (activo) {
          setError(errorCarga.response?.data?.mensaje || 'Error al cargar las campañas');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInicial();
    return () => {
      activo = false;
    };
  }, []);

  const municipiosDisponibles =
    departamentos.find((item) => item.departamento === form.departamento)?.municipios || [];

  const comunidadesDisponibles = comunidades.filter(
    (comunidad) =>
      comunidad.departamento === form.departamento && comunidad.municipio === form.municipio
  );

  const campanasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    if (!texto) return campanas;
    return campanas.filter((campana) =>
      [campana.nombre, campana.departamento, campana.municipio, campana.comunidad?.nombre]
        .filter(Boolean)
        .some((valor) => valor.toLocaleLowerCase('es').includes(texto))
    );
  }, [busqueda, campanas]);

  const abrirCrear = () => {
    setForm(FORM_INICIAL);
    setEditando(null);
    setErrorFormulario('');
    setDialogoAbierto(true);
  };

  const abrirEditar = (campana) => {
    setForm({
      nombre: campana.nombre || '',
      descripcion: campana.descripcion || '',
      alcance: campana.alcance || 'municipio',
      departamento: campana.departamento || '',
      municipio: campana.municipio || '',
      comunidad: campana.comunidad?._id || '',
      fechaRealizacion: fechaParaFormulario(campana.fechaRealizacion),
    });
    setEditando(campana);
    setErrorFormulario('');
    setDialogoAbierto(true);
  };

  const cerrarFormulario = () => {
    setDialogoAbierto(false);
    setErrorFormulario('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim()) return 'El nombre de la campaña es obligatorio';
    if (!form.departamento) return 'Seleccione un departamento';
    if (form.alcance !== 'departamento' && !form.municipio) {
      return 'Seleccione un municipio';
    }
    if (form.alcance === 'comunidad' && !form.comunidad) {
      return 'Seleccione la comunidad o aldea';
    }
    if (!form.fechaRealizacion) return 'Seleccione la fecha de realización';
    if (!form.descripcion.trim()) return 'Escriba la descripción o mensaje de la campaña';
    return '';
  };

  const pedirConfirmacion = () => {
    const validacion = validarFormulario();
    if (validacion) {
      setErrorFormulario(validacion);
      return;
    }
    setErrorFormulario('');
    setDialogoAbierto(false);
    setConfirmacionAbierta(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (editando) await api.put(`/campanas/${editando._id}`, form);
      else await api.post('/campanas', form);
      setConfirmacionAbierta(false);
      setMensaje(editando ? 'Campaña actualizada correctamente' : 'Campaña creada correctamente');
      await cargarDatos();
    } catch (errorGuardado) {
      setErrorFormulario(errorGuardado.response?.data?.mensaje || 'Error al guardar la campaña');
      setConfirmacionAbierta(false);
      setDialogoAbierto(true);
    } finally {
      setGuardando(false);
    }
  };

  const enviarCampana = async () => {
    if (!campanaAEnviar) return;
    setEnviando(true);
    setError('');
    try {
      const respuesta = await api.post(`/campanas/${campanaAEnviar._id}/enviar`);
      setMensaje(
        `${respuesta.data.mensaje}. Fallidos: ${respuesta.data.fallidos || 0}.`
      );
      setCampanaAEnviar(null);
      await cargarDatos();
    } catch (errorEnvio) {
      setError(errorEnvio.response?.data?.mensaje || 'No se pudo notificar la campaña');
      setCampanaAEnviar(null);
    } finally {
      setEnviando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminacion.elemento) return;
    setEliminando(true);
    try {
      await api.delete(`/campanas/${eliminacion.elemento._id}`);
      setEliminacion({ abierto: false, elemento: null });
      setMensaje('Campaña eliminada correctamente');
      await cargarDatos();
    } catch (errorEliminacion) {
      setError(errorEliminacion.response?.data?.mensaje || 'Error al eliminar la campaña');
    } finally {
      setEliminando(false);
    }
  };

  const comunidadSeleccionada = comunidades.find(({ _id }) => _id === form.comunidad);
  const camposConfirmacion = [
    { label: 'Nombre', valor: form.nombre, valorAnterior: editando?.nombre },
    {
      label: 'Alcance',
      valor: ETIQUETAS_ALCANCE[form.alcance],
      valorAnterior: editando ? ETIQUETAS_ALCANCE[editando.alcance] : undefined,
    },
    { label: 'Departamento', valor: form.departamento, valorAnterior: editando?.departamento },
    ...(form.alcance !== 'departamento'
      ? [{ label: 'Municipio', valor: form.municipio, valorAnterior: editando?.municipio }]
      : []),
    ...(form.alcance === 'comunidad'
      ? [{
          label: 'Comunidad / aldea',
          valor: comunidadSeleccionada?.nombre,
          valorAnterior: editando?.comunidad?.nombre,
        }]
      : []),
    {
      label: 'Fecha',
      valor: form.fechaRealizacion,
      valorAnterior: editando ? fechaParaFormulario(editando.fechaRealizacion) : undefined,
    },
    { label: 'Descripción', valor: form.descripcion, valorAnterior: editando?.descripcion },
  ];

  const accionesCampana = (campana) => (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {puedeGestionar && !campana.notificacionEnviada && (
        <>
          <Tooltip title="Editar campaña">
            <IconButton color="primary" onClick={() => abrirEditar(campana)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notificar por Email y Telegram">
            <IconButton color="info" onClick={() => setCampanaAEnviar(campana)}>
              <SendIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
      {puedeGestionar && (
        <Tooltip title="Eliminar campaña">
          <IconButton
            color="error"
            onClick={() => setEliminacion({ abierto: true, elemento: campana })}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  return (
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
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', sm: '2.125rem' } }}
          >
            Campañas
          </Typography>
          <Typography color="text.secondary">
            Actividades y avisos dirigidos a las comunidades
          </Typography>
        </Box>
        {puedeGestionar && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Crear campaña
          </Button>
        )}
      </Box>

      {mensaje && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TextField
        label="Buscar campaña o lugar"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}
          >
            <Table sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Campaña</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Notificación</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campanasFiltradas.length ? (
                  campanasFiltradas.map((campana) => {
                    const estado = ESTADOS[campana.estado] || ESTADOS.proxima;
                    return (
                      <TableRow key={campana._id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{campana.nombre}</Typography>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
                            {campana.descripcion}
                          </Typography>
                        </TableCell>
                        <TableCell>{destinoCampana(campana)}</TableCell>
                        <TableCell>{formatearFecha(campana.fechaRealizacion)}</TableCell>
                        <TableCell>
                          <Chip size="small" color={estado.color} label={estado.etiqueta} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant={campana.notificacionEnviada ? 'filled' : 'outlined'}
                            color={campana.notificacionEnviada ? 'success' : 'default'}
                            label={resumenNotificacion(campana)}
                          />
                        </TableCell>
                        <TableCell>{accionesCampana(campana)}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay campañas que coincidan con la búsqueda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {campanasFiltradas.length ? (
              campanasFiltradas.map((campana) => {
                const estado = ESTADOS[campana.estado] || ESTADOS.proxima;
                return (
                  <Card key={campana._id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography variant="h6">{campana.nombre}</Typography>
                        <Chip size="small" color={estado.color} label={estado.etiqueta} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {campana.descripcion}
                      </Typography>
                      <Stack spacing={0.5} sx={{ mt: 2 }}>
                        <Typography variant="body2"><b>Lugar:</b> {destinoCampana(campana)}</Typography>
                        <Typography variant="body2"><b>Fecha:</b> {formatearFecha(campana.fechaRealizacion)}</Typography>
                        <Typography variant="body2">
                          <b>Correo:</b>{' '}
                          {resumenNotificacion(campana)}
                        </Typography>
                      </Stack>
                    </CardContent>
                    {puedeGestionar && <CardActions>{accionesCampana(campana)}</CardActions>}
                  </Card>
                );
              })
            ) : (
              <Alert severity="info">No hay campañas que coincidan con la búsqueda</Alert>
            )}
          </Stack>
        </>
      )}

      <Dialog open={dialogoAbierto} onClose={cerrarFormulario} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar campaña' : 'Crear campaña'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorFormulario && (
              <Alert severity="error" onClose={() => setErrorFormulario('')}>
                {errorFormulario}
              </Alert>
            )}
            <TextField
              label="Nombre de la campaña"
              required
              value={form.nombre}
              onChange={(event) => setForm({ ...form, nombre: event.target.value })}
              placeholder="Ej. Jornada de vacunación"
            />
            <TextField
              select
              label="Alcance"
              value={form.alcance}
              onChange={(event) => {
                const alcance = event.target.value;
                setForm({
                  ...form,
                  alcance,
                  municipio: alcance === 'departamento' ? '' : form.municipio,
                  comunidad: alcance === 'comunidad' ? form.comunidad : '',
                });
              }}
            >
              <MenuItem value="departamento">Departamento completo</MenuItem>
              <MenuItem value="municipio">Municipio completo</MenuItem>
              <MenuItem value="comunidad">Comunidad / aldea específica</MenuItem>
            </TextField>
            <Autocomplete
              options={departamentos.map((item) => item.departamento)}
              value={form.departamento || null}
              onChange={(event, departamento) =>
                setForm({ ...form, departamento: departamento || '', municipio: '', comunidad: '' })
              }
              renderInput={(params) => <TextField {...params} label="Departamento" required />}
            />
            {form.alcance !== 'departamento' && (
              <Autocomplete
                options={municipiosDisponibles}
                value={form.municipio || null}
                disabled={!form.departamento}
                onChange={(event, municipio) =>
                  setForm({ ...form, municipio: municipio || '', comunidad: '' })
                }
                renderInput={(params) => <TextField {...params} label="Municipio" required />}
              />
            )}
            {form.alcance === 'comunidad' && (
              <Autocomplete
                options={comunidadesDisponibles}
                value={comunidadesDisponibles.find(({ _id }) => _id === form.comunidad) || null}
                disabled={!form.municipio}
                getOptionLabel={(opcion) => opcion.nombre || ''}
                isOptionEqualToValue={(opcion, valor) => opcion._id === valor._id}
                onChange={(event, comunidad) =>
                  setForm({ ...form, comunidad: comunidad?._id || '' })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Comunidad / aldea" required />
                )}
                noOptionsText="No hay comunidades activas en este municipio"
              />
            )}
            <TextField
              label="Fecha a realizar"
              type="date"
              required
              value={form.fechaRealizacion}
              onChange={(event) => setForm({ ...form, fechaRealizacion: event.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: editando ? undefined : fechaActualLocal() }}
            />
            <TextField
              label="Descripción o mensaje"
              required
              multiline
              minRows={4}
              value={form.descripcion}
              onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
              helperText="Este texto se enviará por Email y Telegram a los padres y tutores."
              placeholder="Explique el objetivo, horario, requisitos y cualquier indicación importante."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarFormulario}>Cancelar</Button>
          <Button variant="contained" onClick={pedirConfirmacion}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <DialogoConfirmacion
        abierto={confirmacionAbierta}
        modo={editando ? 'editar' : 'crear'}
        titulo="campaña"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />

      <Dialog open={Boolean(campanaAEnviar)} onClose={enviando ? undefined : () => setCampanaAEnviar(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Notificar esta campaña?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CampaignIcon color="primary" sx={{ fontSize: 54 }} />
            </Box>
            <Typography>
              Se enviará por Email y Telegram <b>{campanaAEnviar?.nombre}</b> a los padres y tutores de{' '}
              <b>{campanaAEnviar ? destinoCampana(campanaAEnviar) : ''}</b>, utilizando los
              métodos de contacto que cada uno eligió.
            </Typography>
            <Alert severity="info">
              Solo se incluirán padres de la ubicación seleccionada. Cada correo y cada chat de
              Telegram recibirán un único aviso.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCampanaAEnviar(null)} disabled={enviando}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={enviando ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            onClick={enviarCampana}
            disabled={enviando}
          >
            Enviar avisos
          </Button>
        </DialogActions>
      </Dialog>

      <DialogoEliminar
        abierto={eliminacion.abierto}
        titulo={`¿Eliminar ${eliminacion.elemento?.nombre || 'esta campaña'}?`}
        descripcion="La campaña dejará de aparecer en el listado."
        cargando={eliminando}
        onCancelar={() => setEliminacion({ abierto: false, elemento: null })}
        onConfirmar={confirmarEliminar}
      />
    </Box>
  );
}
