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
  FormControlLabel,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';

export default function Comunidades() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', ubicacion: '', numFamilias: 0 });
  const [guardando, setGuardando] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);

  const cargarComunidades = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await api.get(
        mostrarInactivos ? '/comunidades?incluirInactivos=true' : '/comunidades'
      );
      setComunidades(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar comunidades');
    } finally {
      setCargando(false);
    }
  };

  const abrirCrear = () => {
    setForm({ nombre: '', ubicacion: '', numFamilias: 0 });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (comunidad) => {
    setForm({
      nombre: comunidad.nombre || '',
      ubicacion: comunidad.ubicacion || '',
      numFamilias: comunidad.numFamilias ?? 0,
    });
    setEditando(comunidad);
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
        numFamilias: Number(form.numFamilias),
      };

      if (editando) {
        await api.put(`/comunidades/${editando._id}`, payload);
      } else {
        await api.post('/comunidades', payload);
      }

      await cargarComunidades();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al guardar la comunidad');
    } finally {
      setGuardando(false);
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Nombre', valor: form.nombre, valorAnterior: editando?.nombre },
    { label: 'Ubicación', valor: form.ubicacion, valorAnterior: editando?.ubicacion },
    { label: 'N° Familias', valor: form.numFamilias, valorAnterior: editando?.numFamilias },
  ];

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar esta comunidad?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/comunidades/${id}`);
      await cargarComunidades();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la comunidad');
    }
  };

  const reactivar = async (id) => {
    try {
      await api.patch(`/comunidades/${id}/reactivar`);
      await cargarComunidades();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al reactivar la comunidad');
    }
  };

  useEffect(() => {
    cargarComunidades();
  }, [mostrarInactivos]);

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
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Comunidades
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
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
                Nueva Comunidad
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
                  <TableCell>Ubicación</TableCell>
                  <TableCell>N° Familias</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comunidades.length > 0 ? (
                  comunidades.map((comunidad) => (
                    <TableRow key={comunidad._id}>
                      <TableCell>{comunidad.nombre}</TableCell>
                      <TableCell>{comunidad.ubicacion}</TableCell>
                      <TableCell>{comunidad.numFamilias}</TableCell>
                      <TableCell>
                        <Chip
                          color={comunidad.activo ? 'success' : 'default'}
                          label={comunidad.activo ? 'Activa' : 'Inactiva'}
                        />
                      </TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          comunidad.activo ? (
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                aria-label="editar"
                                onClick={() => abrirEditar(comunidad)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                aria-label="eliminar"
                                color="error"
                                onClick={() => eliminar(comunidad._id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Stack>
                          ) : (
                            <IconButton
                              aria-label="reactivar"
                              color="primary"
                              title="Reactivar"
                              onClick={() => reactivar(comunidad._id)}
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
                    <TableCell colSpan={5} align="center">
                      No hay comunidades registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar Comunidad' : 'Nueva Comunidad'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              type="text"
              fullWidth
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <TextField
              label="Ubicación"
              type="text"
              fullWidth
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            />
            <TextField
              label="N° Familias"
              type="number"
              fullWidth
              value={form.numFamilias}
              onChange={(e) => setForm({ ...form, numFamilias: e.target.value })}
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
        titulo="Comunidad"
        campos={camposConfirmacion}
        cargando={guardando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={guardar}
      />
    </Box>
  );
}
