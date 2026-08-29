import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PrintIcon from '@mui/icons-material/Print';
import Expediente from '../components/Expediente.jsx';

export default function ConsultarCarnet() {
  const navigate = useNavigate();
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || '');
  const [pin, setPin] = useState('');
  const [carnet, setCarnet] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [informacionAbierta, setInformacionAbierta] = useState(false);

  const consultar = async () => {
    if (!codigo.trim() || !pin.trim()) {
      setError('Ingresa el código y el PIN');
      return;
    }

    setError('');
    setCargando(true);

    try {
      const response = await api.post(`/carnet/ver/${codigo}`, { pin });
      setCarnet(response.data);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'PIN incorrecto o carnet no encontrado');
    } finally {
      setCargando(false);
    }
  };

  const consultarOtro = () => {
    setCarnet(null);
    setError('');
    setPin('');

    if (!codigoParam) {
      setCodigo('');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        px: 2,
        py: 4,
        '@media print': {
          minHeight: 'auto',
          alignItems: 'flex-start',
          bgcolor: 'white',
          px: 0,
          py: 0,
        },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: carnet ? 1200 : 500,
          '@media print': { boxShadow: 'none', maxWidth: 'none', p: 1 },
        }}
      >
        <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
          🏥 SCCVI - Consulta de Carnet
        </Typography>

        {!carnet && (
          <>
            <TextField
              label="Código de carnet"
              placeholder="CS-XXXX"
              fullWidth
              value={codigo}
              disabled={Boolean(codigoParam)}
              onChange={(e) => setCodigo(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="PIN"
              type="password"
              placeholder="4 dígitos"
              fullWidth
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={consultar}
              disabled={cargando}
              sx={{ mb: 2 }}
            >
              {cargando ? <CircularProgress size={24} color="inherit" /> : 'Consultar'}
            </Button>

            <Button fullWidth onClick={() => navigate('/login')}>
              Volver al inicio
            </Button>
          </>
        )}

        {carnet && (
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
              sx={{ mb: 3 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Expediente de salud
                </Typography>
                <Tooltip title="¿Qué significan los percentiles?">
                  <IconButton
                    color="primary"
                    aria-label="Información sobre percentiles"
                    onClick={() => setInformacionAbierta(true)}
                    sx={{ displayPrint: 'none' }}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ displayPrint: 'none' }}
              >
                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                >
                  Imprimir carnet
                </Button>
                <Button variant="outlined" onClick={consultarOtro}>
                  Consultar otro carnet
                </Button>
              </Stack>
            </Stack>
            <Expediente {...carnet} />
          </Box>
        )}

      </Paper>

      <Dialog
        open={informacionAbierta}
        onClose={() => setInformacionAbierta(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>¿Qué significan estos indicadores?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography variant="body2">
              El percentil compara el peso de su hijo/a con el de otros niños de su edad.
            </Typography>
            <Typography variant="body2">
              <b>Desnutrición (rojo):</b> el peso está por debajo de lo saludable. Consulte
              al personal de salud.
            </Typography>
            <Typography variant="body2">
              <b>Normal (verde):</b> el peso está en un rango saludable.
            </Typography>
            <Typography variant="body2">
              <b>Sobrepeso u obesidad (naranja/rojo):</b> el peso está por encima de lo
              recomendado. El personal de salud puede orientarle.
            </Typography>
            <Typography variant="body2">
              La talla indica la estatura de su hijo/a comparada con otros niños de su edad.
              Una talla baja puede requerir seguimiento por el personal de salud.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInformacionAbierta(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
