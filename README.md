# SCCVI

Sistema de Control de Crecimiento y Vacunación Infantil desarrollado como proyecto MERN para apoyar al personal de salud en el seguimiento de niños de múltiples comunidades.

SCCVI permite registrar pacientes, padres o tutores, controles de crecimiento y vacunas; detectar posibles anomalías; enviar alertas y campañas comunitarias; y consultar un carnet de salud protegido mediante código QR y PIN.

## Funcionalidades

- Gestión de comunidades de Guatemala por departamento, municipio y comunidad o aldea.
- CRUD de padres o tutores con métodos de contacto por Email y Telegram.
- CRUD de niños, asociación con padres y comunidad, activación y borrado lógico.
- Registro y edición de mediciones de peso y talla.
- Cálculo de edad exacta en meses, puntajes Z y percentiles mediante referencias oficiales OMS 2006 y OMS 2007, según edad y sexo.
- Historial y curvas de peso, talla e IMC contra percentiles pediátricos de referencia.
- Registro de vacunas con dosis, volumen e intervalos en días, semanas o meses.
- Control del esquema de vacunación y cálculo de próximas dosis.
- Detección de riesgos nutricionales, falta de controles, vacunas próximas y vacunas atrasadas.
- Alertas preventivas y críticas, con análisis manual y ejecución automática diaria.
- Envío de alertas mediante Email y Telegram.
- Campañas dirigidas por departamento, municipio o comunidad, segmentadas por edad y estado de vacunación.
- Carnet QR protegido con código y PIN.
- Generación automática de código, PIN y QR al registrar al niño.
- Vinculación única del padre con Telegram mediante DPI, revocable únicamente por administración.
- Expediente público para padres y tutores en `/consultar`.
- Expediente interno para el personal autorizado.
- Dashboard analítico con indicadores de población, nutrición, vacunación y territorio.
- Reportes de nutrición, vacunas incompletas, cobertura por comunidad y crecimiento promedio.
- Exportación de reportes en PDF y Excel.
- Recuperación de contraseña mediante código temporal enviado por correo.
- Interfaz responsive para computadora, tableta y teléfono.

> **Nota clínica:** el sistema utiliza tablas LMS oficiales de la OMS para calcular puntajes Z y percentiles. Sus resultados apoyan el seguimiento, pero no sustituyen el diagnóstico ni la evaluación de personal médico calificado.

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
- PDFKit
- ExcelJS

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
│   ├── data/oms/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
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

Siga estos pasos en orden. Necesitará **dos terminales abiertas al mismo tiempo**: una para el backend y otra para el frontend. No cierre ninguna mientras esté usando la aplicación.

### 1. Compruebe los requisitos previos

Necesita tener instalado:

- Node.js 24 o una versión compatible.
- npm, que normalmente se instala junto con Node.js.
- MongoDB local o una cuenta de MongoDB Atlas.
- Git, si va a clonar el repositorio desde una URL.

Compruebe Node.js y npm con estos comandos:

```bash
node --version
npm --version
```

> **Nota para Windows:** puede ejecutar estos comandos desde PowerShell. Si alguno no funciona, instale Node.js y vuelva a abrir la terminal.

Si usa MongoDB local, inicie el servicio de MongoDB **antes de iniciar el backend**. Si usa MongoDB Atlas, solo necesitará su cadena de conexión.

### 2. Clone el repositorio

Reemplace `<URL_DEL_REPOSITORIO>` por la URL real del repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd sccvi
```

Si ya descargó el proyecto, abra una terminal directamente en la carpeta raíz `sccvi`.

### 3. Instale el backend en la Terminal 1

Abra la **Terminal 1** y, desde la carpeta raíz del proyecto, ejecute:

```bash
cd backend
npm install
```

> **Nota:** estos comandos deben ejecutarse dentro de la carpeta `backend`. Si la terminal ya está dentro de `backend`, no vuelva a ejecutar `cd backend`.

### 4. Configure el archivo `.env`

Dentro de la carpeta `backend`, cree un archivo llamado `.env`. Para arrancar y utilizar correctamente el backend, las dos variables obligatorias son `MONGO_URI` y `JWT_SECRET`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/sccvi
JWT_SECRET=pegue_aqui_un_texto_largo_y_aleatorio
```

`MONGO_URI` es la cadena de conexión de MongoDB. Con MongoDB local puede usar el ejemplo anterior. Con MongoDB Atlas debe pegar la cadena que le proporciona Atlas.

No necesita crear la base de datos ni las colecciones manualmente. Mongoose las crea automáticamente conforme se utilizan las vistas y se guardan datos.

`JWT_SECRET` no se obtiene de ningún servicio. Lo genera usted: es un texto largo y aleatorio que firma los tokens de sesión. Es obligatorio porque, sin él, el login y la creación del primer administrador no funcionan.

