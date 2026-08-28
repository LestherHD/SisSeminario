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
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import { departamentos } from '../data/guatemala.js';

export default function Comunidades() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', departamento: '', municipio: '' });
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
    setErrorFormulario('');
    setForm({ nombre: '', departamento: '', municipio: '' });
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (comunidad) => {
    setErrorFormulario('');
    setForm({
      nombre: comunidad.nombre || '',
      departamento: comunidad.departamento || '',
      municipio: comunidad.municipio || '',
    });
    setEditando(comunidad);
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    setErrorFormulario('');
    setDialogoAbierto(false);
  };

  const pedirConfirmacion = () => {
    if (!form.nombre.trim()) {
      setErrorFormulario('El nombre de la comunidad es obligatorio');
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
        await api.put(`/comunidades/${editando._id}`, form);
      } else {
        await api.post('/comunidades', form);
      }

      await cargarComunidades();
      setConfirmacionAbierta(false);
      setDialogoAbierto(false);
    } catch (error) {
      setErrorFormulario(error.response?.data?.mensaje || 'Error al guardar la comunidad');
      setConfirmacionAbierta(false);
      setDialogoAbierto(true);
    } finally {
      setGuardando(false);
    }
  };

  const camposConfirmacion = [
    { label: 'Departamento', valor: form.departamento, valorAnterior: editando?.departamento },
    { label: 'Municipio', valor: form.municipio, valorAnterior: editando?.municipio },
    { label: 'Nombre de la comunidad/aldea', valor: form.nombre, valorAnterior: editando?.nombre },
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
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
                  <TableCell>Departamento</TableCell>
                  <TableCell>Municipio</TableCell>
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
                      <TableCell>{comunidad.departamento}</TableCell>
                      <TableCell>{comunidad.municipio}</TableCell>
                      <TableCell>{comunidad.numeroFamilias}</TableCell>
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
                    <TableCell colSpan={6} align="center">
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
            {errorFormulario && (
              <Alert severity="error" onClose={() => setErrorFormulario('')}>
                {errorFormulario}
              </Alert>
            )}
            <Autocomplete
              options={departamentos.map((item) => item.departamento)}
              value={form.departamento || null}
              onChange={(event, departamento) => setForm({
                ...form,
                departamento: departamento || '',
                municipio: '',
              })}
              renderInput={(params) => (
                <TextField {...params} label="Departamento" required />
              )}
              fullWidth
            />
            <Autocomplete
              options={
                departamentos.find((item) => item.departamento === form.departamento)
                  ?.municipios || []
              }
              value={form.municipio || null}
              onChange={(event, municipio) => setForm({
                ...form,
                municipio: municipio || '',
              })}
              disabled={!form.departamento}
              renderInput={(params) => (
                <TextField {...params} label="Municipio" required />
              )}
              fullWidth
            />
            <TextField
              label="Nombre de la comunidad/aldea"
              type="text"
              required
              disabled={!form.municipio}
              fullWidth
              value={form.nombre}
              onChange={(e) => {
                setForm({ ...form, nombre: e.target.value });
                setErrorFormulario('');
              }}
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
