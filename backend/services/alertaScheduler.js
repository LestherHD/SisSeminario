import { analizarTodos } from '../utils/motorAlertas.js';

const INTERVALO_DIARIO_MS = 24 * 60 * 60 * 1000;
let ejecutando = false;

async function ejecutarAnalisisAutomatico() {
  if (ejecutando) return;
  ejecutando = true;

  try {
    const total = await analizarTodos();
    console.log(`Análisis automático de alertas finalizado: ${total} alertas nuevas.`);
  } catch (error) {
    console.error('Error en el análisis automático de alertas:', error.message);
  } finally {
    ejecutando = false;
  }
}

export function iniciarProgramadorAlertas() {
  if (process.env.ALERTAS_AUTOMATICAS === 'false') {
    console.log('Análisis automático de alertas desactivado por configuración.');
    return;
  }

  const inicio = setTimeout(ejecutarAnalisisAutomatico, 5000);
  const intervalo = setInterval(ejecutarAnalisisAutomatico, INTERVALO_DIARIO_MS);
  inicio.unref();
  intervalo.unref();
}
