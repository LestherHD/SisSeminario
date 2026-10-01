import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';

const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SCCVI',
      version: '1.0.0',
      description: 'API del Sistema de Control de Crecimiento y Vacunación Infantil',
    },
    servers: [{ url: 'http://localhost:5000', description: 'Desarrollo' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  // Ruta absoluta: funciona iniciando Node desde la raíz o desde backend.
  apis: [fileURLToPath(new URL('../routes/*.js', import.meta.url)).replaceAll('\\', '/')],
});

export default swaggerSpec;
