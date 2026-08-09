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
  Autocomplete,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';

export default function Padres() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [padres, setPadres] = useState([]);
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    dpi: '',
    telefono: '',
    email: '',
    canalPreferido: 'email',
    comunidad: '',
  });

  const cargarPadres = async () => {
    try {
      const response = await api.get('/padres');
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
    cargarPadres();
    cargarComunidades();
  }, []);

  const abrirCrear = () => {
    setForm({
      nombre: '',
      dpi: '',
      telefono: '',
      email: '',
      canalPreferido: 'email',
      comunidad: '',
    });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (padre) => {
    setForm({
      nombre: padre.nombre || '',
      dpi: padre.dpi || '',
      telefono: padre.telefono || '',
      email: padre.email || '',
      canalPreferido: padre.canalPreferido || 'email',
      comunidad: padre.comunidad?._id || '',
    });
    setEditando(padre);
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
        await api.put(`/padres/${editando._id}`, form);
      } else {
        await api.post('/padres', form);
      }

      await cargarPadres();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar el padre');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Nombre', valor: form.nombre, valorAnterior: editando?.nombre },
    { label: 'DPI', valor: form.dpi, valorAnterior: editando?.dpi },
    { label: 'Teléfono', valor: form.telefono, valorAnterior: editando?.telefono },
    { label: 'Email', valor: form.email, valorAnterior: editando?.email },
    { label: 'Canal preferido', valor: form.canalPreferido, valorAnterior: editando?.canalPreferido },
    {
      label: 'Comunidad',
      valor: comunidades.find((c) => c._id === form.comunidad)?.nombre || '',
      valorAnterior: editando?.comunidad?.nombre,
    },
  ];

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar este padre?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/padres/${id}`);
      await cargarPadres();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar el padre');
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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            Padres / Tutores
          </Typography>
          {puedeGestionar && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
              Nuevo Padre
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>DPI</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Canal</TableCell>
                  <TableCell>Comunidad</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {padres.length > 0 ? (
                  padres.map((padre) => (
                    <TableRow key={padre._id}>
                      <TableCell>{padre.nombre}</TableCell>
                      <TableCell>{padre.dpi}</TableCell>
                      <TableCell>{padre.telefono}</TableCell>
                      <TableCell>{padre.email}</TableCell>
                      <TableCell>{padre.canalPreferido}</TableCell>
                      <TableCell>{padre.comunidad?.nombre}</TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          <Stack direction="row" spacing={1}>
                            <IconButton aria-label="editar" onClick={() => abrirEditar(padre)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              aria-label="eliminar"
                              color="error"
                              onClick={() => eliminar(padre._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay padres registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Padre' : 'Nuevo Padre'}</DialogTitle>
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
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              select
              label="Canal preferido"
              fullWidth
              value={form.canalPreferido}
              onChange={(e) => setForm({ ...form, canalPreferido: e.target.value })}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="telegram">Telegram</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
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
    </Box>
  );
}
