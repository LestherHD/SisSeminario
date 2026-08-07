import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function haCambiado(campo) {
  return campo.valorAnterior !== undefined && campo.valorAnterior !== campo.valor;
}

export default function DialogoConfirmacion({
  abierto,
  onCancelar,
  onConfirmar,
  modo,
  titulo,
  campos,
  cargando,
}) {
  const camposOrdenados =
    modo === 'editar'
      ? [...campos].sort((a, b) => Number(haCambiado(b)) - Number(haCambiado(a)))
      : campos;

  return (
    <Dialog open={abierto} onClose={onCancelar} fullWidth maxWidth="sm">
      <DialogTitle>
        {modo === 'crear' ? `¿Crear ${titulo}?` : `¿Confirmar cambios en ${titulo}?`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {modo === 'crear'
            ? campos.map((campo) => (
                <Typography key={campo.label} variant="body2">
                  <Box component="span" sx={{ fontWeight: 'bold' }}>
                    {campo.label}:
                  </Box>{' '}
                  {campo.valor || '-'}
                </Typography>
              ))
            : camposOrdenados.map((campo) => {
                const cambio = haCambiado(campo);

                return (
                  <Typography key={campo.label} variant="body2" color={cambio ? 'text.primary' : 'text.disabled'}>
                    <Box component="span" sx={{ fontWeight: 'bold' }}>
                      {campo.label}:
                    </Box>{' '}
                    {cambio ? (
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          component="span"
                          sx={{ color: 'text.disabled', textDecoration: 'line-through' }}
                        >
                          {campo.valorAnterior || '-'}
                        </Box>
                        <ArrowForwardIcon
                          fontSize="small"
                          sx={{ color: 'success.main', fontWeight: 'bold' }}
                        />
                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                          {campo.valor || '-'}
                        </Box>
                      </Box>
                    ) : (
                      `${campo.valor || '-'} (sin cambios)`
                    )}
                  </Typography>
                );
              })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} color="inherit">
          No
        </Button>
        <Button variant="contained" color="primary" onClick={onConfirmar} disabled={cargando}>
          Sí, confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
