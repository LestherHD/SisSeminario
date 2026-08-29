import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  InputAdornment,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PrintIcon from '@mui/icons-material/Print';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded';
import Expediente from '../components/Expediente.jsx';
import mascota from '../assets/mascota.png';

export default function ConsultarCarnet() {
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || '');
  const [pin, setPin] = useState('');
  const [carnet, setCarnet] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [informacionAbierta, setInformacionAbierta] = useState(false);

  const consultar = async (event) => {
    event?.preventDefault();
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
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        px: carnet ? { xs: 1, sm: 2 } : { xs: 1.5, sm: 3 },
        py: carnet ? { xs: 1, sm: 3 } : { xs: 2, md: 4 },
        background: carnet
          ? '#f5f7fa'
          : 'radial-gradient(circle at 90% 12%, rgba(85,194,195,0.30), transparent 30%), linear-gradient(135deg, #172334 0%, #1e4253 58%, #0c738d 100%)',
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
        elevation={carnet ? 3 : 18}
        sx={{
          width: '100%',
          maxWidth: carnet ? 1200 : 1040,
          minHeight: carnet ? 'auto' : { md: 620 },
          p: carnet ? { xs: 2, sm: 4 } : 0,
          display: carnet ? 'block' : 'grid',
          gridTemplateColumns: carnet ? undefined : { xs: '1fr', md: '44% 56%' },
          overflow: 'hidden',
          borderRadius: carnet ? 2 : { xs: 3, md: 4 },
          bgcolor: '#ffffff',
          boxShadow: carnet ? undefined : '0 28px 70px rgba(4, 17, 29, 0.38)',
          '@media print': { boxShadow: 'none', maxWidth: 'none', p: 1 },
        }}
      >
        {!carnet && (
          <>
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: { xs: 'row', md: 'column' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 2, md: 1 },
                minHeight: { xs: 190, sm: 220, md: 'auto' },
                p: { xs: 2.5, sm: 3.5, md: 5 },
                color: '#ffffff',
                background: 'linear-gradient(155deg, #0C718C 0%, #1598B1 52%, #59C7B3 100%)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.10)',
                  top: -130,
                  right: -100,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.20)',
                  bottom: -95,
                  left: -75,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <Box
                  component="img"
                  src={mascota}
                  alt="Mascota del Centro de Salud Infantil SCCVI"
                  sx={{
                    display: 'block',
                    width: { xs: 105, sm: 130, md: 255 },
                    maxHeight: { xs: 145, sm: 170, md: 340 },
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 14px 16px rgba(5, 49, 65, 0.26))',
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  textAlign: { xs: 'left', md: 'center' },
                  maxWidth: 390,
                }}
              >
                <Typography
                  component="p"
                  sx={{
                    mb: { xs: 0.5, md: 1 },
                    fontSize: { xs: '0.82rem', md: '0.9rem' },
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    opacity: 0.88,
                  }}
                >
                  CENTRO DE SALUD INFANTIL
                </Typography>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.35rem', md: '3rem' },
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    mb: { xs: 0.75, md: 1.5 },
                  }}
                >
                  SCCVI
                </Typography>
                <Typography
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { sm: '0.92rem', md: '1.05rem' },
                    lineHeight: 1.55,
                    opacity: 0.94,
                  }}
                >
                  Consulte de forma segura el carnet y expediente de salud de su hijo o hija
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, sm: 5, md: 6 },
                color: '#263041',
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2,
                    bgcolor: 'rgba(17,138,178,0.12)',
                    color: '#118AB2',
                    mb: 2,
                  }}
                >
                  <HealthAndSafetyRoundedIcon />
                </Box>
                <Typography
                  variant="h4"
                  sx={{ mb: 0.75, fontWeight: 800, color: '#263041', letterSpacing: '-0.025em' }}
                >
                  Consulta de carnet
                </Typography>
                <Typography variant="body1" sx={{ color: '#637083', mb: 3 }}>
                  Ingrese los datos entregados por el centro de salud para consultar el expediente.
                </Typography>

                <Box component="form" onSubmit={consultar}>
                  <Stack spacing={2}>
                    <TextField
                      label="Código de carnet"
                      placeholder="Ej. CS-XXXX"
                      required
                      fullWidth
                      autoFocus={!codigoParam}
                      value={codigo}
                      disabled={Boolean(codigoParam)}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeRoundedIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="PIN de seguridad"
                      type="password"
                      placeholder="4 dígitos"
                      required
                      fullWidth
                      autoFocus={Boolean(codigoParam)}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockRoundedIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="El PIN protege la información del niño o niña."
                    />
                  </Stack>

                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={cargando}
                    sx={{
                      mt: 2,
                      minHeight: 50,
                      fontWeight: 800,
                      boxShadow: '0 8px 18px rgba(17,138,178,0.24)',
                    }}
                  >
                    {cargando ? <CircularProgress size={24} color="inherit" /> : 'Consultar carnet'}
                  </Button>
                </Box>

                <Typography
                  variant="caption"
                  component="p"
                  sx={{ mt: 2.5, color: '#7B8796', textAlign: 'center' }}
                >
                  El acceso al carnet está protegido mediante código y PIN
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {carnet && (
          <Box>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
              Centro de Salud Infantil SCCVI
            </Typography>
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
