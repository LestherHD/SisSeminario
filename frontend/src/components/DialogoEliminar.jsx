import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

export default function DialogoEliminar({
  abierto,
  titulo,
  descripcion = 'Esta acción ocultará el registro del sistema.',
  cargando = false,
  onCancelar,
  onConfirmar,
}) {
  return (
    <Dialog open={abierto} onClose={cargando ? undefined : onCancelar} fullWidth maxWidth="xs">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {descripcion}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} color="inherit" disabled={cargando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmar}
          disabled={cargando}
          startIcon={cargando ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
