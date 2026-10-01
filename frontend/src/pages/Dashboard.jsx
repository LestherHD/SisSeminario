import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { departamentos as catalogoDepartamentos } from '../data/guatemala.js';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const FILTROS_INICIALES = { departamento: '', municipio: '', comunidad: '', sexo: '', edadMin: '', edadMax: '', periodo: 'mes' };

const ETIQUETAS_PERIODO = {
  mes: 'Este mes',
  '3meses': 'Últimos 3 meses',
  '6meses': 'Últimos 6 meses',
  todo: 'Todo el historial',
};

function ResumenSegmentado({ elementos }) {
  const total = elementos.reduce((suma, elemento) => suma + elemento.valor, 0);

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: 'flex',
          height: 12,
          overflow: 'hidden',
          borderRadius: 999,
          bgcolor: 'action.hover',
        }}
      >
        {total > 0 && elementos.map((elemento) => (
          <Box
            key={elemento.etiqueta}
            title={elemento.etiqueta + ': ' + elemento.valor}
            sx={{
              width: ((elemento.valor / total) * 100) + '%',
              bgcolor: elemento.color,
              transition: 'width 200ms ease',
            }}
          />
        ))}
      </Box>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {elementos.map((elemento) => (
          <Chip
            key={elemento.etiqueta}
            size="small"
            label={elemento.etiqueta + ': ' + elemento.valor}
            sx={{
              borderColor: elemento.color,
              color: elemento.color,
              fontWeight: 600,
            }}
            variant="outlined"
          />
        ))}
      </Stack>
    </Stack>
  );
}

