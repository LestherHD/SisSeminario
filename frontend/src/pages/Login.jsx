import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#263041',
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: 700, color: '#ffffff' }}
      >
        Sistema de Control de Carnet de Vacunación Infantil
      </Typography>

      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          {vista === 'login'
            ? 'Iniciar sesión'
            : vista === 'solicitar'
              ? 'Recuperar contraseña'
              : 'Crear nueva contraseña'}
        </Typography>
        {vista !== 'login' && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {vista === 'solicitar'
              ? 'Ingrese el correo asociado a su cuenta para recibir un código de confirmación.'
              : `Ingrese el código enviado a ${email} y establezca su nueva contraseña.`}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {mensaje && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {mensaje}
          </Alert>
        )}

        {vista === 'login' && (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              type="email"
              label="Correo electrónico"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              type="password"
              label="Contraseña"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                type="button"
                size="small"
                onClick={() => {
                  setVista('solicitar');
                  setError('');
                  setMensaje('');
                }}
              >
                ¿Olvidó su contraseña?
              </Button>
            </Box>
            <Button type="submit" variant="contained" fullWidth disabled={cargando}>
              {cargando ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>
        )}

        {vista === 'solicitar' && (
          <Box component="form" onSubmit={solicitarCodigo}>
            <TextField
              type="email"
              label="Correo electrónico de la cuenta"
              required
              fullWidth
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={cargando}>
              {cargando ? <CircularProgress size={24} color="inherit" /> : 'Enviar código'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button type="button" fullWidth onClick={volverAlLogin}>Volver al inicio de sesión</Button>
          </Box>
        )}

        {vista === 'restablecer' && (
          <Box component="form" onSubmit={restablecerPassword}>
            <TextField
              label="Código de confirmación"
              required
              fullWidth
              autoFocus
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              helperText="Código de 6 dígitos. Vence en 10 minutos."
              sx={{ mb: 2 }}
            />
            <TextField
              type="password"
              label="Nueva contraseña"
              required
              fullWidth
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              helperText="Mínimo 8 caracteres, con mayúscula, minúscula y número."
              sx={{ mb: 2 }}
            />
            <TextField
              type="password"
              label="Confirmar nueva contraseña"
              required
              fullWidth
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              error={confirmarPassword !== '' && nuevaPassword !== confirmarPassword}
              helperText={
                confirmarPassword !== '' && nuevaPassword !== confirmarPassword
                  ? 'Las contraseñas no coinciden'
                  : 'Repita la nueva contraseña.'
              }
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={cargando || codigo.length !== 6}>
              {cargando ? <CircularProgress size={24} color="inherit" /> : 'Cambiar contraseña'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Button type="button" fullWidth onClick={() => setVista('solicitar')}>
              Solicitar otro código
            </Button>
            <Button type="button" fullWidth onClick={volverAlLogin}>Volver al inicio de sesión</Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
