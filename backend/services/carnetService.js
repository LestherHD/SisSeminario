import { randomInt } from 'node:crypto';
import Nino from '../models/Nino.js';

export async function generarCodigoCarnetUnico() {
  for (let intento = 0; intento < 100; intento += 1) {
    const codigo = `CS-${randomInt(1000, 10000)}`;
    const existe = await Nino.exists({ codigoCarnet: codigo });

    if (!existe) return codigo;
  }

  throw new Error('No se pudo generar un código de carnet único');
}

export function generarPinCarnet() {
  return String(randomInt(1000, 10000));
}

export function obtenerOrigenFrontend(req) {
  const origenConfigurado = process.env.FRONTEND_URL?.trim();

  if (origenConfigurado) {
    return origenConfigurado.replace(/\/$/, '');
  }

  const protocolo = req.get('x-forwarded-proto')?.split(',')[0].trim() || req.protocol;
  const host = req.get('x-forwarded-host')?.split(',')[0].trim() || req.get('host');

  if (!host) return 'http://localhost:5173';

  const origen = new URL(`${protocolo}://${host}`);

  if (origen.port === String(process.env.PORT || 5000)) {
    origen.port = '5173';
  }

  return origen.origin;
}

export async function crearCredencialesCarnet(req) {
  const codigoCarnet = await generarCodigoCarnetUnico();

  return {
    codigoCarnet,
    pin: generarPinCarnet(),
    codigoQR: `${obtenerOrigenFrontend(req)}/carnet/${codigoCarnet}`,
  };
}

export async function asegurarCredencialesCarnet(nino, req) {
  if (!nino.codigoCarnet) {
    nino.codigoCarnet = await generarCodigoCarnetUnico();
  }

  if (!nino.pin) {
    nino.pin = generarPinCarnet();
  }

  nino.codigoQR = `${obtenerOrigenFrontend(req)}/carnet/${nino.codigoCarnet}`;
  return nino.codigoQR;
}
