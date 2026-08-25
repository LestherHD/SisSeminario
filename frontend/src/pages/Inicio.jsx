import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import mascota from '../assets/mascota.png';

export default function Inicio() {
  const { usuario } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
      }}
    >
      <img
        src={mascota}
        alt="Mascota SCCVI"
        style={{ width: 220, maxWidth: '60%', marginBottom: 24 }}
      />

      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
        Bienvenido al Sistema de Control de Crecimiento y Vacunación Infantil
      </Typography>

      <Typography variant="subtitle1" color="text.secondary">
        Centro de Salud Infantil - Crecer Sano
      </Typography>

      {usuario && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Sesión iniciada como {usuario.nombre}
        </Typography>
      )}
    </Box>
  );
}
