import { useEffect, useMemo, useState } from 'react';
import {
  Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, MenuItem,
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
    if (valor !== '' && valor != null) query.set(clave, Array.isArray(valor) ? valor.join(',') : String(valor));
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

const ESTADOS_REPORTE = { normal: 'Normal', desnutricion: 'Desnutrición / delgadez (incluye severas)', riesgo_sobrepeso: 'Riesgo de sobrepeso', sobrepeso: 'Sobrepeso', obesidad: 'Obesidad', sin_datos: 'Sin datos' };
const SECCIONES_REPORTE = { resumenCantidades: 'Resumen de cantidades', listadoNutricional: 'Estado nutricional', vacunasIncompletas: 'Vacunas incompletas', coberturaVacunacion: 'Cobertura de vacunación', crecimientoPromedio: 'Crecimiento promedio' };
const COLUMNAS_REPORTE = { nombre: 'Nombre', edad: 'Edad', sexo: 'Sexo', comunidad: 'Comunidad', peso: 'Peso', talla: 'Talla', clasificacionNutricional: 'Clasificación nutricional', vacunacion: 'Vacunación' };
const seleccionCompleta = (campos, valor = true) => Object.fromEntries(Object.keys(campos).map((campo) => [campo, valor]));

function ConstructorReporte({ filtrosIniciales, comunidades, cerrar }) {
  const [poblacion, setPoblacion] = useState({ ...filtrosIniciales, sexo: '', edadMin: '', edadMax: '', estadoNutricional: [] });
  const [secciones, setSecciones] = useState(() => seleccionCompleta(SECCIONES_REPORTE));
  const [columnas, setColumnas] = useState(() => seleccionCompleta(COLUMNAS_REPORTE));
  const [modo, setModo] = useState('ambos');
  const [agrupacion, setAgrupacion] = useState('general');
  const [previa, setPrevia] = useState(null);
  const [exportando, setExportando] = useState('');
  const [error, setError] = useState('');
  const consulta = parametros(poblacion);
  useEffect(() => {
    const controller = new AbortController();
    const temporizador = setTimeout(() => {
      api.get(`/reportes/conteo${consulta}`, { signal: controller.signal }).then(({ data }) => {
        setPrevia({ consulta, ninos: data.ninos });
      }).catch((errorConteo) => {
        if (!controller.signal.aborted) setPrevia({ consulta, error: errorConteo.response?.data?.mensaje || 'No se pudo calcular la vista previa.' });
      });
    }, 350);
    return () => { clearTimeout(temporizador); controller.abort(); };
  }, [consulta]);
  const municipios = datosGuatemala.find((item) => item.departamento === poblacion.departamento)?.municipios || [];
  const opcionesComunidades = [...new Set(comunidades.filter((item) => item.departamento === poblacion.departamento && item.municipio === poblacion.municipio).map((item) => item.nombre))];
  const cambiar = (campo, valor) => setPoblacion((previaPoblacion) => ({ ...previaPoblacion, [campo]: valor }));
  const sinSecciones = !Object.values(secciones).some(Boolean);
  const sinColumnas = modo !== 'cantidades' && !Object.values(columnas).some(Boolean) && Object.keys(SECCIONES_REPORTE).some((campo) => campo !== 'resumenCantidades' && secciones[campo]);
  const conteoListo = previa?.consulta === consulta && !previa.error;
  const exportar = async (formato) => {
    setExportando(formato);
    setError('');
    try {
      const opciones = { ...poblacion, ...secciones, ...Object.fromEntries(Object.entries(columnas).map(([campo, valor]) => [`col_${campo}`, valor])), modo, agrupacion };
      const respuesta = await api.get(`/reportes/${formato}${parametros(opciones)}`, { responseType: 'blob' });
      descargarBlob(respuesta.data, `reporte-sccvi-${new Date().toISOString().slice(0, 10)}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (errorExportacion) {
      let mensaje = `No se pudo exportar el ${formato.toUpperCase()}`;
      try {
        const contenido = errorExportacion.response?.data;
        mensaje = (contenido instanceof Blob ? JSON.parse(await contenido.text()) : contenido)?.mensaje || mensaje;
      } catch { /* Conservar el mensaje si la respuesta no es JSON. */ }
      setError(mensaje);
    } finally { setExportando(''); }
  };
  const casillas = (etiquetas, valores, actualizar) => (
    <Stack direction="row" useFlexGap flexWrap="wrap">
      {Object.entries(etiquetas).map(([campo, etiqueta]) => <FormControlLabel key={campo} label={etiqueta}
        control={<Checkbox checked={valores[campo]} onChange={(event) => actualizar({ ...valores, [campo]: event.target.checked })} />} />)}
    </Stack>
  );
  return (
    <Dialog open onClose={exportando ? undefined : cerrar} maxWidth="md" fullWidth>
      <DialogTitle>Crear reporte personalizado</DialogTitle>
      <DialogContent dividers>
        <Box component="fieldset" disabled={Boolean(exportando)} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>1. ¿A quiénes incluir?</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField select label="Departamento" value={poblacion.departamento} onChange={(event) => setPoblacion({ ...poblacion, departamento: event.target.value, municipio: '', comunidad: '' })}>
                  <MenuItem value="">Todos</MenuItem>{datosGuatemala.map((item) => <MenuItem key={item.departamento} value={item.departamento}>{item.departamento}</MenuItem>)}
                </TextField>
                <TextField select label="Municipio" value={poblacion.municipio} disabled={!poblacion.departamento} onChange={(event) => setPoblacion({ ...poblacion, municipio: event.target.value, comunidad: '' })}>
                  <MenuItem value="">Todos</MenuItem>{municipios.map((nombre) => <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>)}
                </TextField>
                <TextField select label="Comunidad" value={poblacion.comunidad} disabled={!poblacion.municipio} onChange={(event) => cambiar('comunidad', event.target.value)}>
                  <MenuItem value="">Todas</MenuItem>{opcionesComunidades.map((nombre) => <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>)}
                </TextField>
                <TextField select label="Sexo" value={poblacion.sexo} onChange={(event) => cambiar('sexo', event.target.value)}>
                  <MenuItem value="">Todos</MenuItem><MenuItem value="M">Niños</MenuItem><MenuItem value="F">Niñas</MenuItem>
                </TextField>
                {['edadMin', 'edadMax'].map((campo) => <TextField key={campo} type="number" label={campo === 'edadMin' ? 'Edad mínima (años)' : 'Edad máxima (años)'} value={poblacion[campo]}
                  onChange={(event) => cambiar(campo, event.target.value)} slotProps={{ htmlInput: { min: 0, step: 'any' } }} helperText={campo === 'edadMax' ? 'Incluye hasta antes de cumplir un año más.' : 'Opcional'} />)}
              </Box>
              <Typography sx={{ mt: 2 }}>Estado nutricional (ninguna casilla marcada = todos)</Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap">
                {Object.entries(ESTADOS_REPORTE).map(([estado, etiqueta]) => <FormControlLabel key={estado} label={etiqueta}
                  control={<Checkbox checked={poblacion.estadoNutricional.includes(estado)} onChange={(event) => cambiar('estadoNutricional', event.target.checked ? [...poblacion.estadoNutricional, estado] : poblacion.estadoNutricional.filter((valor) => valor !== estado))} />} />)}
              </Stack>
            </Box>
            <Box>
              <Typography variant="h6">2. ¿Qué información?</Typography>
              {casillas(SECCIONES_REPORTE, secciones, setSecciones)}
              {sinSecciones && <Alert severity="warning">Selecciona al menos una sección.</Alert>}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>3. ¿Cómo presentarla?</Typography>
              <TextField select fullWidth label="Presentación" value={modo} onChange={(event) => setModo(event.target.value)}>
                <MenuItem value="cantidades">Solo cantidades</MenuItem><MenuItem value="detalle">Detalle por niño</MenuItem><MenuItem value="ambos">Ambos</MenuItem>
              </TextField>
              {modo !== 'cantidades' && <Box sx={{ mt: 2 }}>
                <Typography>Columnas del detalle</Typography>
                <Button onClick={() => setColumnas(seleccionCompleta(COLUMNAS_REPORTE))}>Seleccionar todos</Button>
                <Button onClick={() => setColumnas(seleccionCompleta(COLUMNAS_REPORTE, false))}>Limpiar</Button>
                {casillas(COLUMNAS_REPORTE, columnas, setColumnas)}
                {sinColumnas && <Alert severity="warning">Selecciona al menos una columna.</Alert>}
              </Box>}
              {(modo !== 'detalle' || secciones.resumenCantidades) && <TextField select fullWidth sx={{ mt: 2 }} label="Agrupar cantidades" value={agrupacion} onChange={(event) => setAgrupacion(event.target.value)}>
                <MenuItem value="general">Total general</MenuItem><MenuItem value="porComunidad">Por comunidad</MenuItem><MenuItem value="porSexo">Por sexo</MenuItem><MenuItem value="porEstadoNutricional">Por estado nutricional</MenuItem>
              </TextField>}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                El resumen siempre muestra cantidades. El detalle muestra una fila por niño; crecimiento incluye los que tienen medición y vacunas incompletas los que tienen pendientes. Marca Vacunación para ver cuáles faltan. La cobertura usa el catálogo aplicable por edad.
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Alert severity={previa?.consulta === consulta && previa.error ? 'error' : 'info'} sx={{ mt: 3 }} aria-live="polite">
          {previa?.consulta !== consulta ? 'Calculando vista previa…' : previa.error || `${previa.ninos} niños coinciden con los filtros. ${previa.ninos === 0 ? 'El archivo indicará que no hay registros.' : ''}`}
        </Alert>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={cerrar} disabled={Boolean(exportando)}>Cerrar</Button>
        {['pdf', 'excel'].map((formato) => <Button key={formato} variant="contained" onClick={() => exportar(formato)} disabled={Boolean(exportando) || !conteoListo || sinSecciones || sinColumnas}
          startIcon={exportando === formato ? <CircularProgress size={18} color="inherit" /> : formato === 'pdf' ? <PictureAsPdfIcon /> : <GridOnIcon />}>
          Exportar {formato.toUpperCase()}
        </Button>)}
      </DialogActions>
    </Dialog>
  );
}

export default function Reportes() {
  const [datos, setDatos] = useState(null);
  const [comunidades, setComunidades] = useState([]);
  const [filtros, setFiltros] = useState({ departamento: '', municipio: '', comunidad: '' });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ departamento: '', municipio: '', comunidad: '' });
  const [cargando, setCargando] = useState(true);
  const [constructorAbierto, setConstructorAbierto] = useState(false);
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
          <Button variant="contained" onClick={() => setConstructorAbierto(true)} disabled={cargando || !datos}>
            Crear / Exportar reporte
          </Button>
        </Stack>
      </Box>

      {constructorAbierto && <ConstructorReporte filtrosIniciales={filtrosAplicados} comunidades={comunidades} cerrar={() => setConstructorAbierto(false)} />}

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
            <Typography variant="h6" sx={{ mb: 1.5 }}>Estado nutricional de los niños</Typography>
            <TableContainer><Table size="small" sx={{ minWidth: 950 }}>
              <TableHead><TableRow>
                <TableCell>Niño</TableCell><TableCell>Edad</TableCell><TableCell>Comunidad</TableCell>
                <TableCell>Clasificación</TableCell><TableCell>Peso</TableCell><TableCell>Talla</TableCell>
                <TableCell>IMC</TableCell><TableCell>Z peso</TableCell><TableCell>Z IMC</TableCell><TableCell>Medición</TableCell>
              </TableRow></TableHead>
              <TableBody>{datos.listadoNutricional.length ? datos.listadoNutricional.map((item, indice) => (
                <TableRow key={`${item.nino}-${indice}`}>
                  <TableCell>{item.nino}</TableCell><TableCell>{item.edad} años</TableCell>
                  <TableCell>{item.comunidad}</TableCell><TableCell><Chip size="small" color={item.estadoNutricional === 'normal' ? 'success' : item.estadoNutricional === 'sin_datos' ? 'default' : 'warning'} label={item.clasificacion} /></TableCell>
                  <TableCell>{item.peso == null ? '—' : `${item.peso} kg`}</TableCell><TableCell>{item.talla == null ? '—' : `${item.talla} cm`}</TableCell><TableCell>{item.imc}</TableCell>
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
