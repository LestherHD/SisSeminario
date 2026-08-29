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
  Tooltip,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DialogoConfirmacion from '../components/DialogoConfirmacion.jsx';
import DialogoEliminar from '../components/DialogoEliminar.jsx';
import { departamentos } from '../data/guatemala.js';

export default function Comunidades() {
  const { usuario } = useAuth();
  const puedeGestionar = ['admin', 'encargado', 'personal'].includes(usuario?.rol);
  const puedeEliminar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
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
  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [eliminacion, setEliminacion] = useState({ abierto: false, elemento: null });
  const [eliminando, setEliminando] = useState(false);

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

  const abrirCrearEnGrupo = (grupo) => {
    setErrorFormulario('');
    setForm({
      nombre: '',
      departamento: grupo.departamento,
      municipio: grupo.municipio,
    });
    setEditando(null);
    setGrupoSeleccionado(null);
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
    setGrupoSeleccionado(null);
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

  const confirmarEliminar = async () => {
    if (!eliminacion.elemento) return;
    setEliminando(true);
    try {
      await api.delete(`/comunidades/${eliminacion.elemento._id}`);
      await cargarComunidades();
      setEliminacion({ abierto: false, elemento: null });
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la comunidad');
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    cargarComunidades();
  }, [mostrarInactivos]);

  const grupos = Array.from(
    comunidades.reduce((mapa, comunidad) => {
      const clave = `${comunidad.departamento}::${comunidad.municipio}`;
      const grupo = mapa.get(clave) || {
        departamento: comunidad.departamento,
        municipio: comunidad.municipio,
        cantidadComunidades: 0,
        totalFamilias: 0,
        comunidades: [],
      };

      grupo.cantidadComunidades += 1;
      grupo.totalFamilias += Number(comunidad.numeroFamilias) || 0;
      grupo.comunidades.push(comunidad);
      mapa.set(clave, grupo);
      return mapa;
    }, new Map()).values()
  ).sort((a, b) =>
    a.departamento.localeCompare(b.departamento, 'es') ||
    a.municipio.localeCompare(b.municipio, 'es')
  );

  const textoBusqueda = busqueda.trim().toLocaleLowerCase('es');
  const gruposFiltrados = grupos.filter(
    (grupo) =>
      grupo.departamento.toLocaleLowerCase('es').includes(textoBusqueda) ||
      grupo.municipio.toLocaleLowerCase('es').includes(textoBusqueda)
  );

  const grupoVisible = grupoSeleccionado
    ? grupos.find(
        (grupo) =>
          grupo.departamento === grupoSeleccionado.departamento &&
          grupo.municipio === grupoSeleccionado.municipio
      ) || { ...grupoSeleccionado, comunidades: [], cantidadComunidades: 0, totalFamilias: 0 }
    : null;

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
            Comunidades
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
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={abrirCrear}
                fullWidth
              >
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
          <Stack spacing={2}>
            <TextField
              label="Buscar por departamento o municipio"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
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
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Municipio</TableCell>
                    <TableCell>Comunidades</TableCell>
                    <TableCell>Familias</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gruposFiltrados.length > 0 ? (
                    gruposFiltrados.map((grupo) => (
                      <TableRow key={`${grupo.departamento}-${grupo.municipio}`}>
                        <TableCell>{grupo.departamento}</TableCell>
                        <TableCell>{grupo.municipio}</TableCell>
                        <TableCell>{grupo.cantidadComunidades}</TableCell>
                        <TableCell>{grupo.totalFamilias}</TableCell>
                        <TableCell>
                          <Tooltip title="Ver comunidades">
                            <IconButton
                              aria-label={`Ver comunidades de ${grupo.municipio}`}
                              color="primary"
                              onClick={() => setGrupoSeleccionado(grupo)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {busqueda
                          ? 'No hay municipios que coincidan con la búsqueda'
                          : 'No hay comunidades registradas'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </Box>

      <Dialog
        open={Boolean(grupoSeleccionado)}
        onClose={() => setGrupoSeleccionado(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Comunidades de {grupoVisible?.municipio}, {grupoVisible?.departamento}
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Comunidad / Aldea</TableCell>
                  <TableCell>Familias</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grupoVisible?.comunidades.length > 0 ? (
                  grupoVisible.comunidades.map((comunidad) => (
                    <TableRow key={comunidad._id}>
                      <TableCell>{comunidad.nombre}</TableCell>
                      <TableCell>{comunidad.numeroFamilias}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={comunidad.activo ? 'success' : 'default'}
                          label={comunidad.activo ? 'Activa' : 'Inactiva'}
                        />
                      </TableCell>
                      <TableCell>
                        {puedeGestionar ? (
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Editar comunidad">
                              <IconButton
                                aria-label={`Editar ${comunidad.nombre}`}
                                onClick={() => abrirEditar(comunidad)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            {puedeEliminar && (
                              <Tooltip title="Borrar comunidad">
                                <IconButton
                                  aria-label={`Borrar ${comunidad.nombre}`}
                                  color="error"
                                  onClick={() => setEliminacion({ abierto: true, elemento: comunidad })}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay comunidades para mostrar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          {puedeGestionar && grupoVisible && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirCrearEnGrupo(grupoVisible)}
            >
              Nueva comunidad en {grupoVisible.municipio}
            </Button>
          )}
          <Button onClick={() => setGrupoSeleccionado(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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

      <DialogoEliminar
        abierto={eliminacion.abierto}
        titulo={`¿Eliminar ${eliminacion.elemento?.nombre || 'esta comunidad'}?`}
        cargando={eliminando}
        onCancelar={() => setEliminacion({ abierto: false, elemento: null })}
        onConfirmar={confirmarEliminar}
      />
    </Box>
  );
}
