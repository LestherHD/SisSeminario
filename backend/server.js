import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import comunidadRoutes from './routes/comunidadRoutes.js';
import padreRoutes from './routes/padreRoutes.js';
import ninoRoutes from './routes/ninoRoutes.js';
import vacunaRoutes from './routes/vacunaRoutes.js';
import crecimientoRoutes from './routes/crecimientoRoutes.js';
import vacunacionRoutes from './routes/vacunacionRoutes.js';
import alertaRoutes from './routes/alertaRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificacionRoutes from './routes/notificacionRoutes.js';
import carnetRoutes from './routes/carnetRoutes.js';
import campanaRoutes from './routes/campanaRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import { iniciarPolling } from './services/telegramBot.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const app = express();
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/comunidades', comunidadRoutes);
app.use('/api/padres', padreRoutes);
app.use('/api/ninos', ninoRoutes);
app.use('/api/vacunas', vacunaRoutes);
app.use('/api/crecimiento', crecimientoRoutes);
app.use('/api/vacunacion', vacunacionRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/carnet', carnetRoutes);
app.use('/api/campanas', campanaRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API SCCVI funcionando' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));

    if (process.env.TELEGRAM_BOT_TOKEN) {
      iniciarPolling();
    }
  })
  .catch((err) => console.error('❌ Error de conexión a MongoDB:', err.message));
