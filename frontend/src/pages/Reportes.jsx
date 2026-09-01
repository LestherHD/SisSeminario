import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import GridOnIcon from '@mui/icons-material/GridOn';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import api from '../services/api.js';
import { departamentos as datosGuatemala } from '../data/guatemala.js';

function fecha(fechaValor) {
  if (!fechaValor) return '—';
  return new Date(fechaValor).toLocaleDateString('es-GT', { timeZone: 'UTC' });
}

function parametros(filtros) {
  const query = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) query.set(clave, valor);
  });
  const texto = query.toString();
  return texto ? `?${texto}` : '';
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function SinRegistros({ columnas, texto = 'Sin registros para los filtros seleccionados' }) {
  return (
    <TableRow>
      <TableCell colSpan={columnas} align="center">{texto}</TableCell>
    </TableRow>
  );
}

export default function Reportes() {
  const [datos, setDatos] = useState(null);
  const [comunidades, setComunidades] = useState([]);
  const [filtros, setFiltros] = useState({ departamento: '', municipio: '', comunidad: '' });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ departamento: '', municipio: '', comunidad: '' });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState('');
  const [error, setError] = useState('');

  const cargarReporte = async (nuevosFiltros = filtros) => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await api.get(`/reportes${parametros(nuevosFiltros)}`);
      setDatos(respuesta.data);
      setFiltrosAplicados({ ...nuevosFiltros });
    } catch (errorCarga) {
      setError(errorCarga.response?.data?.mensaje || 'No se pudo generar el reporte');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    async function cargarInicial() {
      try {
        const [respuestaReporte, respuestaComunidades] = await Promise.all([
          api.get('/reportes'),
          api.get('/comunidades'),
        ]);
        if (!activo) return;
        setDatos(respuestaReporte.data);
        setComunidades(respuestaComunidades.data.filter((item) => item.activo !== false));
      } catch (errorCarga) {
        if (activo) setError(errorCarga.response?.data?.mensaje || 'No se pudieron cargar los reportes');
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarInicial();
    return () => { activo = false; };
  }, []);

  const municipios = useMemo(
    () => datosGuatemala.find((item) => item.departamento === filtros.departamento)?.municipios || [],
    [filtros.departamento]
  );
  const comunidadesDisponibles = useMemo(
    () => comunidades.filter(
      (item) => item.departamento === filtros.departamento && item.municipio === filtros.municipio
    ),
    [comunidades, filtros.departamento, filtros.municipio]
  );

  const exportar = async (formato) => {
    setExportando(formato);
    setError('');
    try {
      const respuesta = await api.get(
        `/reportes/${formato}${parametros(filtrosAplicados)}`,
        { responseType: 'blob' }
      );
      const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
      descargarBlob(respuesta.data, `reporte-sccvi-${new Date().toISOString().slice(0, 10)}.${extension}`);
    } catch (errorExportacion) {
      setError(errorExportacion.response?.data?.mensaje || `No se pudo exportar el ${formato.toUpperCase()}`);
    } finally {
      setExportando('');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssessmentIcon color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Reportes</Typography>
          </Stack>
          <Typography color="text.secondary">
            Salud nutricional, vacunación y crecimiento por comunidad
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="flex-end"
          sx={{ ml: { md: 'auto' }, width: { xs: '100%', md: 'auto' } }}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={exportando === 'pdf' ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
            onClick={() => exportar('pdf')}
            disabled={Boolean(exportando) || cargando}
            sx={{ minWidth: { sm: 160 } }}
          >
            Exportar PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={exportando === 'excel' ? <CircularProgress size={18} color="inherit" /> : <GridOnIcon />}
            onClick={() => exportar('excel')}
            disabled={Boolean(exportando) || cargando}
            sx={{ minWidth: { sm: 160 } }}
          >
            Exportar Excel
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Filtros geográficos</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          <Autocomplete
            options={datosGuatemala.map((item) => item.departamento)}
            value={filtros.departamento || null}
            onChange={(_, valor) => setFiltros({ departamento: valor || '', municipio: '', comunidad: '' })}
            renderInput={(params) => <TextField {...params} label="Departamento" size="small" />}
          />
          <Autocomplete
            options={municipios}
            value={filtros.municipio || null}
            disabled={!filtros.departamento}
            onChange={(_, valor) => setFiltros({ ...filtros, municipio: valor || '', comunidad: '' })}
            renderInput={(params) => <TextField {...params} label="Municipio" size="small" />}
          />
          <Autocomplete
            options={comunidadesDisponibles.map((item) => item.nombre)}
            value={filtros.comunidad || null}
            disabled={!filtros.municipio}
            onChange={(_, valor) => setFiltros({ ...filtros, comunidad: valor || '' })}
            renderInput={(params) => <TextField {...params} label="Comunidad" size="small" />}
          />
          <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={() => cargarReporte()} disabled={cargando}>
            Aplicar filtros
          </Button>
        </Box>
      </Paper>

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : datos && (
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5 }}>
            {[
              ['Niños', datos.resumen.ninos],
              ['Comunidades', datos.resumen.comunidades],
              ['Riesgos nutricionales', datos.resumen.riesgosNutricionales],
              ['Vacunas incompletas', datos.resumen.vacunasIncompletas],
            ].map(([etiqueta, valor]) => (
              <Paper key={etiqueta} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{valor}</Typography>
                <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
              </Paper>
            ))}
          </Box>

          <Paper sx={{ p: 2, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Niños con bajo peso, sobrepeso u obesidad</Typography>
            <TableContainer><Table size="small" sx={{ minWidth: 950 }}>
              <TableHead><TableRow>
                <TableCell>Niño</TableCell><TableCell>Edad</TableCell><TableCell>Comunidad</TableCell>
                <TableCell>Clasificación</TableCell><TableCell>Peso</TableCell><TableCell>Talla</TableCell>
                <TableCell>IMC</TableCell><TableCell>Z peso</TableCell><TableCell>Z IMC</TableCell><TableCell>Medición</TableCell>
              </TableRow></TableHead>
              <TableBody>{datos.riesgosNutricionales.length ? datos.riesgosNutricionales.map((item, indice) => (
                <TableRow key={`${item.nino}-${indice}`}>
                  <TableCell>{item.nino}</TableCell><TableCell>{item.edad} años</TableCell>
                  <TableCell>{item.comunidad}</TableCell><TableCell><Chip size="small" color="error" label={item.clasificacion} /></TableCell>
                  <TableCell>{item.peso} kg</TableCell><TableCell>{item.talla} cm</TableCell><TableCell>{item.imc}</TableCell>
                  <TableCell>{item.zPeso ?? '—'}</TableCell><TableCell>{item.zImc ?? '—'}</TableCell><TableCell>{fecha(item.fechaMedicion)}</TableCell>
                </TableRow>
              )) : <SinRegistros columnas={10} />}</TableBody>
            </Table></TableContainer>
          </Paper>

          <Paper sx={{ p: 2, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Vacunas incompletas</Typography>
            <TableContainer><Table size="small" sx={{ minWidth: 850 }}>
              <TableHead><TableRow>
                <TableCell>Niño</TableCell><TableCell>Comunidad</TableCell><TableCell>Vacuna</TableCell>
                <TableCell>Dosis</TableCell><TableCell>Estado</TableCell><TableCell>Fecha pendiente</TableCell>
              </TableRow></TableHead>
              <TableBody>{datos.vacunasIncompletas.length ? datos.vacunasIncompletas.map((item, indice) => (
                <TableRow key={`${item.nino}-${item.vacuna}-${indice}`}>
                  <TableCell>{item.nino}</TableCell><TableCell>{item.comunidad}</TableCell><TableCell>{item.vacuna}</TableCell>
                  <TableCell>{item.dosisAplicadas}/{item.dosisRequeridas}</TableCell>
                  <TableCell><Chip size="small" color={item.estado === 'Atrasada' ? 'error' : 'warning'} label={item.estado} /></TableCell>
                  <TableCell>{fecha(item.proximaDosis)}</TableCell>
                </TableRow>
              )) : <SinRegistros columnas={6} />}</TableBody>
            </Table></TableContainer>
          </Paper>

          <Paper sx={{ p: 2, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Cobertura de vacunación por comunidad</Typography>
            <TableContainer><Table size="small" sx={{ minWidth: 850 }}>
              <TableHead><TableRow>
                <TableCell>Departamento</TableCell><TableCell>Municipio</TableCell><TableCell>Comunidad</TableCell>
                <TableCell>Niños</TableCell><TableCell>Esquemas completos</TableCell><TableCell>Dosis</TableCell><TableCell>Cobertura</TableCell>
              </TableRow></TableHead>
              <TableBody>{datos.coberturaVacunacion.length ? datos.coberturaVacunacion.map((item) => (
                <TableRow key={`${item.departamento}-${item.municipio}-${item.comunidad}`}>
                  <TableCell>{item.departamento}</TableCell><TableCell>{item.municipio}</TableCell><TableCell>{item.comunidad}</TableCell>
                  <TableCell>{item.ninos}</TableCell><TableCell>{item.esquemasCompletos}</TableCell>
                  <TableCell>{item.dosisAplicadas}/{item.dosisRequeridas}</TableCell>
                  <TableCell>{item.cobertura == null ? 'No aplica' : `${item.cobertura}%`}</TableCell>
                </TableRow>
              )) : <SinRegistros columnas={7} />}</TableBody>
            </Table></TableContainer>
          </Paper>

          <Paper sx={{ p: 2, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Crecimiento promedio por región</Typography>
            <TableContainer><Table size="small" sx={{ minWidth: 800 }}>
              <TableHead><TableRow>
                <TableCell>Departamento</TableCell><TableCell>Municipio</TableCell><TableCell>Comunidad</TableCell>
                <TableCell>Niños medidos</TableCell><TableCell>Peso promedio</TableCell><TableCell>Talla promedio</TableCell><TableCell>IMC promedio</TableCell>
              </TableRow></TableHead>
              <TableBody>{datos.crecimientoPromedio.length ? datos.crecimientoPromedio.map((item) => (
                <TableRow key={`${item.departamento}-${item.municipio}-${item.comunidad}`}>
                  <TableCell>{item.departamento}</TableCell><TableCell>{item.municipio}</TableCell><TableCell>{item.comunidad}</TableCell>
                  <TableCell>{item.ninosConMedicion}</TableCell>
                  <TableCell>{item.pesoPromedio == null ? '—' : `${item.pesoPromedio} kg`}</TableCell>
                  <TableCell>{item.tallaPromedio == null ? '—' : `${item.tallaPromedio} cm`}</TableCell>
                  <TableCell>{item.imcPromedio ?? '—'}</TableCell>
                </TableRow>
              )) : <SinRegistros columnas={7} />}</TableBody>
            </Table></TableContainer>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
