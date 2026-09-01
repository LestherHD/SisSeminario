import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  etiquetaEstadoNutricional,
  etiquetaEstadoTalla,
} from '../utils/percentiles.js';

const OPCIONES_PERIODO = [
  { valor: 'todo', etiqueta: 'Todo' },
  { valor: '3_meses', etiqueta: 'Últimos 3 meses' },
  { valor: '1_anio', etiqueta: 'Último año' },
  { valor: '3_anios', etiqueta: 'Últimos 3 años' },
];

function formatearFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-GT') : '—';
}

function limiteDelPeriodo(periodo) {
  const limite = new Date();

  if (periodo === '3_meses') limite.setMonth(limite.getMonth() - 3);
  if (periodo === '1_anio') limite.setFullYear(limite.getFullYear() - 1);
  if (periodo === '3_anios') limite.setFullYear(limite.getFullYear() - 3);

  return limite;
}

export default function Expediente({
  nino,
  padres = [],
  vacunas = [],
  crecimiento = [],
  alertasActivas = [],
}) {
  const [periodo, setPeriodo] = useState('todo');
  const vacunasEnProceso = vacunas.filter((vacuna) => vacuna.estado === 'En progreso');
  const vacunasCompletas = vacunas.filter((vacuna) => vacuna.estado === 'Completa');
  const nombresPadres = padres.length > 0 ? padres : nino?.padres || [];

  const crecimientoFiltrado = useMemo(() => {
    const ordenado = [...crecimiento].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (periodo === 'todo') return ordenado;

    const limite = limiteDelPeriodo(periodo);
    return ordenado.filter((medicion) => new Date(medicion.fecha) >= limite);
  }, [crecimiento, periodo]);

  return (
    <Stack spacing={3}>
      <Box component="section">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Datos del paciente
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={0.75}>
            <Typography><b>Nombre:</b> {nino?.nombreCompleto || '—'}</Typography>
            <Typography><b>Sexo:</b> {nino?.sexo === 'M' ? 'Masculino' : nino?.sexo === 'F' ? 'Femenino' : '—'}</Typography>
            <Typography><b>Fecha de nacimiento:</b> {formatearFecha(nino?.fechaNacimiento)}</Typography>
            <Typography><b>Comunidad:</b> {nino?.comunidad || '—'}</Typography>
            <Typography>
              <b>Padres/Tutores:</b>{' '}
              {nombresPadres.length > 0 ? nombresPadres.join(', ') : 'No registrados'}
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Divider />

      <Box component="section">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Vacunas en proceso
        </Typography>
        {vacunasEnProceso.length === 0 ? (
          <Typography color="text.secondary">Sin vacunas en proceso</Typography>
        ) : (
          <Stack spacing={1}>
            {vacunasEnProceso.map((vacuna, indice) => (
              <Paper key={`${vacuna.nombre}-${indice}`} variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{vacuna.nombre || vacuna.vacuna}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progreso: {vacuna.dosisAplicadas}/{vacuna.totalEsquema}
                    </Typography>
                  </Box>
                  <Chip
                    color="warning"
                    variant="outlined"
                    label={`Próxima: ${formatearFecha(vacuna.proximaDosis)}`}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Box component="section">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Vacunas completadas
        </Typography>
        {vacunasCompletas.length === 0 ? (
          <Typography color="text.secondary">Sin vacunas completadas</Typography>
        ) : (
          <Stack spacing={1}>
            {vacunasCompletas.map((vacuna, indice) => (
              <Paper key={`${vacuna.nombre}-${indice}`} variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{vacuna.nombre || vacuna.vacuna}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Dosis aplicadas: {(vacuna.fechas || []).map(formatearFecha).join(', ') || '—'}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      <Box component="section">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          gap={2}
          sx={{ mb: 1.5 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Historial de crecimiento
          </Typography>
          <FormControl size="small" sx={{ minWidth: 190, displayPrint: 'none' }}>
            <InputLabel id="periodo-crecimiento-label">Periodo</InputLabel>
            <Select
              labelId="periodo-crecimiento-label"
              value={periodo}
              label="Periodo"
              onChange={(event) => setPeriodo(event.target.value)}
            >
              {OPCIONES_PERIODO.map((opcion) => (
                <MenuItem key={opcion.valor} value={opcion.valor}>
                  {opcion.etiqueta}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Peso (kg)</TableCell>
                <TableCell>Talla (cm)</TableCell>
                <TableCell>IMC / nutrición OMS</TableCell>
                <TableCell>Talla para edad OMS</TableCell>
                <TableCell>Referencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {crecimientoFiltrado.length > 0 ? (
                crecimientoFiltrado.map((medicion, indice) => {
                  const nutricion = etiquetaEstadoNutricional(
                    medicion.estadoNutricional,
                    medicion.percentilImc
                  );
                  const talla = etiquetaEstadoTalla(
                    medicion.estadoTalla,
                    medicion.percentilTalla
                  );

                  return (
                    <TableRow key={medicion._id || `${medicion.fecha}-${indice}`}>
                      <TableCell>{formatearFecha(medicion.fecha)}</TableCell>
                      <TableCell>{medicion.peso ?? '—'}</TableCell>
                      <TableCell>{medicion.talla ?? '—'}</TableCell>
                      <TableCell>
                        <Stack spacing={0.5} alignItems="flex-start">
                          <Chip size="small" color={nutricion.color} label={nutricion.texto} />
                          <Typography variant="caption">IMC: {medicion.imc ?? '—'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip size="small" color={talla.color} label={talla.texto} /></TableCell>
                      <TableCell>{medicion.referenciaOms || 'Pendiente de recalcular'}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Sin mediciones para el periodo seleccionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider />

      <Box component="section">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Alertas / Estado de salud
        </Typography>
        {alertasActivas.length === 0 ? (
          <Alert severity="success">Sin alertas activas ✅</Alert>
        ) : (
          <Stack spacing={1}>
            {alertasActivas.map((alerta, indice) => (
              <Paper key={alerta._id || indice} variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                  <Chip
                    size="small"
                    color={alerta.tipo === 'critica' ? 'error' : 'warning'}
                    label={alerta.tipo === 'critica' ? 'Crítica' : 'Preventiva'}
                  />
                  <Typography sx={{ fontWeight: 600 }}>
                    {(alerta.motivo || 'Alerta').replaceAll('_', ' ')}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>{alerta.mensaje}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatearFecha(alerta.fecha)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
