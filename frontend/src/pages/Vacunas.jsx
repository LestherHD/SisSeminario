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

function rangoEdadValido(valor) {
  const coincidencia = /^(\d+)-(\d+)$/.exec(valor.trim());
  return Boolean(coincidencia && Number(coincidencia[1]) <= Number(coincidencia[2]));
}

function textoRangoEdad(valor) {
  return valor ? `${valor} años` : '—';
}

function textoUnidadIntervalo(unidad) {
  return { dias: 'días', semanas: 'semanas', meses: 'meses' }[unidad] || 'meses';
}

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
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    rangoEdad: '',
    dosisMl: '',
    numeroDosis: 1,
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
      rangoEdad: '',
      dosisMl: '',
      numeroDosis: 1,
      intervaloValor: 0,
      intervaloUnidad: 'meses',
      descripcion: '',
    });
    setErrorFormulario('');
    setEditando(null);
    setDialogoAbierto(true);
  };

  const abrirEditar = (vacuna) => {
    setForm({
      nombre: vacuna.nombre || '',
      rangoEdad:
        vacuna.rangoEdad ||
        (vacuna.edadRecomendada != null
          ? `${vacuna.edadRecomendada}-${vacuna.edadRecomendada}`
          : ''),
      dosisMl: vacuna.dosisMl ?? '',
      numeroDosis: vacuna.numeroDosis ?? vacuna.dosisTotales ?? 1,
      intervaloValor: vacuna.intervaloValor ?? vacuna.intervaloMeses ?? 0,
      intervaloUnidad: vacuna.intervaloUnidad || 'meses',
      descripcion: vacuna.descripcion || '',
    });
    setErrorFormulario('');
    setEditando(vacuna);
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setErrorFormulario('');
  };

  const pedirConfirmacion = () => {
    if (!form.nombre.trim()) {
      setErrorFormulario('El nombre de la vacuna es obligatorio');
      return;
    }

    if (!rangoEdadValido(form.rangoEdad)) {
      setErrorFormulario('El rango de edad debe tener el formato 0-1, sin letras ni espacios');
      return;
    }

    if (form.dosisMl === '' || Number(form.dosisMl) <= 0) {
      setErrorFormulario('La dosis en ml es obligatoria y debe ser mayor que 0');
      return;
    }

    if (Number(form.numeroDosis) < 1) {
      setErrorFormulario('El número de dosis debe ser al menos 1');
      return;
    }

    if (Number(form.numeroDosis) >= 2 && Number(form.intervaloValor) <= 0) {
      setErrorFormulario('La cantidad del intervalo debe ser mayor que 0');
      return;
    }

    setErrorFormulario('');
    setDialogoAbierto(false);
    setConfirmacionAbierta(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');

    try {
      const payload = {
        nombre: form.nombre.trim(),
        rangoEdad: form.rangoEdad.trim(),
        dosisMl: form.dosisMl === '' ? null : Number(form.dosisMl),
        numeroDosis: Number(form.numeroDosis),
        intervaloValor: Number(form.numeroDosis) <= 1 ? 0 : Number(form.intervaloValor),
        intervaloUnidad: form.intervaloUnidad,
        descripcion: form.descripcion.trim(),
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
      label: 'Rango de edad (años)',
      valor: form.rangoEdad ? textoRangoEdad(form.rangoEdad) : 'No especificado',
      valorAnterior: editando?.rangoEdad ? textoRangoEdad(editando.rangoEdad) : undefined,
    },
    {
      label: 'Dosis (ml)',
      valor: form.dosisMl === '' ? 'No especificada' : `${form.dosisMl} ml`,
      valorAnterior: editando?.dosisMl != null ? `${editando.dosisMl} ml` : undefined,
    },
    {
      label: 'Número de dosis',
      valor: form.numeroDosis,
      valorAnterior: editando?.numeroDosis ?? editando?.dosisTotales,
    },
    {
      label: 'Intervalo entre dosis',
      valor:
        Number(form.numeroDosis) <= 1
          ? 'Dosis única'
          : `${form.intervaloValor} ${textoUnidadIntervalo(form.intervaloUnidad)}`,
      valorAnterior: editando
        ? (editando.numeroDosis ?? editando.dosisTotales ?? 1) <= 1
          ? 'Dosis única'
          : `${editando.intervaloValor ?? editando.intervaloMeses ?? 0} ${textoUnidadIntervalo(
              editando.intervaloUnidad
            )}`
        : undefined,
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
            Vacunas
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
            <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Rango de edad (años)</TableCell>
                  <TableCell>Dosis (ml)</TableCell>
                  <TableCell>N° Dosis</TableCell>
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
                      <TableCell>{textoRangoEdad(vacuna.rangoEdad)}</TableCell>
                      <TableCell>{vacuna.dosisMl != null ? `${vacuna.dosisMl} ml` : '—'}</TableCell>
                      <TableCell>{vacuna.numeroDosis ?? 1}</TableCell>
                      <TableCell>
                        {(vacuna.numeroDosis ?? 1) > 1
                          ? `${vacuna.intervaloValor ?? vacuna.intervaloMeses ?? 0} ${textoUnidadIntervalo(
                              vacuna.intervaloUnidad
                            )}`
                          : 'Dosis única'}
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
                    <TableCell colSpan={7} align="center">
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
            {errorFormulario && <Alert severity="error">{errorFormulario}</Alert>}
            <TextField
              label="Nombre"
              required
              fullWidth
              value={form.nombre}
              onChange={(e) => {
                setForm({ ...form, nombre: e.target.value });
                setErrorFormulario('');
              }}
            />
            <TextField
              label="Rango de edad recomendada (años)"
              required
              fullWidth
              placeholder="ej. 0-1"
              error={form.rangoEdad !== '' && !rangoEdadValido(form.rangoEdad)}
              helperText={
                form.rangoEdad !== '' && !rangoEdadValido(form.rangoEdad)
                  ? 'Formato incorrecto. Use solamente números y un guion, por ejemplo: 0-1'
                  : 'Ingrese el rango en años: 0-1, 1-3, 5-10'
              }
              value={form.rangoEdad}
              onChange={(e) => {
                setForm({ ...form, rangoEdad: e.target.value });
                setErrorFormulario('');
              }}
            />
            <TextField
              label="Dosis (ml)"
              type="number"
              fullWidth
              required
              value={form.dosisMl}
              onChange={(e) => {
                setForm({ ...form, dosisMl: e.target.value });
                setErrorFormulario('');
              }}
              placeholder="ej. 0.5"
              helperText="Volumen a aplicar en mililitros"
              inputProps={{ min: 0.01, step: 0.01 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">ml</InputAdornment>,
              }}
            />
            <TextField
              label="Número de dosis"
              type="number"
              fullWidth
              required
              value={form.numeroDosis}
              onChange={(e) => {
                const numeroDosis = e.target.value;
                setForm({
                  ...form,
                  numeroDosis,
                  intervaloValor: Number(numeroDosis) <= 1 ? 0 : form.intervaloValor,
                });
                setErrorFormulario('');
              }}
              inputProps={{ min: 1, step: 1 }}
            />
            {Number(form.numeroDosis) >= 2 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Unidad del intervalo"
                  fullWidth
                  value={form.intervaloUnidad}
                  onChange={(e) => setForm({ ...form, intervaloUnidad: e.target.value })}
                  helperText="Seleccione días, semanas o meses"
                >
                  <MenuItem value="dias">Días</MenuItem>
                  <MenuItem value="semanas">Semanas</MenuItem>
                  <MenuItem value="meses">Meses</MenuItem>
                </TextField>
                <TextField
                  label="Cantidad del intervalo"
                  type="number"
                  fullWidth
                  required
                  value={form.intervaloValor}
                  onChange={(e) => {
                    setForm({ ...form, intervaloValor: e.target.value });
                    setErrorFormulario('');
                  }}
                  helperText={`Cantidad de ${textoUnidadIntervalo(form.intervaloUnidad)}`}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Stack>
            )}
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
