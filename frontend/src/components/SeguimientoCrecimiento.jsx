import { Alert, Typography } from '@mui/material';

const fecha = (valor) => valor ? new Date(valor).toLocaleDateString('es-GT', { timeZone: 'UTC' }) : 'Sin registros';
export default function SeguimientoCrecimiento({ control }) {
  if (!control) return null;
  return <Alert severity={control.vencido ? 'warning' : 'info'} sx={{ mb: 2 }}>
    <Typography variant="subtitle2">Control de peso y talla: cada {control.meses === 1 ? 'mes' : `${control.meses} meses`}</Typography>
    <Typography variant="body2">Último control: {fecha(control.ultimaFecha)} · {control.proximaFecha ? `Próximo control: ${fecha(control.proximaFecha)}` : 'Pendiente de primer control'}{control.proximaFecha && control.vencido ? ' · Control atrasado' : ''}</Typography>
    <Typography variant="caption">Puede registrar controles antes de esa fecha si el seguimiento lo requiere.</Typography>
  </Alert>;
}