Puede generar un valor seguro con este comando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie el resultado del comando y péguelo después de `JWT_SECRET=` en `backend/.env`.

Las demás variables son opcionales y solo se necesitan para sus funciones correspondientes:

```env
PORT=5000
TELEGRAM_BOT_TOKEN=token_del_bot
BREVO_API_KEY=clave_de_brevo
BREVO_REMITENTE=correo_remitente_verificado
FRONTEND_URL=http://localhost:5173
ALERTAS_AUTOMATICAS=true
TRUST_PROXY=false
```

Por ejemplo, Telegram y Brevo solo son necesarios si desea enviar notificaciones por esos canales. No suba el archivo `.env` ni publique sus claves.

### 5. Inicie el backend en la Terminal 1

Sin cerrar la **Terminal 1**, ejecute este comando dentro de la carpeta `backend`:

```bash
npm run dev
```

La API estará disponible normalmente en `http://localhost:5000`.

> **Importante:** no cierre esta terminal. Debe permanecer abierta y ejecutando el backend mientras usa la aplicación.

### 6. Instale el frontend en la Terminal 2

Abra una **Terminal 2** nueva. No detenga ni cierre la Terminal 1. Desde la carpeta raíz del proyecto, ejecute:

```bash
cd frontend
npm install
```

> **Nota:** este `npm install` se ejecuta dentro de `frontend`, no dentro de `backend`.

### 7. Inicie el frontend en la Terminal 2

En la **Terminal 2**, todavía dentro de la carpeta `frontend`, ejecute:

```bash
npm run dev
```

Ahora deben quedar las dos terminales corriendo al mismo tiempo:

- **Terminal 1:** `backend` ejecutando `npm run dev`.
- **Terminal 2:** `frontend` ejecutando `npm run dev`.

Cerrar cualquiera de las dos terminales detendrá una parte de la aplicación.

### 8. Verifique la instalación

Abra en el navegador la dirección que muestra Vite, normalmente:

```text
http://localhost:5173
```

Checklist rápido:

- ✅ MongoDB está activo o la cadena de Atlas es correcta.
- ✅ La Terminal 1 muestra que el backend está conectado a MongoDB.
- ✅ La Terminal 2 muestra la URL local del frontend.
- ✅ La aplicación aparece en el navegador.
- ✅ Puede acceder a `/login`.

**Si ve la aplicación en el navegador, ya quedó.**

Si el backend no conecta, revisa que MongoDB esté activo y que la `MONGO_URI` sea correcta.

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
| Reportes y exportaciones | `/api/reportes` |
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

La vinculación comienza con `/start` y la confirmación del DPI. Un DPI solamente puede vincularse con un chat de Telegram y un chat solamente puede pertenecer a un padre o tutor. Si se necesita cambiar la cuenta, un administrador debe revocar primero la vinculación desde el módulo de padres.

Las campañas filtran primero las comunidades correspondientes al departamento, municipio o aldea elegida. Por ello, una campaña para Sanarate no incluye destinatarios de otro municipio o departamento.

## Crecimiento y alertas médicas

- Menores de 5 años: referencias OMS 2006.
- Desde los 5 años: referencias OMS 2007 disponibles para los indicadores implementados.
- Evaluación por edad exacta en meses y sexo.
- Curvas de peso para la edad, talla para la edad e IMC para la edad.
- Líneas de referencia P3, P15, P50, P85 y P97.
- Menores de 2 años: control recomendado mensual.
- De 2 a 5 años: control recomendado trimestral.
- Aviso preventivo un día antes de una dosis programada y alerta cuando la fecha ya venció.

El programador analiza las reglas una vez al día. También puede ejecutarse manualmente desde el módulo **Alertas**.

## Reportes

Los usuarios `admin` y `encargado` pueden consultar y exportar:

- Niños con bajo peso, sobrepeso u obesidad.
- Vacunas incompletas.
- Cobertura de vacunación por comunidad.
- Crecimiento promedio por región y comunidad.

Los resultados pueden filtrarse por departamento, municipio y comunidad, y descargarse como PDF o libro de Excel `.xlsx`.

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
- Vinculación única entre DPI y chat de Telegram, con revocación administrativa.
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

Si existen mediciones creadas antes de incorporar las tablas OMS, pueden recalcularse con:

```bash
cd backend
npm run recalcular:oms
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

- Percentiles y puntajes Z calculados con referencias oficiales OMS 2006/2007.
- Carnet QR protegido con código, PIN y control de intentos.
- Integración funcional con Telegram y vinculación única del padre.
- Dashboard analítico y reportes exportables en PDF y Excel.

La integración con WhatsApp no forma parte del alcance implementado; la comunicación multicanal se cubre mediante Email y Telegram. La infraestructura cloud de alta disponibilidad, HTTPS y el dominio definitivo corresponden a la etapa de despliegue en producción.
