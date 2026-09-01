import { useEffect, useState } from 'react';
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
  Autocomplete,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  InputAdornment,
  Pagination,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import DialogoEliminar from '../components/DialogoEliminar.jsx';
import { departamentos } from '../data/guatemala.js';

export default function Padres() {
  const { usuario } = useAuth();
  const puedeGestionar = ['admin', 'encargado', 'personal'].includes(usuario?.rol);
  const puedeEliminar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const puedeRevocarTelegram = usuario?.rol === 'admin';
  const [padres, setPadres] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busquedaPadre, setBusquedaPadre] = useState('');
  const [pagina, setPagina] = useState(1);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);
  const [revocacion, setRevocacion] = useState({ abierto: false, padre: null });
  const [revocando, setRevocando] = useState(false);
  const [form, setForm] = useState({
    primerNombre: '',
    segundoNombre: '',
    tercerNombre: '',
    primerApellido: '',
    segundoApellido: '',
    dpi: '',
    telefono: '',
    email: '',
    metodoContacto: [],
    departamentoFiltro: '',
    municipioFiltro: '',
    comunidad: null,
  });

  const cargarPadres = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await api.get(
        mostrarInactivos ? '/padres?incluirInactivos=true' : '/padres'
      );
      setPadres(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar padres');
    } finally {
      setCargando(false);
    }
  };

  const cargarComunidades = async () => {
    try {
      const response = await api.get('/comunidades');
      setComunidades(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar comunidades');
    }
  };

  useEffect(() => {
    // Carga inicial de datos externos para los selectores.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarComunidades();
  }, []);

  useEffect(() => {
    // Recarga el listado cuando cambia la vista de registros inactivos.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPadres();
    // cargarPadres usa el valor actual de mostrarInactivos en esta sincronización.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  const abrirCrear = () => {
    setErrorFormulario('');
    setForm({
      primerNombre: '',
      segundoNombre: '',
      tercerNombre: '',
      primerApellido: '',
      segundoApellido: '',
      dpi: '',
      telefono: '',
      email: '',
      metodoContacto: [],
      departamentoFiltro: '',
      municipioFiltro: '',
      comunidad: null,
    });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (padre) => {
    setErrorFormulario('');
    const comunidadId = typeof padre.comunidad === 'string'
      ? padre.comunidad
      : padre.comunidad?._id;
    const comunidadPadre = comunidades.find(
      (comunidad) => comunidad._id === comunidadId
    ) || padre.comunidad;
    setForm({
      primerNombre: padre.primerNombre || '',
      segundoNombre: padre.segundoNombre || '',
      tercerNombre: padre.tercerNombre || '',
      primerApellido: padre.primerApellido || '',
      segundoApellido: padre.segundoApellido || '',
      dpi: padre.dpi || '',
      telefono: padre.telefono || '',
      email: padre.email || '',
      metodoContacto: padre.metodoContacto || [],
      departamentoFiltro: comunidadPadre?.departamento || '',
      municipioFiltro: comunidadPadre?.municipio || '',
      comunidad: comunidadId || '',
    });
    setEditando(padre);
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    setErrorFormulario('');
    setDialogoAbierto(false);
  };

  const pedirConfirmacion = () => {
    if (form.metodoContacto.length === 0) {
      setErrorFormulario('Debe seleccionar al menos un método de contacto (Telegram o Email)');
      return;
    }
    if (form.metodoContacto.includes('email') && !form.email.trim()) {
      setErrorFormulario('El email es obligatorio si selecciona Email como método de contacto');
      return;
    }
    setErrorFormulario('');
    setDialogoAbierto(false);
    setConfirmacionAbierta(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorFormulario('');

    try {
      if (editando) {
        await api.put(`/padres/${editando._id}`, form);
      } else {
        await api.post('/padres', form);
      }

      await cargarPadres();
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    } catch (error) {
      setErrorFormulario(error.response?.data?.mensaje || 'Error al guardar el padre');
      setConfirmacionAbierta(false);
      setDialogoAbierto(true);
    } finally {
      setGuardando(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Primer nombre', valor: form.primerNombre, valorAnterior: editando?.primerNombre },
    { label: 'Segundo nombre', valor: form.segundoNombre, valorAnterior: editando?.segundoNombre },
    { label: 'Tercer nombre', valor: form.tercerNombre, valorAnterior: editando?.tercerNombre },
    { label: 'Primer apellido', valor: form.primerApellido, valorAnterior: editando?.primerApellido },
    { label: 'Segundo apellido', valor: form.segundoApellido, valorAnterior: editando?.segundoApellido },
    { label: 'DPI', valor: form.dpi, valorAnterior: editando?.dpi },
    { label: 'Teléfono', valor: form.telefono, valorAnterior: editando?.telefono },
    { label: 'Email', valor: form.email, valorAnterior: editando?.email },
    {
      label: 'Método de contacto',
      valor: form.metodoContacto.map((metodo) => metodo === 'telegram' ? 'Telegram' : 'Email').join(', '),
      valorAnterior: editando?.metodoContacto?.map((metodo) => metodo === 'telegram' ? 'Telegram' : 'Email').join(', '),
    },
    {
      label: 'Comunidad',
      valor: comunidades.find((c) => c._id === form.comunidad)?.nombre || '',
      valorAnterior: editando?.comunidad?.nombre,
    },
  ];

  const confirmarEliminar = async () => {
    if (!eliminacion.elemento) return;
    setEliminando(true);
    try {
      await api.delete(`/padres/${eliminacion.elemento._id}`);
      await cargarPadres();
      setEliminacion({ abierto: false, elemento: null });
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar el padre');
    } finally {
      setEliminando(false);
    }
  };

  const reactivar = async (id) => {
    try {
      await api.patch(`/padres/${id}/reactivar`);
      await cargarPadres();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al reactivar el padre');
    }
  };

  const revocarTelegram = async () => {
    if (!revocacion.padre) return;
    setRevocando(true);
    setError('');
    try {
      const respuesta = await api.patch(`/padres/${revocacion.padre._id}/telegram/revocar`);
      await cargarPadres();
      setRevocacion({ abierto: false, padre: null });
      setMensaje(respuesta.data?.mensaje || 'Vinculación de Telegram revocada');
    } catch (errorRevocacion) {
      setError(errorRevocacion.response?.data?.mensaje || 'No se pudo revocar Telegram');
    } finally {
      setRevocando(false);
    }
  };

  const comunidadesFiltradas = comunidades.filter(
    (comunidad) =>
      comunidad.activo !== false &&
      comunidad.departamento === form.departamentoFiltro &&
      comunidad.municipio === form.municipioFiltro
  );
  const padresFiltrados = padres.filter((padre) =>
    padre.nombreCompleto?.toLowerCase().includes(busquedaPadre.trim().toLowerCase())
  );
  const elementosPorPagina = 20;
  const totalPaginas = Math.max(1, Math.ceil(padresFiltrados.length / elementosPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const padresPaginados = padresFiltrados.slice(
    (paginaActual - 1) * elementosPorPagina,
    paginaActual * elementosPorPagina
  );

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
            Padres / Tutores
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={mostrarInactivos}
                  onChange={(event) => {
                    setMostrarInactivos(event.target.checked);
                    setPagina(1);
                  }}
                />
              }
              label="Mostrar inactivos"
            />
            {puedeGestionar && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
                Nuevo Padre
              </Button>
            )}
          </Stack>
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

        {mensaje && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        {!cargando && !error && (
          <Stack spacing={2}>
            <TextField
              label="Buscar padre..."
              value={busquedaPadre}
              onChange={(event) => {
                setBusquedaPadre(event.target.value);
                setPagina(1);
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>DPI</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Metodo de Contacto</TableCell>
                  <TableCell>Confirmado</TableCell>
                  <TableCell>Comunidad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {padresFiltrados.length > 0 ? (
                  padresPaginados.map((padre) => (
                    <TableRow key={padre._id}>
                      <TableCell>{padre.nombreCompleto}</TableCell>
                      <TableCell>{padre.dpi}</TableCell>
                      <TableCell>{padre.telefono}</TableCell>
                      <TableCell>{padre.email}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                          {padre.metodoContacto?.map((metodo) => (
                            <Chip
                              key={metodo}
                              label={metodo === 'telegram' ? 'Telegram' : 'Email'}
                              size="small"
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {padre.metodoContacto?.includes('telegram')
                          ? padre.telegramChatId?.trim()
                            ? <CheckCircleIcon color="success" aria-label="Telegram confirmado" />
                            : <CancelIcon color="error" aria-label="Telegram no confirmado" />
                          : '—'}
                      </TableCell>
                      <TableCell>{padre.comunidad?.nombre}</TableCell>
                      <TableCell>
                        <Chip
                          color={padre.activo ? 'success' : 'default'}
                          label={padre.activo ? 'Activo' : 'Inactivo'}
                        />
                      </TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          padre.activo ? (
                            <Stack direction="row" spacing={1}>
                              <IconButton aria-label="editar" onClick={() => abrirEditar(padre)}>
                                <EditIcon />
                              </IconButton>
                              {puedeRevocarTelegram && padre.telegramChatId?.trim() && (
                                <Tooltip title="Revocar vinculación de Telegram">
                                  <IconButton
                                    aria-label="revocar Telegram"
                                    color="warning"
                                    onClick={() => setRevocacion({ abierto: true, padre })}
                                  >
                                    <LinkOffIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {puedeEliminar && (
                                <IconButton
                                  aria-label="eliminar"
                                  color="error"
                                  onClick={() => setEliminacion({ abierto: true, elemento: padre })}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </Stack>
                          ) : puedeEliminar ? (
                            <IconButton
                              aria-label="reactivar"
                              color="primary"
                              title="Reactivar"
                              onClick={() => reactivar(padre._id)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          ) : (
                            '—'
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {busquedaPadre ? 'No se encontraron padres' : 'No hay padres registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableContainer>
            {padresFiltrados.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                <Pagination
                  count={totalPaginas}
                  page={paginaActual}
                  onChange={(_, nuevaPagina) => setPagina(nuevaPagina)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Stack>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Padre' : 'Nuevo Padre'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {errorFormulario && (
              <Alert severity="error" onClose={() => setErrorFormulario('')}>
                {errorFormulario}
              </Alert>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Primer nombre" required fullWidth value={form.primerNombre} onChange={(e) => setForm({ ...form, primerNombre: e.target.value })} />
              <TextField label="Segundo nombre" fullWidth value={form.segundoNombre} onChange={(e) => setForm({ ...form, segundoNombre: e.target.value })} />
              <TextField label="Tercer nombre" fullWidth value={form.tercerNombre} onChange={(e) => setForm({ ...form, tercerNombre: e.target.value })} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Primer apellido" required fullWidth value={form.primerApellido} onChange={(e) => setForm({ ...form, primerApellido: e.target.value })} />
              <TextField label="Segundo apellido" required fullWidth value={form.segundoApellido} onChange={(e) => setForm({ ...form, segundoApellido: e.target.value })} />
            </Stack>
            <TextField
              label="DPI"
              fullWidth
              value={form.dpi}
              onChange={(e) => setForm({ ...form, dpi: e.target.value })}
            />
            <TextField
              label="Teléfono"
              fullWidth
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              required={form.metodoContacto.includes('email')}
              fullWidth
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setErrorFormulario('');
              }}
            />
            <Box>
              <Typography variant="subtitle2">Método de contacto *</Typography>
              <FormGroup row>
                {['telegram', 'email'].map((metodo) => (
                  <FormControlLabel
                    key={metodo}
                    label={metodo === 'telegram' ? 'Telegram' : 'Email'}
                    control={
                      <Checkbox
                        checked={form.metodoContacto.includes(metodo)}
                        onChange={(e) => {
                          setForm({
                            ...form,
                            metodoContacto: e.target.checked
                              ? [...form.metodoContacto, metodo]
                              : form.metodoContacto.filter((item) => item !== metodo),
                          });
                          setErrorFormulario('');
                        }}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </Box>
            {form.metodoContacto.includes('telegram') && (
              <Alert severity={editando?.telegramChatId ? 'success' : 'info'}>
                {editando?.telegramChatId
                  ? 'Telegram está confirmado. La vinculación solo puede revocarse desde la tabla por un administrador.'
                  : 'Para confirmar Telegram, el padre debe escribir /start al bot e ingresar su DPI.'}
              </Alert>
            )}
            <Autocomplete
              options={departamentos.map((item) => item.departamento)}
              value={form.departamentoFiltro || null}
              onChange={(event, departamentoFiltro) => setForm({
                ...form,
                departamentoFiltro: departamentoFiltro || '',
                municipioFiltro: '',
                comunidad: '',
              })}
              renderInput={(params) => (
                <TextField {...params} label="Departamento" required />
              )}
              fullWidth
            />
            <Autocomplete
              options={
                departamentos.find(
                  (item) => item.departamento === form.departamentoFiltro
                )?.municipios || []
              }
              value={form.municipioFiltro || null}
              onChange={(event, municipioFiltro) => setForm({
                ...form,
                municipioFiltro: municipioFiltro || '',
                comunidad: '',
              })}
              disabled={!form.departamentoFiltro}
              renderInput={(params) => (
                <TextField {...params} label="Municipio" required />
              )}
              fullWidth
            />
            <Autocomplete
              options={comunidadesFiltradas}
              getOptionLabel={(comunidad) => comunidad.nombre || ''}
              value={comunidadesFiltradas.find((c) => c._id === form.comunidad) || null}
              onChange={(event, comunidad) => setForm({
                ...form,
                comunidad: comunidad?._id || '',
              })}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              disabled={!form.municipioFiltro}
              renderInput={(params) => (
                <TextField {...params} label="Comunidad" required />
              )}
              fullWidth
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
        titulo="Padre"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />

      <DialogoEliminar
        abierto={eliminacion.abierto}
        titulo={`¿Eliminar ${eliminacion.elemento?.nombreCompleto || 'este padre'}?`}
        cargando={eliminando}
        onCancelar={() => setEliminacion({ abierto: false, elemento: null })}
        onConfirmar={confirmarEliminar}
      />

      <Dialog
        open={revocacion.abierto}
        onClose={revocando ? undefined : () => setRevocacion({ abierto: false, padre: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Revocar vinculación de Telegram</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Se desvinculará el chat de <b>{revocacion.padre?.nombreCompleto}</b>. Dejará de recibir
            avisos por Telegram hasta que vuelva a ejecutar <b>/start</b> e ingrese su DPI.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRevocacion({ abierto: false, padre: null })}
            disabled={revocando}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={revocando ? <CircularProgress size={18} color="inherit" /> : <LinkOffIcon />}
            onClick={revocarTelegram}
            disabled={revocando}
          >
            Revocar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
