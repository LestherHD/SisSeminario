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
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import DialogoEliminar from '../components/DialogoEliminar.jsx';

export default function Vacunas() {
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [vacunas, setVacunas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busquedaVacuna, setBusquedaVacuna] = useState('');
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);
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

  const confirmarEliminar = async () => {
    if (!eliminacion.elemento) return;
    setEliminando(true);
    try {
      await api.delete(`/vacunas/${eliminacion.elemento._id}`);
      await cargarVacunas();
      setEliminacion({ abierto: false, elemento: null });
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la vacuna');
    } finally {
      setEliminando(false);
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

  const vacunasFiltradas = vacunas.filter((vacuna) =>
    vacuna.nombre?.toLowerCase().includes(busquedaVacuna.trim().toLowerCase())
  );

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
            Vacunas
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
                Nueva Vacuna
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
              label="Buscar vacuna..."
              value={busquedaVacuna}
              onChange={(event) => setBusquedaVacuna(event.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
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
                {vacunasFiltradas.length > 0 ? (
                  vacunasFiltradas.map((vacuna) => (
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
                                onClick={() => setEliminacion({ abierto: true, elemento: vacuna })}
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
                      {busquedaVacuna ? 'No se encontraron vacunas' : 'No hay vacunas registradas'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </Stack>
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

      <DialogoEliminar
        abierto={eliminacion.abierto}
        titulo={`¿Eliminar ${eliminacion.elemento?.nombre || 'esta vacuna'}?`}
        cargando={eliminando}
        onCancelar={() => setEliminacion({ abierto: false, elemento: null })}
        onConfirmar={confirmarEliminar}
      />
    </Box>
  );
}
