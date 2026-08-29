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
