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
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';

export default function Vacunas() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [vacunas, setVacunas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    edadRecomendada: 0,
    dosisTotales: 1,
    intervaloValor: 0,
    intervaloUnidad: 'meses',
    descripcion: '',
  });

  const cargarVacunas = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await api.get(
        mostrarInactivos ? '/vacunas?incluirInactivos=true' : '/vacunas'
      );
      setVacunas(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar vacunas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVacunas();
  }, [mostrarInactivos]);

  const abrirCrear = () => {
    setForm({
      nombre: '',
      edadRecomendada: 0,
      dosisTotales: 1,
      intervaloValor: 0,
      intervaloUnidad: 'meses',
      descripcion: '',
    });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (vacuna) => {
    setForm({
      nombre: vacuna.nombre || '',
      edadRecomendada: vacuna.edadRecomendada ?? 0,
      dosisTotales: vacuna.dosisTotales ?? 1,
      intervaloValor: vacuna.intervaloValor ?? 0,
      intervaloUnidad: vacuna.intervaloUnidad || 'meses',
      descripcion: vacuna.descripcion || '',
    });
    setEditando(vacuna);
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
        ...form,
        edadRecomendada: Number(form.edadRecomendada),
        dosisTotales: Number(form.dosisTotales),
        intervaloValor: Number(form.intervaloValor),
      };

      if (editando) {
        await api.put(`/vacunas/${editando._id}`, payload);
      } else {
        await api.post('/vacunas', payload);
      }

      await cargarVacunas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar la vacuna');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Nombre', valor: form.nombre, valorAnterior: editando?.nombre },
    {
      label: 'Edad recomendada (meses)',
      valor: form.edadRecomendada,
      valorAnterior: editando?.edadRecomendada,
    },
    { label: 'Dosis totales', valor: form.dosisTotales, valorAnterior: editando?.dosisTotales },
    {
      label: 'Intervalo',
      valor: `${form.intervaloValor} ${form.intervaloUnidad}`,
      valorAnterior: editando ? `${editando.intervaloValor} ${editando.intervaloUnidad}` : undefined,
    },
    { label: 'Descripción', valor: form.descripcion, valorAnterior: editando?.descripcion },
  ];

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar esta vacuna?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/vacunas/${id}`);
      await cargarVacunas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la vacuna');
    }
  };

  const reactivar = async (id) => {
    try {
      await api.patch(`/vacunas/${id}/reactivar`);
      await cargarVacunas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al reactivar la vacuna');
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
            Vacunas
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                />
              }
              label="Mostrar inactivas"
            />
            {puedeGestionar && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
                Nueva Vacuna
              </Button>
            )}
          </Stack>
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
                  <TableCell>Edad (meses)</TableCell>
                  <TableCell>Dosis</TableCell>
                  <TableCell>Intervalo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunas.length > 0 ? (
                  vacunas.map((vacuna) => (
                    <TableRow key={vacuna._id}>
                      <TableCell>{vacuna.nombre}</TableCell>
                      <TableCell>{vacuna.edadRecomendada ?? '-'}</TableCell>
                      <TableCell>{vacuna.dosisTotales ?? 1}</TableCell>
                      <TableCell>
                        {(vacuna.dosisTotales ?? 1) > 1
                          ? `${vacuna.intervaloValor ?? 0} ${vacuna.intervaloUnidad ?? 'meses'}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={vacuna.activo ? 'success' : 'default'}
                          label={vacuna.activo ? 'Activo' : 'Inactivo'}
                        />
                      </TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          vacuna.activo ? (
                            <Stack direction="row" spacing={1}>
                              <IconButton aria-label="editar" onClick={() => abrirEditar(vacuna)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                aria-label="eliminar"
                                color="error"
                                onClick={() => eliminar(vacuna._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          ) : (
                            <IconButton
                              aria-label="reactivar"
                              color="primary"
                              title="Reactivar"
                              onClick={() => reactivar(vacuna._id)}
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
                    <TableCell colSpan={6} align="center">
                      No hay vacunas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Vacuna' : 'Nueva Vacuna'}</DialogTitle>
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
              label="Edad recomendada (meses)"
              type="number"
              fullWidth
              value={form.edadRecomendada}
              onChange={(e) => setForm({ ...form, edadRecomendada: e.target.value })}
            />
            <TextField
              label="Número de dosis"
              type="number"
              fullWidth
              value={form.dosisTotales}
              onChange={(e) => setForm({ ...form, dosisTotales: e.target.value })}
            />
            <TextField
              label="Intervalo entre dosis"
              type="number"
              fullWidth
              value={form.intervaloValor}
              onChange={(e) => setForm({ ...form, intervaloValor: e.target.value })}
            />
            <TextField
              select
              label="Unidad del intervalo"
              fullWidth
              value={form.intervaloUnidad}
              onChange={(e) => setForm({ ...form, intervaloUnidad: e.target.value })}
            >
              <MenuItem value="dias">Días</MenuItem>
              <MenuItem value="semanas">Semanas</MenuItem>
              <MenuItem value="meses">Meses</MenuItem>
            </TextField>
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
        titulo="Vacuna"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />
    </Box>
  );
}