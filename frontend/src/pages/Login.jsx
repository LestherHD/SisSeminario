import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import mascota from '../assets/mascota.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState('login');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [verificandoInicial, setVerificandoInicial] = useState(true);
  const [nombreInicial, setNombreInicial] = useState('');
  const [emailInicial, setEmailInicial] = useState('');
  const [passwordInicial, setPasswordInicial] = useState('');
  const [confirmarInicial, setConfirmarInicial] = useState('');
  const [codigoInicial, setCodigoInicial] = useState('');
  const [correoInicial, setCorreoInicial] = useState('');

  useEffect(() => {
    let activo = true;

    async function verificarConfiguracion() {
      try {
        const response = await api.get('/auth/estado-inicial');
        if (!activo) return;
        if (response.data.requiereConfiguracion) {
          setVista('configuracion');
        } else if (response.data.requiereVerificacion) {
          setCorreoInicial(response.data.correo || 'el correo registrado');
          setVista('verificarInicial');
        }
      } catch {
        if (activo) setError('No se pudo verificar el estado inicial del sistema');
      } finally {
        if (activo) setVerificandoInicial(false);
      }
    }

    verificarConfiguracion();
    return () => {
      activo = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(email, password);
      navigate('/inicio');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  const solicitarCodigo = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);

    try {
      const response = await api.post('/auth/solicitar-recuperacion', { email });
      setMensaje(response.data.mensaje);
      setVista('restablecer');
    } catch (error) {
      setError(error.response?.data?.mensaje || 'No se pudo procesar la solicitud');
    } finally {
      setCargando(false);
    }
  };

  const restablecerPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);

    try {
      const response = await api.post('/auth/restablecer-password', {
        email,
        codigo,
        nuevaPassword,
        confirmarPassword,
      });
      setPassword('');
      setCodigo('');
      setNuevaPassword('');
      setConfirmarPassword('');
      setVista('login');
      setMensaje(response.data.mensaje);
    } catch (error) {
      setError(error.response?.data?.mensaje || 'No se pudo cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  const volverAlLogin = () => {
    setVista('login');
    setError('');
    setMensaje('');
    setCodigo('');
    setNuevaPassword('');
    setConfirmarPassword('');
  };

  const crearAdministradorInicial = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (passwordInicial !== confirmarInicial) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      const response = await api.post('/auth/configuracion-inicial', {
        nombre: nombreInicial,
        email: emailInicial,
        password: passwordInicial,
        confirmarPassword: confirmarInicial,
      });
      setCorreoInicial(response.data.correo || emailInicial);
      setCodigoInicial('');
      setPasswordInicial('');
      setConfirmarInicial('');
      setVista('verificarInicial');
      setMensaje(response.data.mensaje);
    } catch (errorCreacion) {
      const mensajeError =
        errorCreacion.response?.data?.mensaje || 'No se pudo crear el administrador inicial';
      setError(mensajeError);

      if (errorCreacion.response?.status === 403 || errorCreacion.response?.status === 409) {
        setVista('login');
      }
    } finally {
      setCargando(false);
    }
  };

  const verificarAdministradorInicial = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const response = await api.post('/auth/verificar-configuracion-inicial', {
        codigo: codigoInicial,
      });
      setEmail(response.data.email || emailInicial);
      setPassword('');
      setCodigoInicial('');
      setVista('login');
      setMensaje(response.data.mensaje);
    } catch (errorVerificacion) {
      setError(errorVerificacion.response?.data?.mensaje || 'No se pudo verificar la cuenta');
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigoInicial = async () => {
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const response = await api.post('/auth/reenviar-configuracion-inicial');
      setCorreoInicial(response.data.correo || correoInicial);
      setCodigoInicial('');
      setMensaje(response.data.mensaje);
    } catch (errorReenvio) {
      setError(errorReenvio.response?.data?.mensaje || 'No se pudo reenviar el código');
    } finally {
      setCargando(false);
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
        px: { xs: 1.5, sm: 3 },
        py: { xs: 2, md: 4 },
        background:
          'radial-gradient(circle at 10% 10%, rgba(17,138,178,0.28), transparent 32%), linear-gradient(135deg, #172334 0%, #263041 55%, #123849 100%)',
      }}
    >
      <Paper
        elevation={18}
        sx={{
          width: '100%',
          maxWidth: 1040,
          minHeight: { md: 620 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '44% 56%' },
          overflow: 'hidden',
          borderRadius: { xs: 3, md: 4 },
          bgcolor: '#ffffff',
          boxShadow: '0 28px 70px rgba(4, 17, 29, 0.38)',
        }}
      >
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
            background: 'linear-gradient(155deg, #08799c 0%, #118AB2 52%, #55c2c3 100%)',
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
              Sistema de Control de Crecimiento y Vacunación Infantil
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
              {vista === 'login' ? <ShieldRoundedIcon /> : <LockRoundedIcon />}
            </Box>
            <Typography
              variant="h4"
              sx={{ mb: 0.75, fontWeight: 800, color: '#263041', letterSpacing: '-0.025em' }}
            >
              {vista === 'login'
                ? 'Bienvenido/a'
                : vista === 'solicitar'
                  ? 'Recuperar contraseña'
                  : vista === 'restablecer'
                    ? 'Crear nueva contraseña'
                    : vista === 'verificarInicial'
                      ? 'Verificar administrador'
                      : 'Configuración inicial'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#637083', mb: 3 }}>
              {vista === 'login'
                ? 'Ingrese sus credenciales para acceder al sistema.'
                : vista === 'solicitar'
                  ? 'Ingrese el correo asociado a su cuenta y le enviaremos un código.'
                  : vista === 'restablecer'
                    ? `Ingrese el código enviado a ${email} y establezca su nueva contraseña.`
                    : vista === 'verificarInicial'
                      ? `Ingrese el código enviado a ${correoInicial}.`
                      : 'No existen usuarios. Cree la cuenta del primer administrador para comenzar.'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {mensaje && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>
                {mensaje}
              </Alert>
            )}

            {verificandoInicial && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!verificandoInicial && vista === 'login' && (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    type="email"
                    label="Correo electrónico"
                    required
                    fullWidth
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    type={mostrarPassword ? 'text' : 'password'}
                    label="Contraseña"
                    required
                    fullWidth
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRoundedIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() => setMostrarPassword((visible) => !visible)}
                          >
                            {mostrarPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.75, mb: 2 }}>
                  <Button
                    type="button"
                    size="small"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                    onClick={() => {
                      setVista('solicitar');
                      setError('');
                      setMensaje('');
                    }}
                  >
                    ¿Olvidó su contraseña?
                  </Button>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={cargando}
                  sx={{ minHeight: 50, fontWeight: 800, boxShadow: '0 8px 18px rgba(17,138,178,0.24)' }}
                >
                  {cargando ? <CircularProgress size={24} color="inherit" /> : 'Ingresar al sistema'}
                </Button>
              </Box>
            )}

            {!verificandoInicial && vista === 'solicitar' && (
              <Box component="form" onSubmit={solicitarCodigo}>
                <TextField
                  type="email"
                  label="Correo electrónico de la cuenta"
                  required
                  fullWidth
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={cargando}
                  sx={{ minHeight: 50, fontWeight: 800 }}
                >
                  {cargando ? <CircularProgress size={24} color="inherit" /> : 'Enviar código'}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  startIcon={<ArrowBackRoundedIcon />}
                  onClick={volverAlLogin}
                  sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Volver al inicio de sesión
                </Button>
              </Box>
            )}

            {!verificandoInicial && vista === 'restablecer' && (
              <Box component="form" onSubmit={restablecerPassword}>
                <Stack spacing={2}>
                  <TextField
                    label="Código de confirmación"
                    required
                    fullWidth
                    autoFocus
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                    helperText="Código de 6 dígitos. Vence en 10 minutos."
                  />
                  <TextField
                    type={mostrarPassword ? 'text' : 'password'}
                    label="Nueva contraseña"
                    required
                    fullWidth
                    autoComplete="new-password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número."
                  />
                  <TextField
                    type={mostrarPassword ? 'text' : 'password'}
                    label="Confirmar nueva contraseña"
                    required
                    fullWidth
                    autoComplete="new-password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    error={confirmarPassword !== '' && nuevaPassword !== confirmarPassword}
                    helperText={
                      confirmarPassword !== '' && nuevaPassword !== confirmarPassword
                        ? 'Las contraseñas no coinciden'
                        : 'Repita la nueva contraseña.'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label={mostrarPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                            onClick={() => setMostrarPassword((visible) => !visible)}
                          >
                            {mostrarPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={cargando || codigo.length !== 6}
                  sx={{ mt: 2, minHeight: 50, fontWeight: 800 }}
                >
                  {cargando ? <CircularProgress size={24} color="inherit" /> : 'Cambiar contraseña'}
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                  <Button type="button" fullWidth onClick={() => setVista('solicitar')} sx={{ textTransform: 'none' }}>
                    Solicitar otro código
                  </Button>
                  <Button type="button" fullWidth onClick={volverAlLogin} sx={{ textTransform: 'none' }}>
                    Volver al ingreso
                  </Button>
                </Stack>
              </Box>
            )}

            {!verificandoInicial && vista === 'configuracion' && (
              <Box component="form" onSubmit={crearAdministradorInicial}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Esta opción desaparecerá permanentemente después de crear el primer usuario.
                </Alert>
                <Stack spacing={2}>
                  <TextField
                    label="Nombre del administrador"
                    required
                    autoFocus
                    fullWidth
                    value={nombreInicial}
                    onChange={(e) => setNombreInicial(e.target.value)}
                  />
                  <TextField
                    type="email"
                    label="Correo electrónico"
                    required
                    fullWidth
                    autoComplete="email"
                    value={emailInicial}
                    onChange={(e) => setEmailInicial(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    type={mostrarPassword ? 'text' : 'password'}
                    label="Contraseña"
                    required
                    fullWidth
                    autoComplete="new-password"
                    value={passwordInicial}
                    onChange={(e) => setPasswordInicial(e.target.value)}
                    helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número."
                  />
                  <TextField
                    type={mostrarPassword ? 'text' : 'password'}
                    label="Confirmar contraseña"
                    required
                    fullWidth
                    autoComplete="new-password"
                    value={confirmarInicial}
                    onChange={(e) => setConfirmarInicial(e.target.value)}
                    error={confirmarInicial !== '' && confirmarInicial !== passwordInicial}
                    helperText={
                      confirmarInicial !== '' && confirmarInicial !== passwordInicial
                        ? 'Las contraseñas no coinciden'
                        : 'Repita la contraseña.'
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            aria-label={mostrarPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                            onClick={() => setMostrarPassword((visible) => !visible)}
                          >
                            {mostrarPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={cargando}
                  sx={{ mt: 2, minHeight: 50, fontWeight: 800 }}
                >
                  {cargando ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Crear administrador e iniciar'
                  )}
                </Button>
              </Box>
            )}

            {!verificandoInicial && vista === 'verificarInicial' && (
              <Box component="form" onSubmit={verificarAdministradorInicial}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  La cuenta permanecerá inactiva hasta confirmar que el correo le pertenece.
                </Alert>
                <TextField
                  label="Código de verificación"
                  required
                  autoFocus
                  fullWidth
                  value={codigoInicial}
                  onChange={(e) => setCodigoInicial(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                  helperText="Código de 6 dígitos. Vence en 10 minutos."
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={cargando || codigoInicial.length !== 6}
                  sx={{ mt: 2, minHeight: 50, fontWeight: 800 }}
                >
                  {cargando ? <CircularProgress size={24} color="inherit" /> : 'Verificar correo'}
                </Button>
                <Button
                  type="button"
                  fullWidth
                  disabled={cargando}
                  onClick={reenviarCodigoInicial}
                  sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
                >
                  Enviar un código nuevo
                </Button>
              </Box>
            )}

            <Typography
              variant="caption"
              component="p"
              sx={{ mt: 3, color: '#7B8796', textAlign: 'center' }}
            >
              Acceso exclusivo para personal autorizado del centro de salud
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
