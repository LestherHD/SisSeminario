export function etiquetaPercentil(percentil) {
  if (percentil == null || Number.isNaN(Number(percentil))) {
    return { texto: '—', color: 'default' };
  }

  const valor = Number(percentil);
  if (valor < 5) return { texto: `${percentil} - Desnutrición`, color: 'error' };
  if (valor <= 85) return { texto: `${percentil} - Normal`, color: 'success' };
  if (valor <= 95) return { texto: `${percentil} - Sobrepeso`, color: 'warning' };
  return { texto: `${percentil} - Obesidad`, color: 'error' };
}

export function etiquetaPercentilTalla(percentil) {
  if (percentil == null || Number.isNaN(Number(percentil))) {
    return { texto: '—', color: 'default' };
  }

  const valor = Number(percentil);
  if (valor < 5) return { texto: `${percentil} - Talla baja`, color: 'error' };
  if (valor <= 95) return { texto: `${percentil} - Normal`, color: 'success' };
  return { texto: `${percentil} - Talla alta`, color: 'info' };
}

const ESTADOS_NUTRICIONALES = {
  desnutricion_severa: { texto: 'Desnutrición severa', color: 'error' },
  desnutricion: { texto: 'Desnutrición', color: 'error' },
  delgadez_severa: { texto: 'Delgadez severa', color: 'error' },
  delgadez: { texto: 'Delgadez', color: 'error' },
  normal: { texto: 'Normal', color: 'success' },
  riesgo_sobrepeso: { texto: 'Riesgo de sobrepeso', color: 'warning' },
  sobrepeso: { texto: 'Sobrepeso', color: 'warning' },
  obesidad: { texto: 'Obesidad', color: 'error' },
  sin_datos: { texto: 'Sin datos OMS', color: 'default' },
};

const ESTADOS_TALLA = {
  talla_baja_severa: { texto: 'Talla baja severa', color: 'error' },
  talla_baja: { texto: 'Talla baja', color: 'error' },
  normal: { texto: 'Normal', color: 'success' },
  talla_alta: { texto: 'Talla alta', color: 'info' },
  sin_datos: { texto: 'Sin datos OMS', color: 'default' },
};

export function etiquetaEstadoNutricional(estado, percentilImc) {
  const etiqueta = ESTADOS_NUTRICIONALES[estado] ?? ESTADOS_NUTRICIONALES.sin_datos;
  const percentil = percentilImc == null ? '' : ` · P${percentilImc}`;
  return { ...etiqueta, texto: `${etiqueta.texto}${percentil}` };
}

export function etiquetaEstadoTalla(estado, percentilTalla) {
  const etiqueta = ESTADOS_TALLA[estado] ?? ESTADOS_TALLA.sin_datos;
  const percentil = percentilTalla == null ? '' : ` · P${percentilTalla}`;
  return { ...etiqueta, texto: `${etiqueta.texto}${percentil}` };
}
