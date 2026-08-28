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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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

function etiquetaPercentil(percentil) {
  if (percentil == null || Number.isNaN(Number(percentil))) {
    return { texto: '—', color: 'default' };
  }

  const valor = Number(percentil);
  if (valor < 5) return { texto: `${percentil} - Desnutrición`, color: 'error' };
  if (valor <= 85) return { texto: `${percentil} - Normal`, color: 'success' };
  if (valor <= 95) return { texto: `${percentil} - Sobrepeso`, color: 'warning' };
  return { texto: `${percentil} - Obesidad`, color: 'error' };
}

function etiquetaPercentilTalla(percentil) {
  if (percentil == null || Number.isNaN(Number(percentil))) {
    return { texto: '—', color: 'default' };
  }

  const valor = Number(percentil);
  if (valor < 5) return { texto: `${percentil} - Talla baja`, color: 'error' };
  if (valor <= 95) return { texto: `${percentil} - Normal`, color: 'success' };
  return { texto: `${percentil} - Talla alta`, color: 'info' };
}

export default function ConsultarCarnet() {
  const navigate = useNavigate();
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || '');
  const [pin, setPin] = useState('');
  const [carnet, setCarnet] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [informacionAbierta, setInformacionAbierta] = useState(false);

  const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-GT');

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
          maxWidth: carnet ? 900 : 500,
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
            <Typography variant="h6" sx={{ mb: 2 }}>
              {carnet.nino?.nombreCompleto}
            </Typography>

            <Stack spacing={0.5} sx={{ mb: 3 }}>
              <Typography variant="body2">
                <b>Sexo:</b> {carnet.nino?.sexo}
              </Typography>
              <Typography variant="body2">
                <b>Fecha de nacimiento:</b>{' '}
                {carnet.nino?.fechaNacimiento ? formatearFecha(carnet.nino.fechaNacimiento) : '-'}
              </Typography>
              <Typography variant="body2">
                <b>Comunidad:</b> {carnet.nino?.comunidad}
              </Typography>
              <Typography variant="body2">
                <b>Padres/Tutores:</b>{' '}
                {carnet.nino?.padres?.length > 0
                  ? carnet.nino.padres.join(', ')
                  : 'No registrados'}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Vacunas
            </Typography>

            {carnet.vacunas?.length > 0 ? (
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vacuna</TableCell>
                      <TableCell>Dosis N°</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carnet.vacunas.map((v, i) => (
                      <TableRow key={i}>
                        <TableCell>{v.vacuna}</TableCell>
                        <TableCell>{v.numeroDosis}</TableCell>
                        <TableCell>{formatearFecha(v.fechaAplicada)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sin vacunas registradas
              </Typography>
            )}

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">Crecimiento</Typography>
              <Tooltip title="¿Qué significan los percentiles?">
                <IconButton
                  size="small"
                  color="primary"
                  aria-label="Información sobre percentiles"
                  onClick={() => setInformacionAbierta(true)}
                  sx={{ displayPrint: 'none' }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {carnet.crecimiento?.length > 0 ? (
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Talla (cm)</TableCell>
                      <TableCell>Percentil de peso</TableCell>
                      <TableCell>Percentil de talla</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carnet.crecimiento.map((c, i) => {
                      const percentilPeso = etiquetaPercentil(c.percentilPeso);
                      const percentilTalla = etiquetaPercentilTalla(c.percentilTalla);

                      return (
                      <TableRow key={i}>
                        <TableCell>{formatearFecha(c.fecha)}</TableCell>
                        <TableCell>{c.peso}</TableCell>
                        <TableCell>{c.talla}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={percentilPeso.color}
                            label={percentilPeso.texto}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={percentilTalla.color}
                            label={percentilTalla.texto}
                          />
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sin registros
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ displayPrint: 'none' }}>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                fullWidth
                onClick={() => window.print()}
              >
                Imprimir carnet
              </Button>
              <Button variant="outlined" fullWidth onClick={consultarOtro}>
                Consultar otro carnet
              </Button>
            </Stack>
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
