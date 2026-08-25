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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import { formatearEdad } from '../utils/edad.js';

export default function Ninos() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
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
  const [carnetAbierto, setCarnetAbierto] = useState(false);
  const [carnetData, setCarnetData] = useState(null);
  const [carnetNinoId, setCarnetNinoId] = useState(null);
  const [generandoCarnet, setGenerandoCarnet] = useState(false);
  const [enviandoCarnet, setEnviandoCarnet] = useState(false);
  const [mensajeCarnet, setMensajeCarnet] = useState('');
  const [form, setForm] = useState({
    nombre: '',
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
      nombre: '',
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
      nombre: nino.nombre || '',
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
    { label: 'Nombre', valor: form.nombre, valorAnterior: editando?.nombre },
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
        .map((p) => p.nombre)
        .join(', '),
      valorAnterior: editando?.padres ? editando.padres.map((p) => p.nombre).join(', ') : undefined,
    },
  ];

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar este niño?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/ninos/${id}`);
      await cargarNinos();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar el niño');
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

  const padresSeleccionados = padresLista.filter((padre) => form.padres.includes(padre._id));

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
            Niños
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
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
          <TableContainer component={Paper}>
            <Table>
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
                {ninos.length > 0 ? (
                  ninos.map((nino) => (
                    <TableRow key={nino._id}>
                      <TableCell>{nino.nombre}</TableCell>
                      <TableCell>{new Date(nino.fechaNacimiento).toLocaleDateString('es-GT')}</TableCell>
                      <TableCell>{formatearEdad(nino.fechaNacimiento)}</TableCell>
                      <TableCell>{nino.sexo}</TableCell>
                      <TableCell>{nino.comunidad?.nombre}</TableCell>
                      <TableCell>{nino.padres?.map((padre) => padre.nombre).join(', ')}</TableCell>
                      <TableCell>
                        <Chip
                          color={nino.activo ? 'success' : 'default'}
                          label={nino.activo ? 'Activo' : 'Inactivo'}
                        />
                      </TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          nino.activo ? (
                            <Stack direction="row" spacing={1}>
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
                              <IconButton
                                aria-label="eliminar"
                                color="error"
                                onClick={() => eliminar(nino._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          ) : (
                            <IconButton
                              aria-label="reactivar"
                              color="primary"
                              title="Reactivar"
                              onClick={() => reactivar(nino._id)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay niños registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Niño' : 'Nuevo Niño'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              required
              fullWidth
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <TextField
              label="Fecha de nacimiento"
              type="date"
              required
              fullWidth
              value={form.fechaNacimiento}
              onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
              InputLabelProps={{ shrink: true }}
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
              options={comunidades}
              getOptionLabel={(o) => o.nombre || ''}
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
                        label={padre.nombre}
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
                        padre.nombre.toLowerCase().includes(busquedaPadre.toLowerCase()) &&
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
                          <Typography variant="body2">{padre.nombre}</Typography>
                          <IconButton
                            color="primary"
                            onClick={() => {
                              setForm({
                                ...form,
                                padres: [...form.padres, padre._id],
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
    </Box>
  );
}
