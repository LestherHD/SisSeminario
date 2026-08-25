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
} from '@mui/material';

export default function ConsultarCarnet() {
  const navigate = useNavigate();
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || '');
  const [pin, setPin] = useState('');
  const [carnet, setCarnet] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

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

  const colorPercentil = (percentil) => {
    if (percentil === undefined || percentil === null) {
      return 'default';
    }

    if (percentil < 5 || percentil > 95) {
      return 'error';
    }

    return 'success';
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
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: carnet ? 700 : 500 }}>
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
              {carnet.nino?.nombre}
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

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Crecimiento
            </Typography>

            {carnet.crecimiento?.length > 0 ? (
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Talla (cm)</TableCell>
                      <TableCell>Percentil Peso</TableCell>
                      <TableCell>Percentil Talla</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carnet.crecimiento.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{formatearFecha(c.fecha)}</TableCell>
                        <TableCell>{c.peso}</TableCell>
                        <TableCell>{c.talla}</TableCell>
                        <TableCell>
                          <Chip size="small" color={colorPercentil(c.percentilPeso)} label={c.percentilPeso ?? '-'} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color={colorPercentil(c.percentilTalla)} label={c.percentilTalla ?? '-'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sin registros
              </Typography>
            )}

            <Button variant="outlined" fullWidth onClick={consultarOtro}>
              Consultar otro carnet
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
