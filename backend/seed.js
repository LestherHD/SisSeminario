import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Comunidad from './models/Comunidad.js';
import Padre from './models/Padre.js';
import Nino from './models/Nino.js';
import RegistroCrecimiento from './models/RegistroCrecimiento.js';
import Vacuna from './models/Vacuna.js';

dotenv.config();

async function run() {
  try {
    console.log('✅ Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión exitosa');

    console.log('✅ Eliminando datos previos...');
    await Comunidad.deleteMany({});
    await Padre.deleteMany({});
    await Nino.deleteMany({});
    await RegistroCrecimiento.deleteMany({});
    await Vacuna.deleteMany({});
    console.log('✅ Colecciones limpiadas');

    console.log('✅ Creando comunidad...');
    const comunidad = await Comunidad.create({
      nombre: 'San José Pinula',
      ubicacion: 'Guatemala',
      numFamilias: 120,
    });
    console.log('✅ Comunidad creada:', comunidad._id.toString());

    console.log('✅ Creando vacuna de catálogo...');
    const vacuna = await Vacuna.create({
      nombre: 'BCG',
      edadRecomendada: 0,
      dosis: 'Única',
    });
    console.log('✅ Vacuna creada:', vacuna._id.toString());

    console.log('✅ Creando padre...');
    const padre = await Padre.create({
      nombre: 'Juan Pérez',
      dpi: '1234567890101',
      telefono: '5555-5555',
      email: 'juan.perez@example.com',
      canalPreferido: 'whatsapp',
      telegramChatId: '987654321',
      comunidad: comunidad._id,
    });
    console.log('✅ Padre creado:', padre._id.toString());

    console.log('✅ Creando niño...');
    const nino = await Nino.create({
      nombre: 'Mateo Pérez',
      fechaNacimiento: new Date('2024-01-15'),
      sexo: 'M',
      comunidad: comunidad._id,
      padres: [padre._id],
      codigoQR: 'QR-MATEO-001',
      pin: '1234',
    });
    console.log('✅ Niño creado:', nino._id.toString());

    console.log('✅ Creando registro de crecimiento...');
    const registro = await RegistroCrecimiento.create({
      nino: nino._id,
      peso: 8.5,
      talla: 70,
    });
    console.log('✅ Registro de crecimiento creado:', registro._id.toString());

    console.log('✅ Verificando relaciones con populate...');
    const ninoPoblado = await Nino.findById(nino._id)
      .populate('comunidad')
      .populate('padres');

    console.log('✅ Niño poblado:');
    console.log(JSON.stringify(ninoPoblado, null, 2));

    console.log('✅ Seed completado correctamente');
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
  }
}

run();