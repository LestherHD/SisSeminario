import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const FORM_INICIAL = {
  nombre: '',
  email: '',
  rol: 'personal',
  password: '',
  confirmarPassword: '',
};

const NOMBRES_ROL = {
  admin: 'Administrador',
  encargado: 'Encargado',
  personal: 'Personal de enfermería',
};

export default function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [cambioEstado, setCambioEstado] = useState(null);

  const cargarUsuarios = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (errorCarga) {
      setError(errorCarga.response?.data?.mensaje || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const response = await api.get('/usuarios');
        if (activo) setUsuarios(response.data);
      } catch (errorCarga) {
        if (activo) setError(errorCarga.response?.data?.mensaje || 'Error al cargar usuarios');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInicial();
    return () => {
      activo = false;
    };
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es');
    return usuarios.filter((usuario) =>
      [usuario.nombre, usuario.email, NOMBRES_ROL[usuario.rol]]
        .filter(Boolean)
        .some((valor) => valor.toLocaleLowerCase('es').includes(texto))
    );
  }, [busqueda, usuarios]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErrorFormulario('');
    setDialogoAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: '',
      confirmarPassword: '',
    });
    setErrorFormulario('');
    setDialogoAbierto(true);
  };

  const guardar = async (event) => {
    event.preventDefault();
    setErrorFormulario('');

    if (!form.nombre.trim() || !form.email.trim()) {
      setErrorFormulario('Nombre y correo son obligatorios');
      return;
    }

    if (!editando && form.password !== form.confirmarPassword) {
      setErrorFormulario('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await api.put(`/usuarios/${editando._id}`, {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
        });
      } else {
        await api.post('/usuarios', {
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          password: form.password,
        });
      }
      setDialogoAbierto(false);
      setMensaje(editando ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      await cargarUsuarios();
    } catch (errorGuardado) {
      setErrorFormulario(errorGuardado.response?.data?.mensaje || 'Error al guardar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarCambioEstado = async () => {
    if (!cambioEstado) return;
    setGuardando(true);
    try {
      await api.patch(`/usuarios/${cambioEstado._id}/estado`, {
        activo: !cambioEstado.activo,
      });
      setCambioEstado(null);
      setMensaje(cambioEstado.activo ? 'Usuario desactivado' : 'Usuario reactivado');
      await cargarUsuarios();
    } catch (errorCambio) {
      setError(errorCambio.response?.data?.mensaje || 'Error al cambiar el estado del usuario');
      setCambioEstado(null);
    } finally {
      setGuardando(false);
    }
  };

  const idActual = usuarioActual?._id || usuarioActual?.id;
  const acciones = (usuario) => {
    const esPropio = usuario._id === idActual;
    return (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Editar usuario">
          <IconButton color="primary" onClick={() => abrirEditar(usuario)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={esPropio ? 'No puede desactivar su propia cuenta' : usuario.activo ? 'Desactivar' : 'Reactivar'}>
          <span>
            <IconButton
              color={usuario.activo ? 'error' : 'success'}
              disabled={esPropio}
              onClick={() => setCambioEstado(usuario)}
            >
              {usuario.activo ? <PersonOffIcon /> : <PersonAddAltIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  };

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
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '2rem', sm: '2.125rem' } }}>
            Usuarios
          </Typography>
          <Typography color="text.secondary">Cuentas y permisos del personal</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
          Nuevo usuario
        </Button>
      </Box>

      {mensaje && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>{mensaje}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TextField
        label="Buscar usuario"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
      />

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuariosFiltrados.map((usuario) => (
                  <TableRow key={usuario._id} hover>
                    <TableCell>{usuario.nombre}{usuario._id === idActual ? ' (usted)' : ''}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{NOMBRES_ROL[usuario.rol] || usuario.rol}</TableCell>
                    <TableCell>
                      <Chip size="small" color={usuario.activo ? 'success' : 'default'} label={usuario.activo ? 'Activo' : 'Inactivo'} />
                    </TableCell>
                    <TableCell>{acciones(usuario)}</TableCell>
                  </TableRow>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No hay usuarios que coincidan</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {usuariosFiltrados.map((usuario) => (
              <Card key={usuario._id} variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="h6">{usuario.nombre}</Typography>
                    <Chip size="small" color={usuario.activo ? 'success' : 'default'} label={usuario.activo ? 'Activo' : 'Inactivo'} />
                  </Stack>
                  <Typography color="text.secondary">{usuario.email}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{NOMBRES_ROL[usuario.rol]}</Typography>
                </CardContent>
                <CardActions>{acciones(usuario)}</CardActions>
              </Card>
            ))}
          </Stack>
        </>
      )}

      <Dialog open={dialogoAbierto} onClose={() => setDialogoAbierto(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={guardar}>
          <DialogTitle>{editando ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {errorFormulario && <Alert severity="error">{errorFormulario}</Alert>}
              <TextField label="Nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <TextField type="email" label="Correo electrónico" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField
                select
                label="Rol"
                value={form.rol}
                disabled={Boolean(editando && editando._id === idActual)}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              >
                <MenuItem value="personal">Personal de enfermería</MenuItem>
                <MenuItem value="encargado">Encargado</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </TextField>
              {!editando && (
                <>
                  <TextField type="password" label="Contraseña" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número." />
                  <TextField
                    type="password"
                    label="Confirmar contraseña"
                    required
                    value={form.confirmarPassword}
                    onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                    error={form.confirmarPassword !== '' && form.password !== form.confirmarPassword}
                    helperText={form.confirmarPassword !== '' && form.password !== form.confirmarPassword ? 'Las contraseñas no coinciden' : 'Repita la contraseña.'}
                  />
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogoAbierto(false)} disabled={guardando}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(cambioEstado)} onClose={() => setCambioEstado(null)} fullWidth maxWidth="xs">
        <DialogTitle>{cambioEstado?.activo ? '¿Desactivar usuario?' : '¿Reactivar usuario?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {cambioEstado?.activo
              ? `${cambioEstado?.nombre} ya no podrá iniciar sesión.`
              : `${cambioEstado?.nombre} podrá volver a iniciar sesión.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCambioEstado(null)} disabled={guardando}>Cancelar</Button>
          <Button
            variant="contained"
            color={cambioEstado?.activo ? 'error' : 'success'}
            onClick={confirmarCambioEstado}
            disabled={guardando}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
