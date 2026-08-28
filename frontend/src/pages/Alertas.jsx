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
  Chip,
  IconButton,
  Stack,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SearchIcon from '@mui/icons-material/Search';
import BuildIcon from '@mui/icons-material/Build';
import SendIcon from '@mui/icons-material/Send';

const RUTA_POR_MOTIVO = {
  sin_registros: '/crecimiento',
  desnutricion: '/crecimiento',
  sobrepeso: '/crecimiento',
  vacuna_atrasada: '/vacunacion',
};

const ETIQUETAS_MOTIVO = {
  desnutricion: 'Desnutrición',
  sobrepeso: 'Sobrepeso',
  sin_registros: 'Sin controles',
  vacuna_atrasada: 'Vacuna atrasada',
};

export default function Alertas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todas');

  const cargarAlertas = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await api.get('/alertas');
      setAlertas(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al cargar alertas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const analizar = async () => {
    setAnalizando(true);

    try {
      const response = await api.post('/alertas/analizar');
      setMensaje(response.data?.mensaje || '');
      await cargarAlertas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al analizar alertas');
    } finally {
      setAnalizando(false);
    }
  };

  const atender = async (id) => {
    try {
      await api.patch(`/alertas/${id}/atender`);
      await cargarAlertas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al actualizar la alerta');
    }
  };

  const eliminar = async (id) => {
    const confirmado = window.confirm('¿Eliminar esta alerta?');

    if (!confirmado) {
      return;
    }

    try {
      await api.delete(`/alertas/${id}`);
      await cargarAlertas();
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al eliminar la alerta');
    }
  };

  const notificar = async (alertaId) => {
    try {
      const response = await api.post('/notificaciones/alerta', { alertaId });
      setMensaje(response.data?.mensaje || '');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al notificar a los padres');
    }
  };

  const resolver = (alerta) => {
    const ruta = RUTA_POR_MOTIVO[alerta.motivo] || '/crecimiento';
    navigate(`${ruta}?nino=${alerta.nino?._id}`);
  };

  const alertasFiltradas = alertas.filter((a) => {
    const coincideNombre = a.nino?.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = filtroTipo === 'todas' || a.tipo === filtroTipo;
    return coincideNombre && coincideTipo;
  });

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
            Alertas de Salud
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {puedeGestionar && (
              <Button
                variant="contained"
                startIcon={
                  analizando ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />
                }
                onClick={analizar}
                disabled={analizando}
              >
                Analizar Ahora
              </Button>
            )}
          </Stack>
        </Box>

        {mensaje && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setMensaje('')}>
            {mensaje}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Buscar por niño"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                sx={{ width: 180 }}
              >
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="critica">Críticas</MenuItem>
                <MenuItem value="preventiva">Preventivas</MenuItem>
              </TextField>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Mostrando {alertasFiltradas.length} de {alertas.length} alertas
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Niño</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Mensaje</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alertasFiltradas.length > 0 ? (
                    alertasFiltradas.map((alerta) => (
                      <TableRow key={alerta._id} sx={alerta.atendida ? { opacity: 0.6 } : undefined}>
                        <TableCell>
                          {alerta.tipo === 'critica' ? (
                            <Chip color="error" icon={<ErrorIcon />} label="Crítica" size="small" />
                          ) : (
                            <Chip
                              color="warning"
                              icon={<WarningIcon />}
                              label="Preventiva"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>{alerta.nino?.nombreCompleto || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={ETIQUETAS_MOTIVO[alerta.motivo] || alerta.motivo}
                          />
                        </TableCell>
                        <TableCell>{alerta.mensaje}</TableCell>
                        <TableCell>
                          {alerta.fecha ? new Date(alerta.fecha).toLocaleDateString('es-GT') : '-'}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title="Resolver">
                              <IconButton color="primary" onClick={() => resolver(alerta)}>
                                <BuildIcon />
                              </IconButton>
                            </Tooltip>
                            {puedeGestionar && (
                              <Tooltip title="Notificar a los padres">
                                <IconButton color="info" onClick={() => notificar(alerta._id)}>
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {alerta.atendida ? (
                              <Chip color="success" size="small" label="Atendida" />
                            ) : (
                              <Tooltip title="Marcar como atendida">
                                <IconButton color="success" onClick={() => atender(alerta._id)}>
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {puedeGestionar && (
                              <IconButton color="error" onClick={() => eliminar(alerta._id)}>
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {alertas.length > 0
                          ? 'No se encontraron alertas con ese criterio.'
                          : 'No hay alertas activas. Todo en orden.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Box>
  );
}
