export function calcularEdadMeses(fechaNacimiento) {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 +
    (hoy.getMonth() - nacimiento.getMonth());

  if (hoy.getDate() < nacimiento.getDate()) {
    meses -= 1;
  }

  return Math.max(0, meses);
}

export function formatearEdad(fechaNacimiento) {
  const meses = calcularEdadMeses(fechaNacimiento);

  if (meses < 24) {
    return `${meses} meses`;
  }

  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;

  return mesesRestantes === 0 ? `${anios} años` : `${anios} años ${mesesRestantes} meses`;
}
