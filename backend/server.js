import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import comunidadRoutes from './routes/comunidadRoutes.js';
import padreRoutes from './routes/padreRoutes.js';
import ninoRoutes from './routes/ninoRoutes.js';
import vacunaRoutes from './routes/vacunaRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/comunidades', comunidadRoutes);
app.use('/api/padres', padreRoutes);
app.use('/api/ninos', ninoRoutes);
app.use('/api/vacunas', vacunaRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API SCCVI funcionando' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ Error de conexión a MongoDB:', err.message));