function agruparUbicaciones(ubicaciones, departamento, municipio, comunidad) {
  const filtradas = ubicaciones.filter((item) =>
    (!departamento || item.departamento === departamento) &&
    (!municipio || item.municipio === municipio) &&
    (!comunidad || item.comunidad === comunidad)
  );

  const nivel = comunidad
    ? 'comunidad'
    : municipio
      ? 'comunidad'
      : departamento
        ? 'municipio'
        : 'departamento';
  const mapa = new Map();

  filtradas.forEach((item) => {
    const nombre = item[nivel] || 'Sin ubicación';
    mapa.set(nombre, (mapa.get(nombre) || 0) + item.cantidad);
  });

  return {
    nivel,
    datos: Array.from(mapa, ([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad),
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [aplicados, setAplicados] = useState(FILTROS_INICIALES);
  const [catalogoComunidades, setCatalogoComunidades] = useState([]);
  const [errorComunidades, setErrorComunidades] = useState('');
  const solicitud = useRef(0);

  const cargarDatos = async (seleccion) => {
    const numero = ++solicitud.current;
    setCargando(true);
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(seleccion).filter(([, valor]) => valor !== ''));
      const response = await api.get('/dashboard', { params });
      if (numero !== solicitud.current) return;
      setDatos(response.data);
      setAplicados({ ...seleccion });
    } catch (error) {
      if (numero === solicitud.current) {
        setError(error.response?.data?.mensaje || 'Error al cargar el panel de control');
      }
    } finally {
      if (numero === solicitud.current) setCargando(false);
    }
  };

  useEffect(() => {
    let vigente = true;
    api.get('/dashboard', { params: { periodo: 'mes' } }).then(({ data }) => {
      if (vigente) setDatos(data);
    }).catch((error) => {
      if (vigente) setError(error.response?.data?.mensaje || 'Error al cargar el panel de control');
    }).finally(() => {
      if (vigente) setCargando(false);
    });
    api.get('/comunidades').then(({ data }) => {
      if (vigente) setCatalogoComunidades(data);
    }).catch(() => {
      if (vigente) setErrorComunidades('No se pudo cargar el catálogo de comunidades. Recarga la página para reintentar.');
    });
    return () => { vigente = false; solicitud.current += 1; };
  }, []);

  const cambiar = (campo, valor) => setFiltros((previos) => ({ ...previos, [campo]: valor }));
  const municipios = catalogoDepartamentos.find((item) => item.departamento === filtros.departamento)?.municipios || [];
  const comunidades = [...new Set(catalogoComunidades
    .filter((item) => item.departamento === filtros.departamento && item.municipio === filtros.municipio)
    .map((item) => item.nombre))].sort();
  const aplicar = (event) => {
    event.preventDefault();
    if (filtros.edadMin !== '' && filtros.edadMax !== '' && Number(filtros.edadMin) > Number(filtros.edadMax)) {
      setError('La edad mínima no puede superar la máxima.');
      return;
    }
    cargarDatos(filtros);
  };
  const limpiar = () => {
    setFiltros(FILTROS_INICIALES);
    cargarDatos(FILTROS_INICIALES);
  };
  const resumen = [
    aplicados.departamento, aplicados.municipio, aplicados.comunidad,
    aplicados.sexo === 'M' ? 'Niños' : aplicados.sexo === 'F' ? 'Niñas' : 'Todos los sexos',
    aplicados.edadMax !== '' ? `${aplicados.edadMin || 0} a menos de ${Number(aplicados.edadMax) + 1} años`
      : aplicados.edadMin !== '' ? `Desde ${aplicados.edadMin} años` : 'Todas las edades',
  ].filter(Boolean).join(' · ');
  const resumenGeografico = agruparUbicaciones(
    datos?.ninosPorUbicacion || [], aplicados.departamento, aplicados.municipio, aplicados.comunidad
  );
  const datosGeograficos = resumenGeografico.datos;

  const estadoNutricional = [
    { etiqueta: 'Desnutrición', valor: datos?.estadoNutricional?.desnutricion ?? 0, color: '#d32f2f' },
    { etiqueta: 'Normal', valor: datos?.estadoNutricional?.normal ?? 0, color: '#2e7d32' },
    { etiqueta: 'Sobrepeso', valor: datos?.estadoNutricional?.sobrepeso ?? 0, color: '#ed6c02' },
    { etiqueta: 'Obesidad', valor: datos?.estadoNutricional?.obesidad ?? 0, color: '#b71c1c' },
    { etiqueta: 'Sin datos', valor: datos?.estadoNutricional?.sinDatos ?? 0, color: '#9e9e9e' },
  ];
  const coberturaVacunacion = [
    { etiqueta: 'Al día', valor: datos?.coberturaVacunacion?.alDia ?? 0, color: '#2e7d32' },
    { etiqueta: 'Atrasados', valor: datos?.coberturaVacunacion?.atrasados ?? 0, color: '#d32f2f' },
    { etiqueta: 'Sin esquema', valor: datos?.coberturaVacunacion?.sinEsquema ?? 0, color: '#9e9e9e' },
  ];

  return (
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
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '2rem', sm: '2.125rem' } }}
          >
            Panel de Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen operativo y seguimiento infantil
          </Typography>
        </Box>
      </Box>

      <Paper component="form" onSubmit={aplicar} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filtros generales</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          <TextField select size="small" label="Departamento" value={filtros.departamento}
            onChange={(event) => setFiltros({ ...filtros, departamento: event.target.value, municipio: '', comunidad: '' })}>
            <MenuItem value="">Todas las ubicaciones</MenuItem>
            {catalogoDepartamentos.map((item) => <MenuItem key={item.departamento} value={item.departamento}>{item.departamento}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Municipio" value={filtros.municipio} disabled={!filtros.departamento}
            onChange={(event) => setFiltros({ ...filtros, municipio: event.target.value, comunidad: '' })}>
            <MenuItem value="">Todas las ubicaciones</MenuItem>
            {municipios.map((nombre) => <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Comunidad" value={filtros.comunidad} disabled={!filtros.municipio}
            onChange={(event) => cambiar('comunidad', event.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {comunidades.map((nombre) => <MenuItem key={nombre} value={nombre}>{nombre}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Sexo" value={filtros.sexo} onChange={(event) => cambiar('sexo', event.target.value)}>
            <MenuItem value="">Todos</MenuItem><MenuItem value="M">Niños</MenuItem><MenuItem value="F">Niñas</MenuItem>
          </TextField>
          {['edadMin', 'edadMax'].map((campo) => (
            <TextField key={campo} size="small" type="number" label={campo === 'edadMin' ? 'Edad mínima (años)' : 'Edad máxima (años)'}
              value={filtros[campo]} onChange={(event) => cambiar(campo, event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              helperText={campo === 'edadMax' ? 'Incluye hasta antes de cumplir un año más.' : 'Opcional'} />
          ))}
          <TextField select size="small" label="Período de actividad" value={filtros.periodo} onChange={(event) => cambiar('periodo', event.target.value)}
            helperText="Solo limita las dosis y alertas del período.">
            {Object.entries(ETIQUETAS_PERIODO).map(([valor, etiqueta]) => <MenuItem key={valor} value={valor}>{etiqueta}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Button type="submit" variant="contained" disabled={cargando}>Aplicar filtros</Button>
            <Button onClick={limpiar} disabled={cargando}>Limpiar</Button>
          </Stack>
        </Box>
        {errorComunidades && <Alert severity="warning" sx={{ mt: 2 }}>{errorComunidades}</Alert>}
        {datos && <Typography variant="body2" sx={{ mt: 2 }} aria-live="polite">
          Mostrando: {resumen} · Actividad: {ETIQUETAS_PERIODO[aplicados.periodo]}
        </Typography>}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : datos && (
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' },
              gap: 2,
            }}
          >
            <Paper sx={{ p: 2.25, display: 'flex', gap: 2, alignItems: 'center' }}>
              <ChildCareIcon sx={{ fontSize: 38, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{datos.totales.ninos}</Typography>
                <Typography variant="body2" color="text.secondary">Niños registrados</Typography>
                <Typography variant="caption">
                  {datos.porSexo.ninos} niños · {datos.porSexo.ninas} niñas
                </Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 2.25 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <VaccinesIcon sx={{ fontSize: 38, color: 'success.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {datos.totales.ninosVacunados} / {datos.totales.ninos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Niños con esquema</Typography>
                  <Typography variant="caption">Cobertura: {datos.totales.coberturaVacunacion}%</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.25, display: 'flex', gap: 2, alignItems: 'center' }}>
              <LocationCityIcon sx={{ fontSize: 38, color: 'info.main' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {datos.totales.comunidades} comunidades
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {datos.totales.padres} padres y tutores
                </Typography>
              </Box>
            </Paper>

            <Paper
              onClick={() => navigate('/alertas')}
              sx={{
                p: 2.25,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: datos.totales.alertasCriticas > 0 ? '#fdecea' : 'background.paper',
              }}
            >
              <WarningIcon sx={{ fontSize: 38, color: 'warning.main' }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {datos.totales.alertasActivas}
                </Typography>
                <Typography variant="body2" color="text.secondary">Alertas activas</Typography>
                <Typography variant="caption">{datos.totales.alertasCriticas} críticas</Typography>
              </Box>
            </Paper>
          </Box>

          <Paper sx={{ p: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              divider={<Divider orientation="vertical" flexItem />}
              spacing={3}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Actividad · {ETIQUETAS_PERIODO[aplicados.periodo]}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {datos.actividadPeriodo.dosisAplicadas}
                </Typography>
                <Typography variant="body2">Dosis aplicadas</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  Seguimiento del período
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {datos.actividadPeriodo.alertasGeneradas}
                </Typography>
                <Typography variant="body2">Alertas generadas</Typography>
              </Box>
              <Box sx={{ flex: 2 }}>
                <Typography variant="overline" color="text.secondary">
                  Dosis históricas
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {datos.totales.dosisAplicadas}
                </Typography>
                <Typography variant="body2">Aplicaciones registradas en total</Typography>
              </Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Paper sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Estado nutricional</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Último control de crecimiento de cada niño
              </Typography>
              <ResumenSegmentado elementos={estadoNutricional} />
            </Paper>

            <Paper sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>Cobertura de vacunación</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Situación actual de los esquemas registrados
              </Typography>
              <ResumenSegmentado elementos={coberturaVacunacion} />
            </Paper>
          </Box>

          <Paper sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 2,
                flexWrap: 'wrap',
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6">Niños por ubicación</Typography>
                <Typography variant="body2" color="text.secondary">
                  Vista por {resumenGeografico.nivel}, según los filtros generales aplicados.
                </Typography>
              </Box>
            </Box>

            {datosGeograficos.length === 0 ? (
              <Alert severity="info">No hay niños para los filtros seleccionados.</Alert>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, datosGeograficos.length * 42)}>
                <BarChart
                  data={datosGeograficos}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="nombre" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(valor) => [valor + ' niños', 'Total']} />
                  <Bar
                    dataKey="cantidad"
                    fill="#1976d2"
                    radius={[0, 6, 6, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>

          <Paper sx={{ p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Niños con alertas críticas</Typography>
            {datos.ninosConAlertasCriticas.length === 0 ? (
              <Alert severity="success">No hay alertas críticas en este momento.</Alert>
            ) : (
              <List disablePadding>
                {datos.ninosConAlertasCriticas.map((item, index) => (
                  <Box key={item.ninoNombre + '-' + index}>
                    <ListItem
                      disableGutters
                      sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, flexWrap: 'wrap' }}
                    >
                      <ListItemText primary={item.ninoNombre} secondary={item.mensaje} />
                      <Chip
                        label={item.fecha ? new Date(item.fecha).toLocaleDateString('es-GT') : '-'}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < datos.ninosConAlertasCriticas.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
