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
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const ETIQUETAS_MOTIVO = {
  desnutricion: 'Desnutrición',
  sobrepeso: 'Sobrepeso',
  sin_registros: 'Sin controles',
  vacuna_atrasada: 'Vacuna atrasada',
};

export default function Alertas() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const puedeGestionar = usuario?.rol === 'admin' || usuario?.rol === 'encargado';
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [mensaje, setMensaje] = useState('');

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
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" component="h1">
            Alertas de Salud
          </Typography>
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
                {alertas.length > 0 ? (
                  alertas.map((alerta) => (
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
                      <TableCell>{alerta.nino?.nombre || '-'}</TableCell>
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
                      No hay alertas activas. Todo en orden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
