export function calcularEdadMeses(fechaNacimiento, fechaMedicion) {
  const nacimiento = new Date(fechaNacimiento);
  const medicion = new Date(fechaMedicion);

  let meses = (medicion.getFullYear() - nacimiento.getFullYear()) * 12 + (medicion.getMonth() - nacimiento.getMonth());

  if (medicion.getDate() < nacimiento.getDate()) {
    meses -= 1;
  }

  return Math.max(0, meses);
}

export function calcularProximaDosis(fechaAplicada, intervalo, unidad = 'meses') {
  const proximaFecha = new Date(fechaAplicada);
  const valor = Number(intervalo) || 0;

  if (unidad === 'dias') {
    proximaFecha.setDate(proximaFecha.getDate() + valor);
  } else if (unidad === 'semanas') {
    proximaFecha.setDate(proximaFecha.getDate() + valor * 7);
  } else {
    proximaFecha.setMonth(proximaFecha.getMonth() + valor);
  }

  return proximaFecha;
}

function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x));

  return x >= 0 ? y : -y;
}

export function zACpercentil(z) {
  const percentil = 100 * (0.5 * (1 + erf(z / Math.sqrt(2))));
  return Math.min(99, Math.max(1, Math.round(percentil)));
}

export function getReferencia(tipo, sexo, edadMeses) {
  const edad = Math.max(0, Number(edadMeses) || 0);
  const sexoNormalizado = sexo === 'F' ? 'F' : 'M';

  const referencia = {
    peso: [
      { maxEdad: 3, M: 5.0, F: 4.6 },
      { maxEdad: 6, M: 7.0, F: 6.4 },
      { maxEdad: 12, M: 8.9, F: 8.2 },
      { maxEdad: 24, M: 11.0, F: 10.4 },
      { maxEdad: 36, M: 13.5, F: 13.0 },
      { maxEdad: 48, M: 15.5, F: 15.0 },
      { maxEdad: 60, M: 17.5, F: 17.0 },
    ],
    talla: [
      { maxEdad: 3, M: 57, F: 56 },
      { maxEdad: 6, M: 65, F: 64 },
      { maxEdad: 12, M: 72, F: 70 },
      { maxEdad: 24, M: 83, F: 81 },
      { maxEdad: 36, M: 92, F: 91 },
      { maxEdad: 48, M: 100, F: 99 },
      { maxEdad: 60, M: 108, F: 107 },
    ],
  };

  const rangos = referencia[tipo] || referencia.peso;
  const rango = rangos.find((item) => edad <= item.maxEdad) || rangos[rangos.length - 1];
  const media = rango[sexoNormalizado];
  const desviacion = tipo === 'peso' ? media * 0.12 : media * 0.04;

  return { media, desviacion };
}

export function calcularPercentil(tipo, sexo, edadMeses, valor) {
  const { media, desviacion } = getReferencia(tipo, sexo, edadMeses);

  if (!desviacion) {
    return 50;
  }

  const z = (Number(valor) - media) / desviacion;
  return zACpercentil(z);
}
