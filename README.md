# SCCVI

Sistema de Control de Crecimiento y Vacunación Infantil desarrollado como proyecto MERN para apoyar al personal de salud en el seguimiento de niños de múltiples comunidades.

SCCVI permite registrar pacientes, padres o tutores, controles de crecimiento y vacunas; detectar posibles anomalías; enviar alertas y campañas comunitarias; y consultar un carnet de salud protegido mediante código QR y PIN.

## Funcionalidades

- Gestión de comunidades de Guatemala por departamento, municipio y comunidad o aldea.
- CRUD de padres o tutores con métodos de contacto por Email y Telegram.
- CRUD de niños, asociación con padres y comunidad, activación y borrado lógico.
- Registro y edición de mediciones de peso y talla.
- Historial y gráficas de evolución del crecimiento.
- Registro de vacunas con dosis, volumen e intervalos en días, semanas o meses.
- Control del esquema de vacunación y cálculo de próximas dosis.
- Detección de alertas de crecimiento, falta de controles y vacunas atrasadas.
- Envío de alertas mediante Email y Telegram.
- Campañas dirigidas por departamento, municipio o comunidad específica.
- Carnet QR protegido con código y PIN.
- Expediente público para padres y tutores en `/consultar`.
- Expediente interno para el personal autorizado.
- Dashboard analítico con indicadores de población, nutrición, vacunación y territorio.
- Recuperación de contraseña mediante código temporal enviado por correo.
- Interfaz responsive para computadora, tableta y teléfono.

> **Nota clínica:** los percentiles actuales son estimaciones orientativas. No deben presentarse como percentiles oficiales de la OMS ni sustituir la evaluación de personal de salud.

## Tecnologías

### Backend

- Node.js 24
- Express 5
- MongoDB y Mongoose 9
- JSON Web Tokens
- bcrypt
- Brevo Transactional Email API
- Telegram Bot API
- express-rate-limit
- QRCode

### Frontend

- React 19
- Vite 8
- Material UI 9
- React Router
- Axios
- Recharts

## Estructura principal

```text
sccvi/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── data/
│       ├── pages/
│       ├── services/
│       └── utils/
└── README.md
```

## Requisitos

- Node.js 24 o una versión compatible.
- npm.
- MongoDB local o MongoDB Atlas.
- Bot de Telegram, si se utilizarán notificaciones por ese canal.
- Cuenta y remitente verificado en Brevo, si se utilizará correo.

## Instalación

Clone el repositorio y abra una terminal en su carpeta raíz.

### Backend

```bash
cd backend
npm install
```

Cree `backend/.env` con las variables necesarias:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sccvi
JWT_SECRET=reemplace_por_un_secreto_largo_y_aleatorio

TELEGRAM_BOT_TOKEN=token_del_bot

BREVO_API_KEY=clave_de_brevo
BREVO_REMITENTE=correo_remitente_verificado

# Active únicamente cuando el backend esté detrás de un proxy confiable.
TRUST_PROXY=false
```

No suba el archivo `.env` ni publique las claves de Brevo, Telegram, JWT o MongoDB.

Inicie el backend:

```bash
npm run dev
```

La API se ejecutará de forma predeterminada en `http://localhost:5000`.

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible normalmente en `http://localhost:5173`.

## Accesos

- `/login`: acceso exclusivo para administradores y personal del centro de salud.
- `/consultar`: consulta pública del carnet mediante código y PIN.
- `/carnet/:codigo`: enlace utilizado por el código QR; solicita únicamente el PIN.

En una instalación nueva, si la base de datos no contiene ningún usuario, `/login` muestra automáticamente el formulario para crear el primer administrador. La cuenta queda inactiva hasta validar un código de seis dígitos enviado por Brevo al correo indicado. Después de verificarla, la configuración inicial desaparece y no puede volver a utilizarse. Los usuarios posteriores se administran desde la sección **Usuarios**, visible únicamente para administradores.

## Roles

- `admin`: administración de usuarios y acceso completo.
- `encargado`: gestión operativa de registros, alertas y campañas.
- `personal`: consulta, crea y edita comunidades, padres y niños, pero no puede desactivarlos ni reactivarlos. También realiza operaciones clínicas de crecimiento, vacunación y alertas, y consulta campañas. No accede al Dashboard, al mantenimiento del catálogo de vacunas ni a la gestión de usuarios.

