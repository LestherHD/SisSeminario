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
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Autocomplete,
  InputAdornment,
  Tooltip,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import DialogoEliminar from '../components/DialogoEliminar.jsx';
import Expediente from '../components/Expediente.jsx';
import { formatearEdad } from '../utils/edad.js';

export default function Ninos() {
  const { usuario } = useAuth();
  const puedeGestionar = ['admin', 'encargado', 'personal'].includes(usuario?.rol);
  const puedeEliminar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [ninos, setNinos] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [padresLista, setPadresLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [busquedaPadre, setBusquedaPadre] = useState('');
  const [busquedaNino, setBusquedaNino] = useState('');
  const [pagina, setPagina] = useState(1);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);
  const [carnetAbierto, setCarnetAbierto] = useState(false);
  const [carnetData, setCarnetData] = useState(null);
  const [carnetNinoId, setCarnetNinoId] = useState(null);
  const [generandoCarnet, setGenerandoCarnet] = useState(false);
  const [enviandoCarnet, setEnviandoCarnet] = useState(false);
  const [mensajeCarnet, setMensajeCarnet] = useState('');
  const [expedienteAbierto, setExpedienteAbierto] = useState(false);
  const [expedienteData, setExpedienteData] = useState(null);
  const [expedienteNino, setExpedienteNino] = useState(null);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);
  const [errorExpediente, setErrorExpediente] = useState('');
  const [form, setForm] = useState({
    primerNombre: '',
    segundoNombre: '',
    tercerNombre: '',
    primerApellido: '',
    segundoApellido: '',
    fechaNacimiento: '',
    sexo: '',
    comunidad: '',
    padres: [],
  });

  const cargarNinos = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await api.get(
        mostrarInactivos ? '/ninos?incluirInactivos=true' : '/ninos'
      );
      setNinos(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar niños');
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

  const cargarPadres = async () => {
    try {
      const response = await api.get('/padres');
      setPadresLista(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar padres');
    }
  };

  useEffect(() => {
    cargarComunidades();
    cargarPadres();
  }, []);

  useEffect(() => {
    cargarNinos();
  }, [mostrarInactivos]);

  const abrirCrear = () => {
    setForm({
      primerNombre: '',
      segundoNombre: '',
      tercerNombre: '',
      primerApellido: '',
      segundoApellido: '',
      fechaNacimiento: '',
      sexo: '',
      comunidad: '',
      padres: [],
    });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (nino) => {
    setForm({
      primerNombre: nino.primerNombre || '',
      segundoNombre: nino.segundoNombre || '',
      tercerNombre: nino.tercerNombre || '',
      primerApellido: nino.primerApellido || '',
      segundoApellido: nino.segundoApellido || '',
      fechaNacimiento: nino.fechaNacimiento ? nino.fechaNacimiento.slice(0, 10) : '',
      sexo: nino.sexo || '',
      comunidad: nino.comunidad?._id || '',
      padres: nino.padres?.map((padre) => padre._id) || [],
    });
    setEditando(nino);
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
      if (editando) {
        await api.put(`/ninos/${editando._id}`, form);
      } else {
        await api.post('/ninos', form);
      }

      await cargarNinos();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar el niño');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Primer nombre', valor: form.primerNombre, valorAnterior: editando?.primerNombre },
    { label: 'Segundo nombre', valor: form.segundoNombre, valorAnterior: editando?.segundoNombre },
    { label: 'Tercer nombre', valor: form.tercerNombre, valorAnterior: editando?.tercerNombre },
    { label: 'Primer apellido', valor: form.primerApellido, valorAnterior: editando?.primerApellido },
    { label: 'Segundo apellido', valor: form.segundoApellido, valorAnterior: editando?.segundoApellido },
    {
      label: 'Fecha de nacimiento',
      valor: form.fechaNacimiento,
      valorAnterior: editando?.fechaNacimiento ? String(editando.fechaNacimiento).slice(0, 10) : undefined,
    },
    { label: 'Sexo', valor: form.sexo, valorAnterior: editando?.sexo },
    {
      label: 'Comunidad',
      valor: comunidades.find((c) => c._id === form.comunidad)?.nombre || '',
      valorAnterior: editando?.comunidad?.nombre,
    },
    {
      label: 'Padres',
      valor: padresLista
        .filter((p) => form.padres.includes(p._id))
        .map((p) => p.nombreCompleto)
        .join(', '),
      valorAnterior: editando?.padres ? editando.padres.map((p) => p.nombreCompleto).join(', ') : undefined,
    },
  ];

  const confirmarEliminar = async () => {
    if (!eliminacion.elemento) return;
    setEliminando(true);
    try {
      await api.delete(`/ninos/${eliminacion.elemento._id}`);
      await cargarNinos();
      setEliminacion({ abierto: false, elemento: null });
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar el niño');
    } finally {
      setEliminando(false);
    }
  };

  const reactivar = async (id) => {
    try {
      await api.patch(`/ninos/${id}/reactivar`);
      await cargarNinos();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al reactivar el niño');
    }
  };

  const abrirCarnet = async (nino) => {
    setCarnetNinoId(nino._id);
    setCarnetAbierto(true);
    setMensajeCarnet('');
    setGenerandoCarnet(true);

    try {
      const response = await api.get(`/carnet/generar/${nino._id}`);
      setCarnetData(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al generar el carnet');
    } finally {
      setGenerandoCarnet(false);
    }
  };

  const cerrarCarnet = () => {
    setCarnetAbierto(false);
    setCarnetData(null);
    setCarnetNinoId(null);
    setMensajeCarnet('');
  };

  const enviarCarnet = async () => {
    setEnviandoCarnet(true);

    try {
      const response = await api.post(`/carnet/enviar/${carnetNinoId}`);
      setMensajeCarnet(response.data.mensaje);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al enviar el carnet');
    } finally {
      setEnviandoCarnet(false);
    }
  };

  const imprimirCarnet = () => {
    window.print();
  };

  const abrirExpediente = async (nino) => {
    setExpedienteAbierto(true);
    setExpedienteNino(nino);
    setExpedienteData(null);
    setErrorExpediente('');
    setCargandoExpediente(true);

    try {
      const response = await api.get(`/carnet/expediente/${nino._id}`);
      setExpedienteData(response.data);
    } catch (error) {
      setErrorExpediente(error.response?.data?.mensaje || 'Error al cargar el expediente');
    } finally {
      setCargandoExpediente(false);
    }
  };

  const cerrarExpediente = () => {
    setExpedienteAbierto(false);
    setExpedienteData(null);
    setExpedienteNino(null);
    setErrorExpediente('');
  };

  const padresSeleccionados = padresLista.filter((padre) => form.padres.includes(padre._id));
  const ninosFiltrados = ninos.filter((nino) =>
    nino.nombreCompleto?.toLowerCase().includes(busquedaNino.trim().toLowerCase())
  );
  const elementosPorPagina = 20;
  const totalPaginas = Math.max(1, Math.ceil(ninosFiltrados.length / elementosPorPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const ninosPaginados = ninosFiltrados.slice(
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
            Niños
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
                  onChange={(e) => {
                    setMostrarInactivos(e.target.checked);
                    setPagina(1);
                  }}
                />
              }
              label="Mostrar inactivos"
            />
            {puedeGestionar && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
                Nuevo Niño
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

        {!cargando && !error && (
          <Stack spacing={2}>
            <TextField
              label="Buscar niño..."
              value={busquedaNino}
              onChange={(event) => {
                setBusquedaNino(event.target.value);
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
            <Table sx={{ minWidth: 1050 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Fecha Nac.</TableCell>
                  <TableCell>Edad</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Comunidad</TableCell>
                  <TableCell>Padres</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ninosFiltrados.length > 0 ? (
                  ninosPaginados.map((nino) => (
                    <TableRow key={nino._id}>
                      <TableCell>{nino.nombreCompleto}</TableCell>
                      <TableCell>{new Date(nino.fechaNacimiento).toLocaleDateString('es-GT')}</TableCell>
                      <TableCell>{formatearEdad(nino.fechaNacimiento)}</TableCell>
                      <TableCell>{nino.sexo}</TableCell>
                      <TableCell>{nino.comunidad?.nombre}</TableCell>
                      <TableCell>{nino.padres?.map((padre) => padre.nombreCompleto).join(', ')}</TableCell>
                      <TableCell>
                        <Chip
                          color={nino.activo ? 'success' : 'default'}
                          label={nino.activo ? 'Activo' : 'Inactivo'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Ver expediente">
                            <span>
                              <IconButton
                                aria-label="ver expediente"
                                color="info"
                                disabled={!nino.activo}
                                onClick={() => abrirExpediente(nino)}
                              >
                                <DescriptionIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {puedeGestionar &&
                            (nino.activo ? (
                              <>
                              <Tooltip title="Carnet QR">
                                <IconButton
                                  aria-label="carnet qr"
                                  color="primary"
                                  onClick={() => abrirCarnet(nino)}
                                >
                                  <QrCode2Icon />
                                </IconButton>
                              </Tooltip>
                              <IconButton aria-label="editar" onClick={() => abrirEditar(nino)}>
                                <EditIcon />
                              </IconButton>
                              {puedeEliminar && (
                                <IconButton
                                  aria-label="eliminar"
                                  color="error"
                                  onClick={() => setEliminacion({ abierto: true, elemento: nino })}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                              </>
                            ) : puedeEliminar ? (
                              <IconButton
                                aria-label="reactivar"
                                color="primary"
                                title="Reactivar"
                                onClick={() => reactivar(nino._id)}
                              >
                                <RestoreIcon />
                              </IconButton>
                            ) : (
                              '—'
                            ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {busquedaNino ? 'No se encontraron niños' : 'No hay niños registrados'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableContainer>
            {ninosFiltrados.length > 0 && (
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
        <DialogTitle>{editando ? 'Editar Niño' : 'Nuevo Niño'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
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
              label="Fecha de nac."
              type="date"
              required
              fullWidth
              value={form.fechaNacimiento}
              onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ '& input::-webkit-datetime-edit': { color: form.fechaNacimiento ? 'inherit' : 'transparent' } }}
            />
            <TextField
              select
              label="Sexo"
              required
              fullWidth
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
            >
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
            </TextField>
            <Autocomplete
              options={comunidades.filter((comunidad) => comunidad.activo !== false)}
              getOptionLabel={(comunidad) =>
                comunidad.nombre
                  ? `${comunidad.nombre} (${comunidad.municipio || 'Sin municipio'})`
                  : ''
              }
              value={comunidades.find((c) => c._id === form.comunidad) || null}
              onChange={(e, nuevo) => setForm({ ...form, comunidad: nuevo ? nuevo._id : '' })}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              renderInput={(params) => <TextField {...params} label="Comunidad" required />}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Padres / Tutores
              </Typography>

              <TextField
                label="Buscar padre"
                value={busquedaPadre}
                onChange={(e) => setBusquedaPadre(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ mt: 2 }}>
                {padresSeleccionados.length > 0 ? (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {padresSeleccionados.map((padre) => (
                      <Chip
                        key={padre._id}
                        label={padre.nombreCompleto}
                        onDelete={() =>
                          setForm({
                            ...form,
                            padres: form.padres.filter((id) => id !== padre._id),
                          })
                        }
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Ningún padre seleccionado aún
                  </Typography>
                )}
              </Box>

              {busquedaPadre.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {padresLista
                    .filter(
                      (padre) =>
                        padre.nombreCompleto.toLowerCase().includes(busquedaPadre.toLowerCase()) &&
                        !form.padres.includes(padre._id)
                    )
                    .slice(0, 8)
                    .map((padre) => (
                      <Paper key={padre._id} variant="outlined" sx={{ p: 1, mb: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Typography variant="body2">{padre.nombreCompleto}</Typography>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              const comunidadPadre = typeof padre.comunidad === 'string'
                                ? padre.comunidad
                                : padre.comunidad?._id;
                              setForm({
                                ...form,
                                padres: [...form.padres, padre._id],
                                comunidad:
                                  form.padres.length === 0 && !form.comunidad && comunidadPadre
                                    ? comunidadPadre
                                    : form.comunidad,
                              });
                              setBusquedaPadre('');
                            }}
                          >
                            <AddCircleIcon />
                          </IconButton>
                        </Stack>
                      </Paper>
                    ))}
                </Box>
              )}
            </Box>
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
        titulo="Niño"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />

      <DialogoEliminar
        abierto={eliminacion.abierto}
        titulo={`¿Eliminar ${eliminacion.elemento?.nombreCompleto || 'este niño'}?`}
        cargando={eliminando}
        onCancelar={() => setEliminacion({ abierto: false, elemento: null })}
        onConfirmar={confirmarEliminar}
      />

      <Dialog open={carnetAbierto} onClose={cerrarCarnet} fullWidth maxWidth="sm">
        <DialogTitle>Carnet de Salud{carnetData?.ninoNombre ? ` - ${carnetData.ninoNombre}` : ''}</DialogTitle>
        <DialogContent>
          {generandoCarnet && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Generando carnet...
              </Typography>
            </Box>
          )}

          {!generandoCarnet && carnetData && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={carnetData.qrImagen}
                alt="QR"
                style={{ width: 220, height: 220, display: 'block', margin: '0 auto' }}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Código: <b>{carnetData.codigoCarnet}</b>
              </Typography>
              <Typography variant="h6">
                PIN: <b>{carnetData.pin}</b>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {carnetData.url}
              </Typography>

              {mensajeCarnet && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {mensajeCarnet}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={imprimirCarnet}>Imprimir</Button>
          <Button variant="contained" onClick={enviarCarnet} disabled={enviandoCarnet}>
            {enviandoCarnet ? <CircularProgress size={20} /> : 'Enviar por Telegram'}
          </Button>
          <Button onClick={cerrarCarnet}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={expedienteAbierto} onClose={cerrarExpediente} fullWidth maxWidth="lg">
        <DialogTitle>
          Expediente{expedienteNino?.nombreCompleto ? ` - ${expedienteNino.nombreCompleto}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          {cargandoExpediente && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {errorExpediente && <Alert severity="error">{errorExpediente}</Alert>}
          {!cargandoExpediente && expedienteData && <Expediente {...expedienteData} />}
        </DialogContent>
        <DialogActions sx={{ displayPrint: 'none' }}>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={!expedienteData}
          >
            Imprimir
          </Button>
          <Button variant="contained" onClick={cerrarExpediente}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