Los permisos concretos son validados nuevamente en las rutas del backend.

## API

La API utiliza el prefijo `/api`.

| Recurso | Ruta base |
| --- | --- |
| Autenticación | `/api/auth` |
| Comunidades | `/api/comunidades` |
| Padres o tutores | `/api/padres` |
| Niños | `/api/ninos` |
| Catálogo de vacunas | `/api/vacunas` |
| Crecimiento | `/api/crecimiento` |
| Vacunación | `/api/vacunacion` |
| Alertas | `/api/alertas` |
| Notificaciones | `/api/notificaciones` |
| Dashboard | `/api/dashboard` |
| Carnet y expediente | `/api/carnet` |
| Campañas | `/api/campanas` |
| Usuarios | `/api/usuarios` |

Las rutas privadas requieren el encabezado:

```http
Authorization: Bearer TOKEN_JWT
```

## Notificaciones

### Email

El sistema utiliza la API transaccional de Brevo para:

- Bienvenida de padres y tutores.
- Alertas de salud y recordatorios de vacunas.
- Códigos de recuperación de contraseña.
- Campañas comunitarias.

### Telegram

El bot permite enviar:

- Alertas de salud.
- Recordatorios relacionados con vacunas.
- Carnet y QR.
- Campañas comunitarias.

Cada envío respeta los métodos de contacto elegidos por el padre o tutor.

Las campañas filtran primero las comunidades correspondientes al departamento, municipio o aldea elegida. Por ello, una campaña para Sanarate no incluye destinatarios de otro municipio o departamento.

## Seguridad

- Contraseñas almacenadas mediante hash bcrypt.
- Autenticación con JWT y rutas protegidas.
- Autorización basada en roles.
- Registro de nuevos usuarios restringido a administradores autenticados.
- Configuración del primer administrador disponible únicamente cuando no existe ningún usuario.
- Verificación obligatoria del correo del primer administrador antes de activar su cuenta.
- Prevención de comunidades duplicadas por departamento, municipio y nombre.
- Desactivación inmediata de sesiones pertenecientes a usuarios inactivos.
- Recuperación mediante código de seis dígitos, con vencimiento e intentos máximos.
- Consulta pública del carnet protegida por código y PIN.
- Rate limiting para login, recuperación y consulta del carnet.
- Respuestas de recuperación que no revelan si un correo está registrado.
- Variables sensibles separadas mediante `.env`.

Límites actuales por dirección IP y ventana de 15 minutos:

- Login: 10 intentos fallidos.
- Solicitud de recuperación: 3 solicitudes.
- Restablecimiento: 5 intentos.
- Consulta del carnet: 10 intentos fallidos.

El almacenamiento de límites es local a cada proceso. Un despliegue con múltiples instancias debe utilizar un almacén compartido, por ejemplo Redis.

## Verificación

Compilar el frontend:

```bash
cd frontend
npm run build
```

Ejecutar el analizador estático:

```bash
cd frontend
npm run lint
```

El backend utiliza módulos ES. Para comprobar un archivo individual:

```bash
node --check server.js
```

## Consideraciones para producción

Antes de publicar el sistema se debe:

- Configurar HTTPS y un dominio.
- Restringir CORS al dominio real del frontend.
- Cambiar las direcciones locales utilizadas por la API y los códigos QR.
- Activar `TRUST_PROXY=true` solamente detrás de un proxy confiable.
- Proteger las variables de entorno en el servicio de alojamiento.
- Configurar respaldos automáticos de MongoDB.
- Incorporar monitoreo, registro de errores y disponibilidad 24/7.
- Utilizar un almacén compartido para rate limiting si existen varias instancias.
- Realizar pruebas clínicas y de aceptación con el personal responsable.

## Alcance alcanzado

El proyecto cubre el MVP definido:

- CRUD de niños, padres y comunidades.
- Registro de peso y talla.
- Gráfica de crecimiento.
- Alertas básicas por correo.
- Registro y control de vacunas.

También incluye más de dos características avanzadas:

- Carnet QR protegido.
- Integración con Telegram.
- Dashboard analítico.

Los percentiles oficiales OMS y una infraestructura cloud de alta disponibilidad pueden incorporarse como mejoras posteriores.
