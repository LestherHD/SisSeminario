# DOCUMENTACIÓN DEL SCCVI

Sistema de Control de Crecimiento y Vacunación Infantil · Proyecto de seminario universitario

**Base documental:** código del backend y frontend disponible en este repositorio, sus modelos, rutas, controladores, servicios, utilidades, tablas de referencia y archivos de configuración. Las versiones indicadas son los rangos declarados en los `package.json`, no una certificación de las versiones instaladas en producción. Las observaciones de comportamiento describen la implementación, no una validación clínica.

## 1. Descripción general

El SCCVI es una aplicación web para que el personal de un centro de salud infantil registre y consulte el crecimiento y la vacunación de niños de distintas comunidades. La pantalla de inicio identifica al centro como **Centro de Salud Infantil - Crecer Sano**.

Centraliza información que, de estar distribuida en registros aislados, dificulta conocer el historial del paciente, identificar controles pendientes y contactar a su familia. Vincula comunidades, padres o tutores y niños; conserva mediciones y aplicaciones de vacunas; calcula indicadores de crecimiento; detecta condiciones que requieren seguimiento; y comunica avisos por correo electrónico y Telegram.

El personal trabaja en una interfaz privada. Los padres o tutores pueden consultar un expediente de salud mediante un código de carnet y un PIN, sin crear una cuenta del personal. El QR facilita abrir esa consulta, pero no contiene el expediente ni permite omitir el PIN.

El alcance implementado comprende gestión territorial y de pacientes, catálogo de vacunas, controles clínicos, alertas, notificaciones, campañas segmentadas, dashboard, reportes PDF/Excel, administración de usuarios y recuperación de contraseña. No hay integración operativa con WhatsApp, inventario de vacunas, agenda de citas ni diagnóstico médico automatizado.

## 2. Stack tecnológico

### 2.1. Plataforma y organización

| Elemento | Implementación comprobable |
| --- | --- |
| Arquitectura tecnológica | MERN: MongoDB, Express, React y Node.js. |
| Lenguaje | JavaScript; módulos ES mediante `type: module` en ambos paquetes; JSX en React. |
| Backend | Paquete `backend`, versión de aplicación `1.0.0`; entrada `server.js`. |
| Frontend | Paquete privado `frontend`, versión de aplicación `0.0.0`; Vite y `src/main.jsx`. |
| Node.js | El README menciona Node.js 24. No hay restricción `engines` en los manifiestos. Los servicios usan `fetch`, `FormData`, `Blob` y módulos nativos. |
| MongoDB | Base documental accedida con Mongoose. La versión del servidor MongoDB no está fijada en el repositorio. |
| Servicios externos | API transaccional de Brevo y Telegram Bot API, invocadas con `fetch`; no usan SDK dedicado. |

### 2.2. Dependencias del backend

Fuente: [backend/package.json](backend/package.json).

| Dependencia | Versión declarada | Uso |
| --- | --- | --- |
| `express` | `^5.2.1` | Servidor HTTP, routers y procesamiento JSON. |
| `mongoose` | `^9.9.1` | Esquemas, validación, referencias, consultas y agregaciones MongoDB. |
| `bcryptjs` | `^3.0.3` | Hash y comparación de contraseñas. |
| `jsonwebtoken` | `^9.0.3` | Firma y validación JWT. |
| `cors` | `^2.8.6` | Middleware CORS. |
| `dotenv` | `^17.4.2` | Carga de variables de entorno. |
| `express-rate-limit` | `^8.7.0` | Límites de solicitudes para autenticación y carnet. |
| `qrcode` | `^1.5.4` | Imagen del código QR en formato data URL. |
| `pdfkit` | `^0.20.2` | Reportes PDF. |
| `exceljs` | `^4.4.0` | Libros Excel `.xlsx`. |
| `swagger-jsdoc` | `^6.3.0` | Genera OpenAPI 3.0 desde comentarios `@openapi` de las rutas. |
| `swagger-ui-express` | `^5.0.1` | Publica la documentación interactiva en `/api-docs`. |
| `nodemon` | `^3.1.14` | Dependencia de desarrollo; reinicio del backend. |

El manifiesto también declara un `override` para `uuid: ^11.1.1`; no es una dependencia directa de la aplicación.

### 2.3. Dependencias del frontend

Fuente: [frontend/package.json](frontend/package.json).

| Dependencia | Versión declarada | Uso |
| --- | --- | --- |
| `react` / `react-dom` | `^19.2.8` / `^19.2.8` | Componentes, estado y renderizado. |
| `react-router-dom` | `^6.30.4` | Rutas públicas, privadas y por rol. |
| `axios` | `^1.19.0` | Cliente HTTP e interceptores. |
| `@mui/material` / `@mui/icons-material` | `^9.3.1` / `^9.3.1` | Interfaz Material UI e iconos. |
| `@emotion/react` / `@emotion/styled` | `^11.14.0` / `^11.14.1` | Estilos usados por Material UI. |
| `recharts` | `^3.10.1` | Curvas de crecimiento y gráficos del dashboard. |
| `vite` | `^8.2.0` | Desarrollo y compilación; dependencia de desarrollo. |
| `@vitejs/plugin-react` | `^6.0.4` | Integración React/Vite; desarrollo. |
| `eslint` / `@eslint/js` | `^10.8.0` / `^10.0.1` | Análisis estático; desarrollo. |
| `eslint-plugin-react-hooks` | `^7.1.1` | Reglas para hooks; desarrollo. |
| `eslint-plugin-react-refresh` | `^0.5.3` | Reglas para React Refresh; desarrollo. |
| `globals` | `^17.7.0` | Globales del navegador para ESLint; desarrollo. |
| `@types/react` / `@types/react-dom` | `^19.2.17` / `^19.2.3` | Definiciones de tipos de desarrollo; el código de aplicación sigue siendo JavaScript. |

## 3. Arquitectura

### 3.1. Estructura del repositorio

```text
sccvi/
├── backend/
│   ├── server.js                 Arranque, conexión MongoDB y montaje de rutas
│   ├── models/                   10 modelos Mongoose
│   ├── routes/                   14 routers de módulos
│   ├── controllers/              Casos de uso y respuestas HTTP
│   ├── middleware/               JWT, autorización y rate limiting
│   ├── services/                 OMS, carnet, reportes, correo, Telegram y scheduler
│   ├── utils/                    Motor de alertas y cálculos auxiliares
│   ├── data/oms/                 6 tablas LMS locales y nota de procedencia
│   ├── scripts/                  Recálculo de mediciones con OMS
│   └── seed.js                   Carga de demostración con limpieza de colecciones
├── frontend/
│   ├── src/main.jsx              Proveedores y BrowserRouter
│   ├── src/App.jsx               Definición de rutas y protección de vistas
│   ├── src/pages/                14 páginas
│   ├── src/components/           Layout, expediente y diálogos
│   ├── src/context/              Autenticación y tema
│   ├── src/services/api.js       Axios, URL de API e interceptores
│   ├── src/data/guatemala.js     Catálogo territorial para formularios
│   ├── src/utils/                Edad y etiquetas de indicadores
│   ├── src/assets/               Imágenes e iconos
│   ├── public/                   Recursos públicos
│   ├── .env.example              Ejemplo de VITE_API_URL
│   └── vite.config.js            Plugin React
└── DOCUMENTACION.md
```

El backend es una aplicación Express organizada por capas. Las rutas aplican middlewares y llaman a controladores; estos acceden a modelos y delegan cálculos o integraciones en servicios. No todos los módulos tienen una capa de servicio independiente: parte de la lógica de negocio está dentro de los controladores.

### 3.2. Comunicación y arranque

```text
Navegador con React
        │ HTTP: JSON + Authorization: Bearer <JWT> cuando corresponde
        ▼
Express → middleware → router/controlador → Mongoose → MongoDB
                             │
                             ├── OMS: lectura de tablas locales
                             ├── Brevo: correo transaccional
                             └── Telegram: mensajes, fotografías y polling

Temporizador del proceso Node → motor de alertas → MongoDB + notificaciones
```

`server.js` carga `backend/.env`, activa `cors()` y `express.json()`, monta los módulos bajo `/api` y conecta mediante `MONGO_URI`. Solo después de conectar a MongoDB comienza a escuchar en `PORT` o `5000`, inicia el programador de alertas y, si existe `TELEGRAM_BOT_TOKEN`, inicia el polling del bot.

React no se conecta directamente a MongoDB. Axios usa `VITE_API_URL` si está definida; en caso contrario construye `<protocolo del navegador>//<hostname>:5000/api`. El ejemplo de producción del frontend establece `VITE_API_URL=/api`. Vite no tiene un proxy de desarrollo configurado en este repositorio.

Las respuestas ordinarias son JSON. Los reportes de descarga devuelven binarios PDF o XLSX. La consulta del carnet devuelve datos JSON y la imagen QR se entrega como data URL cuando se solicita su generación.

### 3.3. Despliegue en VM Azure: alcance de la evidencia

El escenario solicitado de despliegue es una **máquina virtual de Azure con Node.js administrado por PM2, MongoDB y Nginx**. Su distribución sería:

```text
Internet → Nginx en VM Azure
              ├── frontend/dist: archivos estáticos de React
              └── /api → backend Node.js supervisado por PM2
                                  └── MongoDB local a la VM
```

**No se incluyen configuraciones de Azure, PM2, Nginx ni `mongod.conf`**, por lo que no se puede afirmar a partir del código que ese despliegue esté activo, que tenga HTTPS o que MongoDB escuche únicamente en localhost. Son propiedades de la infraestructura que deben verificarse en la VM.

Para ese escenario, la SPA necesita resolución de sus rutas hacia `index.html`, Nginx debe preservar el prefijo `/api` al dirigir las peticiones, `VITE_API_URL` debe apuntar a la API publicada y `FRONTEND_URL` debe contener el origen público usado en los QR. `TRUST_PROXY=true` hace que Express confíe en un salto de proxy. El proceso Express no fija una dirección de escucha en `app.listen(PORT)`.

PM2 tampoco figura como dependencia del backend. El scheduler y el bot viven dentro del mismo proceso que la API: levantar varias instancias puede duplicar análisis y polling. El bloqueo del scheduler y los contadores de rate limiting son locales a cada proceso.

### 3.4. Variables de entorno y comandos

| Variable | Dónde se usa | Significado |
| --- | --- | --- |
| `MONGO_URI` | Backend y scripts | Conexión MongoDB; sin valor predeterminado en código. El README ejemplifica `mongodb://127.0.0.1:27017/sccvi`. |
| `PORT` | Backend | Puerto HTTP; predeterminado `5000`. |
| `JWT_SECRET` | Backend | Secreto de firma y verificación JWT. |
| `BREVO_API_KEY` | Backend | Clave para el envío de correo. |
| `BREVO_REMITENTE` | Backend | Dirección del remitente que se envía a Brevo. |
| `TELEGRAM_BOT_TOKEN` | Backend | Credencial del bot; su presencia activa el polling. |
| `FRONTEND_URL` | Backend | Origen público de los enlaces del carnet; tiene prioridad sobre la inferencia por encabezados HTTP. |
| `ALERTAS_AUTOMATICAS` | Backend | Solo el texto exacto `false` desactiva el scheduler. |
| `TRUST_PROXY` | Backend | Solo el texto exacto `true` activa confianza en un proxy. |
| `VITE_API_URL` | Frontend | URL base de Axios; por ejemplo `/api`. Se incorpora al compilar con Vite. |

Los manifiestos ofrecen estos comandos, ejecutados dentro del directorio correspondiente:

| Directorio | Comando | Función |
| --- | --- | --- |
| `backend` | `npm install` | Instalar dependencias. |
| `backend` | `npm run dev` | Iniciar con nodemon. |
| `backend` | `npm start` | Ejecutar `node server.js`. |
| `backend` | `npm run recalcular:oms` | Modificar registros activos de crecimiento para recalcular campos OMS. |
| `frontend` | `npm install` | Instalar dependencias. |
| `frontend` | `npm run dev` | Servidor de desarrollo Vite. |
| `frontend` | `npm run build` | Compilar a `dist`. |
| `frontend` | `npm run preview` | Previsualizar la compilación. |
| `frontend` | `npm run lint` | Ejecutar ESLint. |

`backend` no tiene una suite de pruebas configurada: su script `test` imprime que no hay pruebas especificadas y termina con error. `seed.js` elimina todas las comunidades, padres, niños, mediciones y vacunas antes de insertar ejemplos; no es un instalador de producción. No limpia las otras colecciones y sus ejemplos no pasan por los controladores ni calculan automáticamente todos los campos OMS o del carnet.

## 4. Actores y roles

El enum de [Usuario](backend/models/Usuario.js) admite exclusivamente `admin`, `personal` y `encargado`. El rol predeterminado es `personal`. [authMiddleware.js](backend/middleware/authMiddleware.js) distingue autenticación (`proteger`) y autorización por rol (`autorizar`). El rol efectivo se consulta en MongoDB en cada petición protegida.

| Actor | Responsabilidad y acceso |
| --- | --- |
| Administrador (`admin`) | Todas las operaciones del personal; administra cuentas, revoca Telegram y prueba correo. Está sujeto a las restricciones de la propia cuenta y del último administrador activo. |
| Encargado (`encargado`) | Gestión operativa, catálogos, desactivaciones/reactivaciones permitidas, análisis global de alertas, campañas, dashboard y reportes. Sin administración de usuarios ni revocación de Telegram. |
| Personal (`personal`) | Consulta, creación y edición de comunidades, padres y niños; registro/edición de crecimiento, registro de vacunas aplicadas, atención de alertas y acceso al carnet interno. Puede consultar campañas. |
| Padre o tutor | Entidad `Padre`, no rol de `Usuario`. Recibe avisos, vincula Telegram con DPI y consulta un carnet con código/PIN. |
| Niño o niña | Paciente registrado; no tiene cuenta de acceso. |
| Procesos del sistema | Scheduler y bot; ejecutan tareas desde el backend sin una sesión humana. |

### 4.1. Matriz de permisos de la API

| Operación | admin | encargado | personal |
| --- | --- | --- | --- |
| Consultar comunidades, padres, niños y vacunas | Sí | Sí | Sí |
| Crear/editar comunidades, padres y niños | Sí | Sí | Sí |
| Desactivar/reactivar comunidades, padres y niños | Sí | Sí | No |
| Mantener catálogo de vacunas | Sí | Sí | No |
| Consultar/crear/editar/eliminar mediciones | Sí | Sí | Sí |
| Consultar/registrar/eliminar dosis aplicadas | Sí | Sí | Sí |
| Consultar/atender alertas | Sí | Sí | Sí |
| Ejecutar análisis global/eliminar alertas | Sí | Sí | No |
| Enviar una alerta a los padres | Sí | Sí | Sí |
| Probar Telegram | Sí | Sí | No |
| Probar email | Sí | No | No |
| Generar/enviar carnet y consultar expediente interno | Sí | Sí | Sí |
| Consultar campañas/previsualizar destinatarios | Sí | Sí | Sí |
| Crear/editar/eliminar/enviar campañas | Sí | Sí | No |
| Dashboard y reportes/exportaciones | Sí | Sí | No |
| Gestionar usuarios y revocar Telegram | Sí | No | No |

**Diferencias con la interfaz:** `personal` puede leer vacunas por API para registrar aplicaciones, aunque no puede abrir la página de mantenimiento `/vacunas`. El botón de notificar una alerta se muestra solo a `admin`/`encargado`, aunque la API permite también `personal`. La API ofrece eliminación de crecimiento y reactivación de comunidades, pero las páginas correspondientes no presentan esas acciones. Las restricciones reales de cada endpoint se detallan a continuación; ocultar un botón no sustituye autorización.

No existen permisos por comunidad asignada a un empleado: los usuarios autorizados consultan los registros generales del sistema.

## 5. Modelos de datos (entidades)

Se definen **10 modelos Mongoose**. Las tablas describen campos persistidos, tipos, obligatoriedad y valores predeterminados del esquema. Una regla de controlador puede ser más exigente que el esquema; se indica cuando corresponde.

### 5.1. Campos comunes

Todos los modelos usan `{ timestamps: true }` y conservan el campo de versión predeterminado de Mongoose.

| Campo | Tipo | Regla |
| --- | --- | --- |
| `_id` | ObjectId | Identificador generado por MongoDB/Mongoose. |
| `createdAt` | Date | Fecha de creación administrada por Mongoose. |
| `updatedAt` | Date | Fecha de actualización administrada por Mongoose. |
| `__v` | Number | Campo de versión administrado por Mongoose. |
| `activo` | Boolean | Predeterminado `true`; está declarado en los 10 esquemas. Permite desactivación lógica. |

Estos campos se aplican a cada tabla siguiente. `ref` expresa una referencia de Mongoose, no una restricción de clave foránea del servidor MongoDB. No hay borrado en cascada implementado.

### 5.2. Usuario

Fuente: [backend/models/Usuario.js](backend/models/Usuario.js).

| Campo | Tipo | Obligatorio / valor predeterminado / detalle |
| --- | --- | --- |
| `nombre` | String | Obligatorio. |
| `email` | String | Obligatorio, único, minúsculas y `trim`. |
| `password` | String | Obligatorio; hash bcrypt al guardar si fue modificado. |
| `rol` | String | Enum `admin`, `personal`, `encargado`; predeterminado `personal`. |
| `emailVerificado` | Boolean | Predeterminado `true`; el administrador inicial se crea con `false`. |
| `verificacionEmailToken` | String | Hash SHA-256 del código; `select: false`. |
| `verificacionEmailExpires` | Date | Vencimiento del código; `select: false`. |
| `verificacionEmailAttempts` | Number | Predeterminado `0`; `select: false`. |
| `verificacionEmailSolicitadoEn` | Date | Última solicitud; `select: false`. |
| `resetPasswordToken` | String | Hash SHA-256 del código de recuperación; `select: false`. |
| `resetPasswordExpires` | Date | Vencimiento; `select: false`. |
| `resetPasswordAttempts` | Number | Predeterminado `0`; `select: false`. |
| `resetPasswordSolicitadoEn` | Date | Última solicitud; `select: false`. |
| `passwordChangedAt` | Date | Fecha que permite rechazar JWT emitidos antes del cambio. |

No contiene refs salientes. El hook `pre('save')` usa bcrypt con costo 10; el método `compararPassword(passwordPlano)` compara contra el hash. `password` no declara `select: false`: los controladores/middleware excluyen o seleccionan explícitamente los datos que devuelven.

### 5.3. Comunidad

Fuente: [backend/models/Comunidad.js](backend/models/Comunidad.js).

| Campo | Tipo | Regla |
| --- | --- | --- |
| `nombre` | String | Obligatorio, `trim`; comunidad o aldea. |
| `departamento` | String | Obligatorio, `trim`. |
| `municipio` | String | Obligatorio, `trim`. |

Índice compuesto único por `{ departamento, municipio, nombre }`, con collation española de fuerza 2 y filtro parcial que exige que los tres campos sean cadenas. La unicidad incluye comunidades inactivas. `numeroFamilias` es un valor calculado del listado y **no es un campo del modelo**.

### 5.4. Padre

Fuente: [backend/models/Padre.js](backend/models/Padre.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `primerNombre` | String | Obligatorio, `trim`. |
| `segundoNombre` | String | `trim`, predeterminado `''`. |
| `tercerNombre` | String | `trim`, predeterminado `''`. |
| `primerApellido` | String | Obligatorio, `trim`. |
| `segundoApellido` | String | Obligatorio, `trim`. |
| `nombreCompleto` | String | `trim`; calculado en `pre('save')`. |
| `dpi` | String | Opcional en el esquema; controlador elimina espacios y comprueba duplicados. |
| `telefono` | String | Opcional. |
| `email` | String | Opcional en esquema; necesario si se elige email. |
| `metodoContacto` | String[] | Valores `telegram`, `email`; predeterminado `[]`. El controlador exige al menos uno. |
| `telegramChatId` | String | Identificador del chat vinculado por el bot. |
| `comunidad` | ObjectId | Obligatorio; ref `Comunidad`. |

No hay índices únicos de DPI ni de chat declarados en el esquema: sus comprobaciones están en controladores y bot. `nombreCompleto` concatena nombres y apellidos no vacíos y normaliza espacios. No hay un arreglo de hijos en `Padre`; se obtiene la relación desde `Nino.padres`.

### 5.5. Nino

Fuente: [backend/models/Nino.js](backend/models/Nino.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `primerNombre` | String | Obligatorio, `trim`. |
| `segundoNombre` | String | `trim`, predeterminado `''`. |
| `tercerNombre` | String | `trim`, predeterminado `''`. |
| `primerApellido` | String | Obligatorio, `trim`. |
| `segundoApellido` | String | Obligatorio, `trim`. |
| `nombreCompleto` | String | Calculado al guardar, con normalización de espacios. |
| `fechaNacimiento` | Date | Obligatorio. |
| `sexo` | String | Obligatorio; enum `M`, `F`. |
| `comunidad` | ObjectId | Obligatorio; ref `Comunidad`. |
| `padres` | ObjectId[] | Ref `Padre` por elemento; no exige mínimo de elementos. |
| `codigoQR` | String | URL de consulta del carnet; no es la imagen binaria del QR. |
| `codigoCarnet` | String | Índice único y `sparse`; opcional en esquema, generado al crear por API. |
| `pin` | String | PIN de cuatro dígitos generado por el servicio; almacenado sin hash. |

La generación automática de credenciales ocurre en el controlador de creación, no en un hook universal del modelo. Crear un `Nino` directamente desde un script puede omitirla.

### 5.6. Vacuna

Fuente: [backend/models/Vacuna.js](backend/models/Vacuna.js).

| Campo | Tipo | Regla |
| --- | --- | --- |
| `nombre` | String | Obligatorio, `trim`. |
| `rangoEdad` | String | Obligatorio, `trim`; formato `mínimo-máximo`, enteros no negativos y mínimo ≤ máximo. La interfaz y reportes lo interpretan en años. |
| `dosisMl` | Number | Obligatorio, mínimo `0.01`; volumen de referencia en mililitros. |
| `numeroDosis` | Number | Obligatorio, mínimo `1`; el controlador exige entero. |
| `intervaloValor` | Number | Mínimo `0`, predeterminado `0`. |
| `intervaloUnidad` | String | Enum `dias`, `semanas`, `meses`; predeterminado `meses`. |
| `descripcion` | String | `trim`, predeterminado `''`. |

No tiene refs. Algunos lectores admiten campos históricos `edadRecomendada`, `dosisTotales` e `intervaloMeses`; estos **no forman parte del esquema actual**.

### 5.7. Vacunacion

Fuente: [backend/models/Vacunacion.js](backend/models/Vacunacion.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `nino` | ObjectId | Obligatorio; ref `Nino`. |
| `vacuna` | ObjectId | Obligatorio; ref `Vacuna`. |
| `numeroDosis` | Number | Obligatorio; calculado según aplicaciones activas de ese niño y vacuna. |
| `fechaAplicada` | Date | Obligatorio. |
| `proximaDosis` | Date | Opcional; el controlador guarda `null` si no programa otra dosis. |

Cada documento representa una aplicación. No guarda lote, fabricante, volumen efectivamente aplicado ni usuario que aplicó la dosis; el volumen existe en el catálogo.

### 5.8. RegistroCrecimiento

Fuente: [backend/models/RegistroCrecimiento.js](backend/models/RegistroCrecimiento.js).

| Campo | Tipo | Regla / significado |
| --- | --- | --- |
| `nino` | ObjectId | Obligatorio; ref `Nino`. |
| `peso` | Number | Obligatorio; kg. El servicio valida que sea positivo y finito. |
| `talla` | Number | Obligatorio; cm. El servicio valida que sea positiva y finita. |
| `fecha` | Date | Predeterminado `Date.now`. |
| `edadMeses` | Number | Parte entera de la edad exacta en meses. |
| `edadDias` | Number | Días completos desde el nacimiento. |
| `edadMesesExacta` | Number | Edad en días dividida entre `30.4375`, almacenada con dos decimales. |
| `imc` | Number | Peso/talla en metros al cuadrado; dos decimales. |
| `zPesoEdad` | Number | Predeterminado `null`; Z de peso para edad. |
| `zTallaEdad` | Number | Predeterminado `null`; Z de talla para edad. |
| `zImcEdad` | Number | Predeterminado `null`; Z de IMC para edad. |
| `percentilPeso` | Number | Percentil derivado de Z; puede recibir `null` sin referencia disponible. |
| `percentilTalla` | Number | Percentil derivado de Z. |
| `percentilImc` | Number | Predeterminado `null`. |
| `estadoNutricional` | String | Predeterminado `sin_datos`; calculado desde Z de IMC y edad. No tiene enum de esquema. |
| `estadoTalla` | String | Predeterminado `sin_datos`; calculado desde Z de talla. No tiene enum de esquema. |
| `referenciaOms` | String | Predeterminado `''`; normalmente `OMS 2006` o `OMS 2007`. |

### 5.9. Alerta

Fuente: [backend/models/Alerta.js](backend/models/Alerta.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `nino` | ObjectId | Obligatorio; ref `Nino`. |
| `tipo` | String | Obligatorio; enum `preventiva`, `critica`. |
| `motivo` | String | Enum `desnutricion`, `sobrepeso`, `sin_registros`, `vacuna_proxima`, `vacuna_atrasada`; no marcado obligatorio. |
| `mensaje` | String | Obligatorio. |
| `fecha` | Date | Predeterminado `Date.now`. |
| `atendida` | Boolean | Predeterminado `false`. |

`atendida` y `activo` son independientes: marcar atendida no desactiva la alerta; el motor desactiva una condición que deja de cumplirse.

### 5.10. Notificacion

Fuente: [backend/models/Notificacion.js](backend/models/Notificacion.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `padre` | ObjectId | Obligatorio; ref `Padre`. |
| `alerta` | ObjectId | Opcional; ref `Alerta`. |
| `campana` | ObjectId | Opcional; ref `Campana`. |
| `canal` | String | Obligatorio; enum `email`, `telegram`, `whatsapp`. |
| `mensaje` | String | Obligatorio. |
| `estado` | String | Enum `enviada`, `pendiente`, `fallida`; predeterminado `pendiente`. |
| `fechaEnvio` | Date | Fecha del intento de envío, también registrada si falló. |

El enum incluye `whatsapp`, pero no existe servicio ni ruta de envío por ese canal. El esquema no obliga a elegir exactamente una de `alerta` o `campana`. No todos los correos/mensajes generan este registro: los envíos de alertas y campañas sí; bienvenida, códigos, pruebas y carnet no se registran aquí en sus implementaciones actuales.

### 5.11. Campana

Fuente: [backend/models/Campana.js](backend/models/Campana.js).

| Campo | Tipo | Regla / relación |
| --- | --- | --- |
| `nombre` | String | Obligatorio, `trim`. |
| `descripcion` | String | Obligatorio, `trim`; texto del aviso. |
| `tipoCampana` | String | Enum `jornada_vacunacion`, `control_medico`, `otro`; predeterminado `jornada_vacunacion`. |
| `edadMinimaAnios` | Number | De 0 a 19; predeterminado `null`; controlador exige entero si se proporciona. |
| `edadMaximaAnios` | Number | De 0 a 19; predeterminado `null`; controlador exige entero y mínimo ≤ máximo. |
| `estadoVacunacion` | String | Enum `todos`, `al_dia`, `atrasada`, `sin_esquema`; predeterminado `todos`. |
| `alcance` | String | Obligatorio; enum `departamento`, `municipio`, `comunidad`. |
| `departamento` | String | Obligatorio, `trim`. |
| `municipio` | String | `trim`, predeterminado `''`; exigido por controlador para municipio/comunidad. |
| `comunidad` | ObjectId | Ref `Comunidad`; predeterminado `null`; exigido si alcance es comunidad. |
| `fechaRealizacion` | Date | Obligatorio. |
| `notificacionEnviada` | Boolean | Predeterminado `false`. |
| `fechaEnvio` | Date | Predeterminado `null`. |
| `destinatariosEnviados` | Number | Predeterminado `0`; suma de envíos exitosos por canal, no personas únicas. |
| `destinatariosFallidos` | Number | Predeterminado `0`; suma de intentos fallidos por canal. |
| `correosEnviados` | Number | Predeterminado `0`. |
| `correosFallidos` | Number | Predeterminado `0`. |
| `telegramEnviados` | Number | Predeterminado `0`. |
| `telegramFallidos` | Number | Predeterminado `0`. |
| `creadoPor` | ObjectId | Opcional en esquema; ref `Usuario`; se asigna desde la sesión al crear. |

`estado` (`proxima`, `en_curso`, `finalizada`) se agrega a la respuesta a partir de la fecha; no está persistido como campo del esquema.

### 5.12. Relaciones para el diagrama de clases

| Origen y campo | Destino | Cardinalidad lógica |
| --- | --- | --- |
| `Padre.comunidad` | Comunidad | Muchos padres → una comunidad. |
| `Nino.comunidad` | Comunidad | Muchos niños → una comunidad. |
| `Nino.padres[]` | Padre | Muchos niños ↔ muchos padres; arreglo almacenado del lado del niño, sin mínimo. |
| `Vacunacion.nino` | Nino | Muchas aplicaciones → un niño. |
| `Vacunacion.vacuna` | Vacuna | Muchas aplicaciones → una vacuna del catálogo. |
| `RegistroCrecimiento.nino` | Nino | Muchas mediciones → un niño. |
| `Alerta.nino` | Nino | Muchas alertas → un niño. |
| `Notificacion.padre` | Padre | Muchos intentos → un destinatario. |
| `Notificacion.alerta` | Alerta | Muchos intentos → cero o una alerta. |
| `Notificacion.campana` | Campana | Muchos intentos → cero o una campaña. |
| `Campana.comunidad` | Comunidad | Muchas campañas → cero o una comunidad específica. |
| `Campana.creadoPor` | Usuario | Muchas campañas → cero o un usuario creador, según esquema. |

No existen modelos independientes para familia, departamento, municipio, carnet, expediente, dashboard o reporte. Son agrupaciones, datos de catálogo, campos de otras entidades o respuestas calculadas.

## 6. Endpoints de la API (rutas)

Inventario de **69 endpoints explícitos bajo `/api` y un endpoint raíz**, obtenido de `backend/server.js` y los 14 archivos de `backend/routes/`. No se incluyen como rutas de negocio las respuestas automáticas de CORS/Express.

**Convenciones:** `A` = `admin`, `E` = `encargado`, `P` = `personal`. `JWT: A/E/P` significa ruta protegida que admite los tres roles actuales. Algunas consultas solo usan `proteger`, sin lista de roles adicional. `Pública` significa sin JWT, no necesariamente sin validaciones o límites. Los parámetros `:id` y `:ninoId` son identificadores MongoDB; `:codigo` es el código textual del carnet.

Para rutas protegidas:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### 6.1. Estado de la API

| Método | Ruta | Función / respuesta | Acceso |
| --- | --- | --- | --- |
| GET | `/` | Devuelve `{ "mensaje": "API SCCVI funcionando" }`. | Pública |

### 6.2. Autenticación

Fuente: [authRoutes.js](backend/routes/authRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/auth/estado-inicial` | Indica `requiereConfiguracion`, `requiereVerificacion` y, si procede, correo enmascarado. | Pública |
| POST | `/api/auth/configuracion-inicial` | Crea primer admin inactivo y envía código. Body: `nombre`, `email`, `password`, `confirmarPassword`. Solo sin usuarios existentes. | Pública, limitada |
| POST | `/api/auth/verificar-configuracion-inicial` | Valida body `{ codigo }` y activa el admin pendiente. | Pública, limitada |
| POST | `/api/auth/reenviar-configuracion-inicial` | Reenvía código al admin pendiente; sin body requerido. | Pública, limitada |
| POST | `/api/auth/register` | Crea usuario. Body: `nombre`, `email`, `password`, `rol` opcional. | JWT: A |
| POST | `/api/auth/login` | Body: `email`, `password`; devuelve `token` y `usuario`. | Pública, limitada |
| POST | `/api/auth/solicitar-recuperacion` | Body `{ email }`; solicita código con respuesta genérica. | Pública, limitada |
| POST | `/api/auth/restablecer-password` | Body: `email`, `codigo`, `nuevaPassword`, `confirmarPassword`; cambia contraseña. | Pública, limitada |
| GET | `/api/auth/perfil` | Devuelve `{ usuario }` de la sesión validada, sin contraseña. | JWT: A/E/P |

### 6.3. Comunidades

Fuente: [comunidadRoutes.js](backend/routes/comunidadRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/comunidades` | Lista activas con `numeroFamilias`; `?incluirInactivos=true` incluye inactivas. | JWT: A/E/P |
| GET | `/api/comunidades/:id` | Obtiene una comunidad activa. | JWT: A/E/P |
| POST | `/api/comunidades` | Crea con `nombre`, `departamento`, `municipio`. | JWT: A/E/P |
| PUT | `/api/comunidades/:id` | Actualiza esos tres campos; todos exigidos. | JWT: A/E/P |
| DELETE | `/api/comunidades/:id` | Desactiva: `activo=false`. | JWT: A/E |
| PATCH | `/api/comunidades/:id/reactivar` | Reactiva: `activo=true`. | JWT: A/E |

### 6.4. Padres o tutores

Fuente: [padreRoutes.js](backend/routes/padreRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/padres` | Lista activos y su comunidad; admite `incluirInactivos=true`. | JWT: A/E/P |
| GET | `/api/padres/:id` | Obtiene padre activo con comunidad. | JWT: A/E/P |
| POST | `/api/padres` | Crea con nombres, apellidos, `dpi`, `telefono`, `email`, `metodoContacto`, `comunidad`; bienvenida email si corresponde. | JWT: A/E/P |
| PUT | `/api/padres/:id` | Actualiza campos permitidos de identidad, contacto y comunidad. No permite asignar `telegramChatId` directamente. | JWT: A/E/P |
| PATCH | `/api/padres/:id/telegram/revocar` | Elimina el chat vinculado de un padre activo. | JWT: A |
| DELETE | `/api/padres/:id` | Desactiva al padre. | JWT: A/E |
| PATCH | `/api/padres/:id/reactivar` | Reactiva al padre. | JWT: A/E |

### 6.5. Niños

Fuente: [ninoRoutes.js](backend/routes/ninoRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/ninos` | Lista activos, comunidad y nombres de padres; admite `incluirInactivos=true`. | JWT: A/E/P |
| GET | `/api/ninos/:id` | Obtiene niño activo con referencias pobladas. | JWT: A/E/P |
| POST | `/api/ninos` | Crea con nombres, apellidos, `fechaNacimiento`, `sexo`, `comunidad`, `padres`; genera credenciales de carnet. | JWT: A/E/P |
| PUT | `/api/ninos/:id` | Actualiza identidad, fecha, sexo, comunidad y padres. No permite cambiar PIN/código por este endpoint. | JWT: A/E/P |
| DELETE | `/api/ninos/:id` | Desactiva al niño. | JWT: A/E |
| PATCH | `/api/ninos/:id/reactivar` | Reactiva al niño. | JWT: A/E |

### 6.6. Catálogo de vacunas

Fuente: [vacunaRoutes.js](backend/routes/vacunaRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/vacunas` | Lista activas; admite `incluirInactivos=true` y normaliza campos históricos. | JWT: A/E/P |
| GET | `/api/vacunas/:id` | Obtiene vacuna activa. | JWT: A/E/P |
| POST | `/api/vacunas` | Crea con `nombre`, `rangoEdad`, `dosisMl`, `numeroDosis`, intervalo y descripción. | JWT: A/E |
| PUT | `/api/vacunas/:id` | Actualiza catálogo con normalización y validación de datos. | JWT: A/E |
| DELETE | `/api/vacunas/:id` | Desactiva vacuna. | JWT: A/E |
| PATCH | `/api/vacunas/:id/reactivar` | Reactiva vacuna. | JWT: A/E |

### 6.7. Vacunación

Fuente: [vacunacionRoutes.js](backend/routes/vacunacionRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| POST | `/api/vacunacion` | Body `nino`, `vacuna`, `fechaAplicada`; calcula número y próxima dosis, analiza alertas; devuelve `{ registro, mensaje }`. | JWT: A/E/P |
| GET | `/api/vacunacion/resumen/:ninoId` | Resumen por vacuna aplicada: conteos, fechas y estado `completa`, `al_dia` o `atrasada`. | JWT: A/E/P |
| GET | `/api/vacunacion/nino/:ninoId` | Historial de aplicaciones activas con nombre de vacuna. | JWT: A/E/P |
| DELETE | `/api/vacunacion/:id` | Desactiva una aplicación. | JWT: A/E/P |

No hay endpoint para editar una aplicación ni para reactivarla.

### 6.8. Crecimiento

Fuente: [crecimientoRoutes.js](backend/routes/crecimientoRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| POST | `/api/crecimiento` | Body `nino`, `peso`, `talla`, `fecha` opcional; evalúa OMS y analiza alertas. | JWT: A/E/P |
| GET | `/api/crecimiento/nino/:ninoId` | Mediciones activas ordenadas por fecha ascendente. | JWT: A/E/P |
| GET | `/api/crecimiento/curvas/:ninoId` | Referencias P3/P15/P50/P85/P97 y mediciones de peso, talla e IMC. | JWT: A/E/P |
| PATCH | `/api/crecimiento/:id` | Actualiza `peso`, `talla`, `fecha`; recalcula indicadores y analiza alertas. | JWT: A/E/P |
| DELETE | `/api/crecimiento/:id` | Desactiva medición; no ejecuta análisis inmediato de alertas. | JWT: A/E/P |

### 6.9. Alertas

Fuente: [alertaRoutes.js](backend/routes/alertaRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/alertas` | Lista `activo=true`, por defecto no atendidas; `?soloActivas=false` incluye atendidas, pero no desactivadas. | JWT: A/E/P |
| POST | `/api/alertas/analizar` | Analiza todos los niños activos; devuelve mensaje y `total` de alertas nuevas. | JWT: A/E |
| PATCH | `/api/alertas/:id/atender` | Establece `atendida=true`. | JWT: A/E/P |
| DELETE | `/api/alertas/:id` | Establece `activo=false`. | JWT: A/E |

### 6.10. Dashboard

Fuente: [dashboardRoutes.js](backend/routes/dashboardRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/dashboard` | Totales y distribuciones filtrados por `departamento`, `municipio`, `comunidad` (nombre), `sexo` (`M`/`F`), `edadMin`, `edadMax`; actividad con `periodo=mes`, `3meses`, `6meses` o `todo` (predeterminado `mes`). | JWT: A/E |

### 6.11. Notificaciones

Fuente: [notificacionRoutes.js](backend/routes/notificacionRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| POST | `/api/notificaciones/prueba` | Body `chatId`, `mensaje` opcional; envía prueba Telegram. | JWT: A/E |
| POST | `/api/notificaciones/prueba-email` | Body `email`, `nombre` opcional; envía bienvenida como prueba. | JWT: A |
| POST | `/api/notificaciones/alerta` | Body `{ alertaId }`; intenta enviar a padres por sus canales; devuelve `enviadas`, `intentos`, `totalPadres`. | JWT: A/E/P |

No hay ruta GET de historial de notificaciones ni una página independiente de notificaciones.

### 6.12. Carnet y expediente

Fuente: [carnetRoutes.js](backend/routes/carnetRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/carnet/generar/:ninoId` | Asegura credenciales, actualiza URL y devuelve `qrImagen`, `codigoCarnet`, `pin`, `url`, `ninoNombre`. Puede escribir en BD pese a usar GET. | JWT: A/E/P |
| POST | `/api/carnet/enviar/:ninoId` | Envía enlace, código, PIN y fotografía QR a padres con Telegram seleccionado/vinculado. | JWT: A/E/P |
| GET | `/api/carnet/expediente/:ninoId` | Expediente interno de niño activo, sin solicitar PIN. | JWT: A/E/P |
| POST | `/api/carnet/ver/:codigo` | Body `{ "pin": "1234" }`; verifica código/PIN y devuelve expediente. PIN de ejemplo, no credencial real. | Pública, limitada; requiere código/PIN |

### 6.13. Campañas

Fuente: [campanaRoutes.js](backend/routes/campanaRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/campanas` | Campañas activas con comunidad y estado temporal calculado. | JWT: A/E/P |
| GET | `/api/campanas/:id/destinatarios` | Conteos de padres, niños coincidentes, excluidos y canales; no envía avisos. | JWT: A/E/P |
| POST | `/api/campanas` | Crea con nombre, descripción, fecha `YYYY-MM-DD`, destino y segmentación. | JWT: A/E |
| PUT | `/api/campanas/:id` | Actualiza campaña activa todavía no notificada. | JWT: A/E |
| DELETE | `/api/campanas/:id` | Desactiva campaña. | JWT: A/E |
| POST | `/api/campanas/:id/enviar` | Envía avisos por email/Telegram y guarda resultados. | JWT: A/E |

### 6.14. Usuarios

Fuente: [usuarioRoutes.js](backend/routes/usuarioRoutes.js). Todo el router usa `proteger` y `autorizar('admin')`.

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/usuarios` | Lista usuarios activos e inactivos, sin contraseñas ni campos ocultos de códigos. | JWT: A |
| POST | `/api/usuarios` | Crea usuario con el mismo controlador de `/api/auth/register`. | JWT: A |
| PUT | `/api/usuarios/:id` | Body `nombre`, `email`, `rol`; no cambia contraseña. | JWT: A |
| PATCH | `/api/usuarios/:id/estado` | Body `{ activo: true/false }`; solo el booleano `true` activa. | JWT: A |

### 6.15. Reportes

Fuente: [reporteRoutes.js](backend/routes/reporteRoutes.js).

| Método | Ruta | Función / datos relevantes | Acceso |
| --- | --- | --- | --- |
| GET | `/api/reportes` | Devuelve resumen, riesgos nutricionales, vacunas incompletas, cobertura y crecimiento promedio. | JWT: A/E |
| GET | `/api/reportes/pdf` | Exporta los datos a PDF A4 horizontal. | JWT: A/E |
| GET | `/api/reportes/excel` | Exporta una hoja por sección seleccionada; cinco en el reporte general. | JWT: A/E |
| GET | `/api/reportes/conteo` | Devuelve `{ ninos }` con el número de niños que cumplen los filtros de población. | JWT: A/E |

Las cuatro rutas aceptan filtros de población como query strings; el contrato completo del constructor se detalla en 7.12.1. La localidad usa `departamento`, `municipio` y `comunidad`. **`comunidad` es el nombre, no el ObjectId**. Solo incluyen comunidades activas y niños activos de esas comunidades.

### 6.16. Contratos generales para preparar Swagger/OpenAPI

Los listados CRUD generalmente responden con arreglos directamente; las altas/ediciones, con documentos. No existe un sobre de respuesta universal. El login devuelve `{ token, usuario: { id, nombre, email, rol } }`, mientras documentos de MongoDB utilizan normalmente `_id`.

| Código | Uso observado |
| --- | --- |
| `200` | Lectura, actualización, desactivación, acciones y login correctos. También algunos envíos sin destinatarios. |
| `201` | Creación de registros o administrador pendiente. |
| `400` | Datos inválidos o regla de negocio incumplida; algunas fallas de prueba Telegram. |
| `401` | JWT ausente/inválido/expirado, usuario inactivo, credenciales o PIN incorrectos. |
| `403` | Rol no permitido o configuración inicial no disponible. |
| `404` | Registro no encontrado, cuando el controlador lo comprueba. |
| `409` | Duplicación de comunidad/DPI, campaña ya notificada u otros conflictos de configuración. |
| `429` | Rate limit o espera requerida antes de reenviar código inicial. |
| `500` | Excepciones; varias validaciones de Mongoose y ObjectId inválidos pueden llegar aquí. |
| `502` | Fallas específicas de correo o campaña sin envíos exitosos. |

Los errores suelen tener `{ mensaje }` y en varios controladores también `{ error: error.message }`. No hay middleware global que unifique validaciones o errores. Los listados no implementan paginación en servidor; parte de la interfaz pagina o filtra datos ya descargados.

### 6.17. Swagger UI interactivo

[backend/config/swagger.js](backend/config/swagger.js) genera OpenAPI 3.0 con `swagger-jsdoc`, leyendo comentarios `@openapi` en los 14 routers mediante una ruta absoluta compatible con Windows. `backend/server.js` publica Swagger UI sin autenticación en `http://localhost:5000/api-docs/`. El servidor conserva su requisito de conectar a MongoDB antes de escuchar.

La documentación interactiva cubre **17 operaciones en 16 paths y 14 tags**: los ocho endpoints principales de login, perfil, listado/alta de niños, comunidades, alta de crecimiento y generación/consulta de carnet, más una operación representativa de cada router restante. El inventario completo de rutas de negocio sigue siendo el de las tablas anteriores; esta primera integración no anota aún todas esas operaciones.

Para usarla, iniciar el backend con `npm run dev` o `npm start`, abrir `/api-docs/`, ejecutar el login con una cuenta activa y copiar el campo `token` en **Authorize**. Ingresar solo el JWT; Swagger UI agrega el prefijo Bearer. Login y consulta pública de carnet declaran `security: []`; las operaciones privadas usan `bearerAuth`. Los roles concretos se indican en cada operación y se siguen validando en el backend. **Try it out** ejecuta peticiones reales, incluidos registros y envíos cuando se eligen esas operaciones. Los identificadores y credenciales de ejemplo deben sustituirse por datos de la instalación.

El servidor de OpenAPI está configurado como `http://localhost:5000` (Desarrollo). Para otra ubicación o puerto debe actualizarse `servers` en la configuración. Los cambios en comentarios requieren reiniciar el proceso para regenerar la especificación; nodemon lo hace en desarrollo. `failOnErrors: true` hace fallar la generación ante errores detectados en las anotaciones.

## 7. Módulos funcionales

### 7.1. Autenticación y administración de usuarios

Fuentes: `authController.js`, `usuarioController.js`, `authMiddleware.js`, `AuthContext.jsx` y `Login.jsx`.

El login normaliza email, busca una cuenta activa y compara la contraseña con bcrypt. Firma un JWT con `id` y `rol`, vigencia de **7 días**, usando `JWT_SECRET`. El middleware verifica la firma y vuelve a consultar al usuario; rechaza cuentas ausentes/inactivas y tokens cuyo `iat` preceda a `passwordChangedAt`.

La instalación inicial consulta si existen usuarios. Si no hay ninguno, permite crear un administrador con `activo=false` y `emailVerificado=false`. Envía un código aleatorio de seis dígitos por Brevo y solo la verificación normal de ese código activa la cuenta. Si falla ese primer envío, el controlador borra la cuenta pendiente que acaba de crear. La exclusión de creación simultánea utiliza una variable en memoria del proceso.

Los códigos de verificación y recuperación se guardan como SHA-256, vencen en **10 minutos**, tienen máximo de **5 intentos** y un intervalo de **60 segundos** entre solicitudes para la misma cuenta. La comparación de hashes usa `crypto.timingSafeEqual`. La recuperación responde de forma genérica aunque no exista la cuenta o no se consiga enviar el correo. Al restablecer la contraseña se elimina el código y se asigna `passwordChangedAt`.

La contraseña debe tener al menos ocho caracteres, una mayúscula, una minúscula y un número. Esta regla se aplica al crear cuentas y restablecer contraseñas. Los usuarios creados por el administrador tienen `emailVerificado=true` por defecto y no realizan el flujo de verificación inicial.

El administrador puede editar nombre, email y rol, pero no modificar su propio rol ni desactivar su cuenta. No puede quitar el rol o desactivar al último administrador activo. El cambio de estado no comprueba `emailVerificado`, y el login exige `activo` sin comprobar ese campo separadamente; la verificación obligatoria se implementa principalmente mediante el estado inactivo inicial.

### 7.2. Comunidades y familias calculadas

Fuentes: `comunidadController.js`, `Comunidades.jsx`, `frontend/src/data/guatemala.js`.

Se registra departamento, municipio y comunidad/aldea. El frontend ofrece un catálogo local de departamentos y municipios con selección encadenada; el backend valida cadenas obligatorias y duplicados, pero no contrasta esos nombres con dicho catálogo.

Para cada comunidad, el listado busca niños activos, ordena los identificadores de sus padres y construye una clave con el conjunto completo. Cada combinación no vacía distinta cuenta como una familia. Dos hermanos con los mismos padres cuentan una sola vez; `[padreA]` y `[padreA,padreB]` cuentan como combinaciones diferentes. Niños sin padres asociados no suman familias. No se cuenta simplemente el número de padres ni se guarda un total estático.

La pantalla agrupa comunidades por departamento/municipio, suma familias de sus comunidades y muestra detalle en un diálogo. La búsqueda opera sobre departamento/municipio y la paginación es local de 20 grupos. Desactivar una comunidad no desactiva automáticamente a sus padres o niños.

### 7.3. Padres y contacto

Fuentes: `padreController.js`, `Padres.jsx`.

Se registran nombres separados, dos apellidos obligatorios, comunidad y contacto. Se exige elegir al menos un canal; email necesita dirección y Telegram necesita DPI. Se normaliza el DPI quitando espacios y se rechazan coincidencias con otros registros, incluidos inactivos. El código no valida un formato de 13 dígitos ni acredita la identidad del titular del DPI.

Si el padre nuevo seleccionó email, el controlador inicia una bienvenida de forma asíncrona sin condicionar la creación a su resultado. Editar los datos no vuelve a enviar automáticamente bienvenida. La página permite búsquedas por nombre, paginación local de 20 elementos y consultar estado de vinculación Telegram.

La revocación de Telegram está reservada a `admin`; borra `telegramChatId`, pero conserva DPI y método de contacto para permitir nueva vinculación. Cambiar comunidad del padre no propaga automáticamente cambios a los niños.

### 7.4. Niños y herencia de comunidad

Fuentes: `ninoController.js`, `Ninos.jsx`, `carnetService.js`.

La ficha contiene nombres, apellidos, fecha de nacimiento, sexo, comunidad y un arreglo de padres/tutores. El nombre completo se reconstruye al guardar. La pantalla permite buscar padres existentes y añadirlos al arreglo.

La **herencia de comunidad es una ayuda del frontend**: al agregar el primer padre, si todavía no se eligió comunidad y el padre tiene una, se completa el campo. No sobrescribe una comunidad ya seleccionada, no sincroniza cambios futuros y el backend guarda la comunidad enviada sin derivarla nuevamente de los padres.

El alta por API genera código, PIN y URL del carnet. La pantalla ofrece expediente interno, diálogo de QR, envío por Telegram e impresión con `window.print()`. La búsqueda y paginación de 20 niños se hacen en el navegador. La edad mostrada en pantalla usa meses de calendario; no es exactamente el mismo cálculo de meses promedio utilizado por OMS.

### 7.5. Catálogo y aplicación de vacunas

Fuentes: `vacunaController.js`, `vacunacionController.js`, `utils/calculos.js`, `Vacunas.jsx`, `Vacunacion.jsx`.

El catálogo define rango de edad en años, volumen, número total de dosis e intervalo. El controlador fuerza intervalo cero para dosis única y exige un intervalo positivo para esquemas de más de una dosis. El rango es una recomendación y un filtro usado en reportes; el endpoint que registra aplicaciones **no valida que la edad del niño esté dentro de él**.

Al registrar una aplicación:

1. Se consulta la vacuna del catálogo.
2. Se cuentan aplicaciones activas del mismo niño y vacuna.
3. Se asigna `numeroDosis = cantidadActiva + 1`.
4. Se rechaza la operación si excede las dosis del esquema.
5. Si faltan dosis, se suma el intervalo a `fechaAplicada`: días con `setDate`, semanas como siete días por unidad y meses con `setMonth`.
6. Se guarda la aplicación y se ejecuta el análisis de alertas del niño.

El resumen agrupa solo vacunas que ya tienen aplicaciones, cuenta dosis y usa la de mayor `numeroDosis` para la próxima fecha. Presenta `completa` si alcanza el total, `atrasada` si la próxima fecha ya pasó y `al_dia` en los demás casos. No significa que un niño tenga todo el catálogo completo.

**Límites reales:** registrar la siguiente dosis no limpia `proximaDosis` de aplicaciones anteriores; eliminar una aplicación no renumera las restantes ni recalcula alertas inmediatamente. No hay índice único niño/vacuna/número ni operación transaccional para asignar el número. Tampoco se verifica explícitamente en ese controlador la existencia/estado activo del niño, el estado activo de la vacuna, la separación mínima real entre aplicaciones o fechas futuras. Las refs y el formato Date del esquema no sustituyen esas comprobaciones.

### 7.6. Crecimiento, puntajes Z y percentiles

Fuentes: [omsService.js](backend/services/omsService.js), `crecimientoController.js`, `Crecimiento.jsx` y [nota de tablas OMS](backend/data/oms/README.md).

El servicio lee y almacena en caché seis tablas locales de peso/edad, talla/edad e IMC/edad. La nota del repositorio atribuye su procedencia a `WorldHealthOrganization/anthro` y `WorldHealthOrganization/anthroplus`. No consulta una API externa durante el cálculo.

| Referencia usada por el código | Selección y límites |
| --- | --- |
| OMS 2006 | Edad exacta menor de 60 meses; consulta diaria por sexo y días de edad. |
| OMS 2007, peso | Desde 60 hasta 120 meses incluidos; interpola L/M/S entre meses adyacentes. |
| OMS 2007, talla e IMC | Desde 60 hasta 228 meses incluidos; interpola L/M/S entre meses adyacentes. |
| Fuera de cobertura | Indicadores sin referencia se devuelven como `null` y estados correspondientes como `sin_datos`. |

Los archivos 2006 contienen edades diarias de 0 a 1826 para ambos sexos; los 2007 incluyen un mes adicional respecto al límite de evaluación del servicio. El lector usa las primeras cinco columnas; no incorpora la columna adicional `loh` de algunas tablas como dato de entrada clínica.

Las fórmulas implementadas son:

```text
edadDíasExacta = (fechaMedición - fechaNacimiento) / 86 400 000
edadMesesExacta = edadDíasExacta / 30.4375
IMC = pesoKg / (tallaCm / 100)²
Z = ((valor / M)^L - 1) / (L × S), cuando L no es aproximadamente cero
Z = ln(valor / M) / S, cuando L es aproximadamente cero
percentil = 100 × Φ(Z)
```

Para peso e IMC se ajustan extremos más allá de ±3 Z utilizando distancias entre valores de 2 y 3 desviaciones; talla no aplica ese ajuste. Z se redondea a tres decimales. El percentil usa una aproximación de la función error, se limita a **0.1–99.9** y se redondea a un decimal.

El estado nutricional se clasifica por **Z de IMC para la edad**, no por percentil de peso:

| Condición sobre Z de IMC | Menor de 60 meses | Desde 60 meses |
| --- | --- | --- |
| Z < -3 | `desnutricion_severa` | `delgadez_severa` |
| -3 ≤ Z < -2 | `desnutricion` | `delgadez` |
| -2 ≤ Z ≤ 1 | `normal` | `normal` |
| 1 < Z ≤ 2 | `riesgo_sobrepeso` | `sobrepeso` |
| 2 < Z ≤ 3 | `sobrepeso` | `obesidad` |
| Z > 3 | `obesidad` | `obesidad` |
| Sin Z | `sin_datos` | `sin_datos` |

Talla se clasifica como `talla_baja_severa` si Z < -3, `talla_baja` si -3 ≤ Z < -2, `normal` si -2 ≤ Z ≤ 2 y `talla_alta` si Z > 2.

La API valida peso/talla positivos y finitos, fechas válidas, medición no anterior al nacimiento y sexo reconocido. No implementa un rechazo general de fechas de medición futuras. El alta comprueba existencia del niño; la edición exige además que niño y registro estén activos.

La interfaz convierte kg/libras con factor `2.20462`, pero persiste kg y cm. Muestra historial, IMC, estados y tres curvas Recharts con P3, P15, P50, P85 y P97. Las referencias se generan por meses; los puntos del paciente usan edad exacta almacenada. El rango visible considera edades registradas y edad actual, con margen, y respeta los límites de cada indicador.

`utils/calculos.js` conserva funciones antiguas de percentil aproximado; los controladores actuales de crecimiento usan `omsService.js`. Asimismo, `frontend/src/utils/percentiles.js` conserva etiquetas antiguas basadas en percentil, pero Crecimiento y Expediente utilizan las etiquetas de estados OMS calculados por el backend.

El script `recalcularCrecimientoOms.js` recorre mediciones activas, recalcula con datos del niño y cuenta actualizadas/omitidas; no ejecuta automáticamente el motor de alertas. Editar fecha de nacimiento o sexo de un niño tampoco recalcula por sí solo sus mediciones históricas.

### 7.7. Motor de alertas automáticas

Fuentes: [motorAlertas.js](backend/utils/motorAlertas.js), [alertaScheduler.js](backend/services/alertaScheduler.js) y `alertaController.js`.

Se ejecuta al crear/editar una medición, registrar una aplicación de vacuna, solicitar análisis global y desde el scheduler. El scheduler programa un primer análisis **5 segundos después de iniciarse** y repite cada **24 horas**, sin una hora fija de calendario. Solo analiza niños activos.

| Motivo | Regla implementada | Tipo |
| --- | --- | --- |
| `desnutricion` | Última medición activa con desnutrición, desnutrición severa, delgadez o delgadez severa. | Crítica |
| `sobrepeso` | Última medición con riesgo de sobrepeso o sobrepeso. | Preventiva |
| `sobrepeso` | Última medición con obesidad. | Crítica |
| `sin_registros` | Sin mediciones o última medición anterior a un mes promedio si edad <24 meses, o a tres meses promedio en el resto. | Preventiva |
| `vacuna_proxima` | Alguna aplicación activa tiene próxima dosis durante mañana, según límites UTC. | Preventiva |
| `vacuna_atrasada` | Alguna aplicación activa tiene próxima dosis anterior al inicio de hoy UTC. | Preventiva |

El intervalo de tres meses se aplica a **todos los niños desde 24 meses**, sin tope de cinco años en el motor. La talla baja no genera por sí sola un motivo de alerta en las reglas actuales. Una dosis programada para hoy no activa ni el recordatorio de mañana ni el atraso anterior a hoy.

Por cada niño y motivo, el motor busca una alerta con `activo=true`, independientemente de `atendida`. Si no existe y la condición se cumple, la crea y notifica. Si existe, actualiza tipo/mensaje cuando cambian; no vuelve a notificar automáticamente. Si la condición desaparece, desactiva todas las alertas activas de ese motivo. No hay índice único de niño/motivo.

Marcar atendida representa atención del personal, no desaparición de la condición. Mientras siga activa, impide una nueva alerta del mismo motivo. Si se elimina lógicamente una alerta y la condición persiste, un análisis posterior puede crear otra.

**Particularidad de vacunación:** el motor busca fechas pendientes en cualquier aplicación activa, sin agrupar por la última dosis de cada vacuna ni comprobar que el esquema ya terminó. Una fecha antigua puede seguir provocando una alerta aunque se haya aplicado una dosis posterior. El dashboard comparte esta forma de detectar atraso; campañas y resumen individual utilizan otras selecciones.

La pantalla permite filtrar por niño/tipo, atender, eliminar según rol, analizar y notificar. “Resolver” navega a crecimiento o vacunación con `?nino=<id>` para cargar ese paciente; no modifica por sí mismo la alerta.

### 7.8. Dashboard y definición de métricas

Fuentes: `dashboardController.js`, `Dashboard.jsx`.

| Respuesta | Contenido / cálculo |
| --- | --- |
| `totales` | Niños, comunidades y padres activos; aplicaciones activas; alertas activas no atendidas y críticas. |
| `porSexo` | Niños/niñas activos según `M`/`F`. |
| `estadoNutricional` | Clasificación de la última medición activa por niño; agrupa delgadez con desnutrición y riesgo de sobrepeso con sobrepeso. |
| `coberturaVacunacion` | Niños sin aplicaciones (`sinEsquema`), con alguna próxima dosis vencida (`atrasados`) y los restantes con aplicaciones (`alDia`). |
| `totales.ninosVacunados` | `alDia + atrasados`: niños con al menos una aplicación activa. |
| `totales.coberturaVacunacion` | Porcentaje entero de niños activos con alguna aplicación; **no porcentaje con esquema completo**. |
| `actividadPeriodo` | Dosis aplicadas y alertas todavía activas generadas desde el inicio del período seleccionado. |
| `ninosPorComunidad` / `ninosPorUbicacion` | Agregaciones territoriales; la segunda exige comunidad activa. |
| `alertasPorTipo` / `alertasPorMotivo` | Conteos de alertas activas no atendidas. |
| `ninosConAlertasCriticas` | Hasta diez alertas críticas pobladas con nombre del niño; no deduplica por paciente. |

`mes` inicia el primer día del mes actual; `3meses` incluye el actual y dos anteriores; `6meses`, el actual y cinco anteriores; `todo` no aplica fecha inicial. El período afecta únicamente la actividad, siempre dentro del conjunto de niños seleccionado.

Los filtros generales de departamento, municipio, comunidad (nombre exacto, no ObjectId), sexo y edad se aplican en el backend a todas las métricas y distribuciones. Los filtros geográficos resuelven comunidades activas. La edad se calcula con un año promedio de 365.2425 días: mínimo incluido y máximo menor que `edadMax + 1` (0–5 incluye hasta antes de cumplir seis años). Se admiten números no negativos, incluidos decimales; valores vacíos se omiten. Sexo inválido, edades no finitas/negativas, rango invertido o filtros no escalares devuelven 400.

Con filtros de población, padres y comunidades cuentan entidades activas vinculadas a los niños seleccionados, sin duplicarlas; sin esos filtros conservan los conteos globales activos, incluso entidades sin niños. Sin filtro geográfico se mantienen todos los niños activos, como antes. Las dosis y alertas se restringen siempre a los niños del conjunto: registros de niños inactivos o referencias huérfanas ya no inflan esos conteos. Esta precisión puede modificar totales históricos frente a la implementación anterior si existen dichos registros.

La barra permite preparar filtros y aplicarlos juntos, muestra el resumen de la selección aplicada y ofrece Limpiar para volver a la vista general con actividad del mes. Cambiar selectores no altera las cifras hasta aplicar; el gráfico territorial agrupa la respuesta ya filtrada. Las opciones de comunidades se obtienen del catálogo, independientemente de las coincidencias del dashboard.

### 7.9. Notificaciones por Telegram y Brevo

Fuentes: `telegramBot.js`, `telegramService.js`, `emailService.js`, `notificacionController.js` y el motor de alertas.

**Vinculación Telegram:** el backend consulta `getUpdates` con `timeout=10`; tras cada consulta espera 3 segundos para repetir. Conserva `offset` y chats que esperan DPI en memoria. Al recibir `/start`, comprueba si el chat ya está asociado a un padre activo; si no, pide DPI. Busca un padre activo con ese DPI y Telegram seleccionado. Impide reemplazar un chat distinto ya vinculado y asociar un chat usado por otro padre activo. Al confirmar, guarda el chat y envía un mensaje de éxito. No usa webhook, OTP adicional ni verificación documental del DPI.

**Envío Telegram:** `sendMessage` utiliza HTML. Para el QR, `sendPhoto` convierte base64 en PNG y lo envía como multipart con `FormData`/`Blob`. No se ha instalado una librería bot: las llamadas usan `fetch` nativo.

**Correo Brevo:** `emailService.js` hace POST a `https://api.brevo.com/v3/smtp/email` con encabezado `api-key`, remitente configurado, destinatario, asunto y HTML. Ofrece plantillas de bienvenida, alerta/recordatorio, recuperación, verificación inicial y campaña. Escapa el contenido variable en las plantillas HTML. La ausencia de clave o remitente devuelve un resultado fallido.

En alertas, cada padre puede recibir ambos canales si los seleccionó y tiene sus datos. El motor verifica notificaciones ya enviadas por alerta/padre/canal al enviar una alerta nueva. El endpoint manual permite repetir envíos y no aplica esa deduplicación. El éxito significa aceptación por la API externa; no confirma lectura o entrega final al destinatario.

Cada intento de alerta/campaña crea una `Notificacion` `enviada` o `fallida`. No existe cola persistente, webhook de estados ni reintento automático de fallas de una alerta ya creada. Las rutas de alertas y carnet recorren los padres asociados sin filtrar explícitamente `padre.activo`; campañas sí exige padres activos.

### 7.10. Carnet QR y expediente portátil

Fuentes: `carnetService.js`, `carnetController.js`, `Ninos.jsx`, `ConsultarCarnet.jsx`, `Expediente.jsx`.

El servicio produce un código `CS-` seguido de un entero aleatorio entre 1000 y 9999, y un PIN independiente de cuatro dígitos con `crypto.randomInt`. Verifica la disponibilidad del código hasta 100 intentos; el índice único también protege la persistencia. El espacio de códigos tiene 9000 combinaciones, incluidas las ocupadas por niños inactivos.

`codigoQR` guarda `<origenFrontend>/carnet/<codigoCarnet>`. El origen procede primero de `FRONTEND_URL`, luego de encabezados de proxy/host y protocolo; si el puerto inferido coincide con el backend lo cambia a `5173`, y sin host usa localhost. La imagen se crea al solicitar generación/envío con `QRCode.toDataURL`; no se persiste como imagen en `Nino`.

Generar nuevamente conserva código y PIN si ya existen y actualiza la URL. El envío Telegram remite enlace, código, PIN y QR; su contador `enviados` depende del resultado de enviar la fotografía. No hay envío de carnet por email ni endpoint de rotación de PIN.

`armarExpediente` construye una respuesta compartida por la consulta interna y pública:

| Sección | Datos |
| --- | --- |
| `nino` | `_id`, nombre completo, nacimiento, sexo, nombre de comunidad y nombres de padres. |
| `padres` | Arreglo de nombres; no DPI, correo ni teléfono. |
| `vacunas` | Agrupación de aplicaciones activas, fechas, dosis aplicadas/total, próxima dosis y estado `Completa`/`En progreso`. |
| `crecimiento` | Mediciones activas en orden descendente, datos antropométricos, Z, percentiles, estados y referencia. |
| `alertasActivas` | Alertas activas no atendidas con tipo, motivo, mensaje y fecha. |

El expediente público no devuelve PIN ni código QR. Usa un niño activo y compara el PIN por igualdad estricta de strings. No crea sesión de padre ni JWT adicional. El frontend conserva la respuesta en memoria y permite consultar otro carnet e imprimir. El componente compartido filtra crecimiento por todo, tres meses, un año o tres años; no ofrece edición desde la consulta pública. La portabilidad consiste en el acceso web/impresión, no en almacenamiento sin conexión dentro del QR.

### 7.11. Campañas comunitarias

Fuentes: `campanaController.js`, `Campanas.jsx`.

Una campaña define mensaje, fecha, tipo, alcance territorial y filtros opcionales de edad y vacunación. El estado temporal se calcula con la fecha actual de Guatemala; la entrada `YYYY-MM-DD` se normaliza a mediodía UTC. El frontend limita la fecha mínima de campañas nuevas, pero el controlador no impone que sea futura.

Para obtener destinatarios se buscan primero comunidades activas del departamento, luego municipio cuando corresponde y comunidad específica si se eligió ese alcance. A continuación se obtienen padres activos de esas comunidades con algún canal configurado y niños activos de ese territorio.

La edad se calcula con un año promedio de `365.2425` días. El máximo incluye todo el año indicado: edad < máximo + 1. Si hay filtros médicos, solo entran padres vinculados a al menos un niño coincidente y que también pertenezcan al territorio. Sin filtros de edad/estado, entran los padres contactables del territorio aunque no tengan niños asociados. La situación vacunal se calcula tomando la mayor dosis por vacuna, con fecha como desempate; sin aplicaciones es `sin_esquema`.

Se deduplican correos en minúsculas y chats por identificador. Un mismo padre puede producir dos envíos, uno por canal. La vista previa muestra conteos antes del envío. El controlador envía en lotes de cinco intentos concurrentes, registra cada resultado y actualiza contadores.

Si al menos un envío tiene éxito, marca `notificacionEnviada=true` y bloquea nuevas ediciones/envíos de esa campaña; esto ocurre incluso si hubo fallas parciales. Si todos fallan devuelve `502` y puede volver a intentarse. La fecha de realización no programa un envío automático: el envío se inicia mediante la acción del usuario.

### 7.12. Reportes PDF y Excel

Fuentes: `reporteService.js`, `reporteController.js`, `Reportes.jsx`.

Los reportes filtran territorio y calculan datos de niños activos. Incluyen:

1. **Estado nutricional de los niños:** incluye todos los niños seleccionados, también normales y sin datos. El conteo histórico de riesgos usa la última medición activa; bajo peso cuando Z de peso < -2 y/o clasificación nutricional de riesgo. Puede combinar ambas etiquetas.
2. **Vacunas incompletas:** compara vacunas activas cuyo rango en años incluye la edad actual con las aplicaciones activas; incluye vacunas sin iniciar que no aparecen en el resumen individual de aplicaciones.
3. **Cobertura por comunidad:** dosis aplicadas, limitadas al total requerido por cada vacuna, divididas entre dosis requeridas del catálogo aplicable ×100. También cuenta niños que completaron todas las vacunas aplicables. Sin vacunas aplicables la cobertura es `null`.
4. **Crecimiento promedio:** usa la última medición activa de cada niño; promedia peso, talla e IMC por comunidad con departamento y municipio. No estandariza esos promedios por edad/sexo.

El PDF contiene resumen y tablas en A4 horizontal, con encabezados y saltos de página. El Excel general crea cinco hojas: Resumen, Estado nutricional, Vacunas incompletas, Cobertura y Crecimiento promedio. Las exportaciones personalizadas crean únicamente las hojas elegidas, con encabezados, filtros impresos y filas iniciales congeladas. Las descargas usan `Content-Disposition: attachment` y nombre `reporte-sccvi-YYYY-MM-DD`.

El frontend conserva los filtros aplicados para exportar con ellos. El reporte se vuelve a calcular al descargar: no es una instantánea congelada de los datos que antes se mostraron. El conteo `vacunasIncompletas` corresponde a pares niño/vacuna, no necesariamente a niños distintos.

### 7.12.1. Constructor de reportes personalizables

Las rutas GET existentes se conservan y se añade `GET /api/reportes/conteo`, con la misma autorización admin/encargado. No cambia ningún modelo ni se agregan dependencias. `reporteOpciones.js` valida el contrato y `reporteTablas.js` construye una definición compartida de tablas para PDF y Excel.

| Parámetro query | Contrato |
| --- | --- |
| `departamento`, `municipio`, `comunidad` | Cadenas exactas opcionales; comunidad es nombre, no ObjectId. Solo comunidades activas. |
| `sexo` | `M`, `F` o vacío (todos). |
| `edadMin`, `edadMax` | Números no negativos opcionales, incluidos decimales; año promedio de 365.2425 días. Mínimo incluido y edad estrictamente menor que máximo + 1. |
| `estadoNutricional` | Lista separada por comas o parámetros repetidos. Opciones: `normal`, `desnutricion`, `riesgo_sobrepeso`, `sobrepeso`, `obesidad`, `sin_datos`. Vacío significa todos. |
| `resumenCantidades`, `listadoNutricional`, `vacunasIncompletas`, `coberturaVacunacion`, `crecimientoPromedio` | Booleanos `true`/`false`; omitidos equivalen a `true`. Al menos una sección. |
| `modo` | `cantidades`, `detalle`, `ambos`. En configuración personalizada el predeterminado es `ambos`. |
| `agrupacion` | `general`, `porComunidad`, `porSexo`, `porEstadoNutricional`; predeterminado personalizado `general`. |
| `col_nombre`, `col_edad`, `col_sexo`, `col_comunidad`, `col_peso`, `col_talla`, `col_clasificacionNutricional`, `col_vacunacion` | Booleanos de columnas; omitidos equivalen a `true`. El prefijo evita colisión con filtros `sexo` y `comunidad`. Si hay detalle debe quedar al menos una columna, salvo que solo se pida resumen. |
| `general=true` | Restaura el reporte completo con todas sus secciones y columnas habituales, manteniendo los filtros de población. También es el comportamiento cuando no se envían opciones de presentación. |

El estado se toma de la última medición activa por fecha. El filtro `desnutricion` incluye desnutrición/delgadez y ambas variantes severas; el detalle conserva la etiqueta específica. Un niño sin medición o con estado sin datos se agrupa en `sin_datos`. Los filtros se combinan con AND y los estados seleccionados entre sí con OR. El conjunto resultante se usa para todas las secciones. Con filtros de sexo/edad/estado, el reporte general solo conserva las comunidades vinculadas; sin ellos conserva comunidades activas vacías como antes.

`cantidades` devuelve solo grupos y métricas, sin filas individuales ni nombres. `detalle` incluye filas por niño con las columnas elegidas. `ambos` produce ambas tablas por sección; en Excel van dentro de la misma hoja. El resumen de cantidades siempre es agregado, incluso en modo detalle. La sección nutricional incluye todos los niños coincidentes; vacunas incompletas incluye solo niños con vacunas pendientes (una fila por niño, descripción en la columna Vacunación); crecimiento detallado incluye solo niños con medición. La cobertura detallada usa el mismo estado vacunal por niño. Los promedios personalizados excluyen valores faltantes de cada indicador.

Las cantidades de vacunas pendientes distinguen niños con pendientes de pares niño/vacuna. La cobertura sigue siendo dosis aplicadas, limitadas a las requeridas, sobre dosis requeridas del catálogo aplicable por edad. Sin dosis requeridas no hay porcentaje. Agrupar por estado conserva por separado riesgo de sobrepeso, sobrepeso y obesidad.

La respuesta JSON personalizada contiene `generadoEn`, `filtros`, `opciones`, `coincidencias` y `tablas`; cada tabla declara sección, título, tipo, columnas y filas proyectadas solo a esas columnas. La respuesta general conserva los campos históricos y añade `listadoNutricional` y `tablas`. El conteo devuelve únicamente `{ ninos: número }` y no carga catálogo de vacunas/aplicaciones. No es una instantánea: cambios concurrentes en datos pueden modificar el resultado al exportar.

La pantalla abre el constructor desde Crear / Exportar reporte, hereda la localidad aplicada y permite modificar población, secciones, presentación y columnas. El conteo se actualiza tras una pausa de 350 ms y cancela solicitudes anteriores. Se bloquea exportar mientras el conteo está pendiente/falla o la selección es inválida. Cero coincidencias permite exportar un archivo vacío identificado como tal. PDF imprime los filtros en cada página y Excel en cada hoja. Errores de opciones responden 400, también en descargas.

Ejemplo de cantidades por sexo, solo nutrición: `/api/reportes/pdf?modo=cantidades&agrupacion=porSexo&estadoNutricional=normal,obesidad&resumenCantidades=false&listadoNutricional=true&vacunasIncompletas=false&coberturaVacunacion=false&crecimientoPromedio=false`.

### 7.13. Navegación, componentes y presentación

Fuente: `frontend/src/App.jsx`, `main.jsx`, `components/` y `context/`.

| Ruta de frontend | Página / acceso |
| --- | --- |
| `/login` | Login, configuración inicial, verificación y recuperación. Usuario ya autenticado pasa a `/inicio`. |
| `/consultar` | Consulta pública con código y PIN. |
| `/carnet/:codigo` | Consulta pública con código precargado desde QR; solicita PIN. |
| `/inicio` | Bienvenida; cualquier usuario autenticado. |
| `/dashboard` | Dashboard; admin/encargado. |
| `/comunidades` | Gestión territorial; todos los usuarios, acciones según rol. |
| `/padres` | Contactos/tutores; todos los usuarios, acciones según rol. |
| `/ninos` | Pacientes, expediente y carnet; todos los usuarios. |
| `/vacunas` | Mantenimiento del catálogo; admin/encargado. |
| `/crecimiento` | Historial, registro, edición y curvas; todos los usuarios. |
| `/vacunacion` | Resumen y aplicaciones; todos los usuarios. |
| `/alertas` | Seguimiento de alertas; todos los usuarios, acciones según rol. |
| `/campanas` | Consulta para todos; gestión admin/encargado. |
| `/reportes` | Reportes y exportaciones; admin/encargado. |
| `/usuarios` | Administración de cuentas; admin. |
| `/` y rutas desconocidas | Redirigen según existencia de sesión hacia inicio o login. |

`Layout` proporciona menú lateral responsive, barra superior, datos del usuario, cambio de tema y cierre de sesión. `ThemeContext` alterna claro/oscuro en memoria y comienza en claro; no persiste el tema. `DialogoConfirmacion` muestra datos antes de guardar y destaca diferencias al editar. `DialogoEliminar` confirma la ocultación lógica. `Expediente` es compartido por personal y padres. Los estilos combinan Material UI y CSS global; las imágenes de marca se sirven como recursos estáticos.

## 8. Funcionalidades destacadas

| Funcionalidad | Valor funcional | Alcance exacto |
| --- | --- | --- |
| Alertas automáticas | Ayuda a priorizar seguimiento nutricional, controles y próximas vacunas. | Al registrar/editar crecimiento, aplicar vacuna, analizar manualmente y cada 24 horas desde el proceso. |
| Telegram vinculado por DPI | Permite contactar a padres/tutores desde el registro existente. | `/start`, DPI, asociación de chat y revocación administrativa; no acredita por sí solo identidad documental. |
| Email con Brevo | Bienvenidas, recordatorios, alertas, campañas y códigos de cuenta. | API HTTP transaccional; se registra resultado de alertas/campañas, no lectura del mensaje. |
| Carnet QR con código/PIN | Facilita consultar e imprimir el expediente desde otro dispositivo. | URL pública con PIN; expediente obtenido de la API en cada consulta. |
| Cálculo de crecimiento | Seguimiento por edad y sexo con Z y percentiles. | Tablas LMS locales y límites etarios de cada indicador. |
| Seguridad de sesión | Reduce persistencia del acceso en el navegador compartido. | Token en `sessionStorage` y cierre tras 30 minutos sin actividad reconocida; JWT conserva su vencimiento propio. |
| Campañas segmentadas | Avisos por ubicación, edad y situación vacunal. | Vista previa, deduplicación por canal, envío manual y contadores. |
| Reportes exportables | Facilita revisión académica y operativa por territorio. | PDF y Excel generados por backend; definición de cobertura distinta del dashboard. |

## 9. Flujos principales

### 9.1. Inicio de sesión del personal

1. El navegador abre `/login`; `Login.jsx` consulta `/api/auth/estado-inicial` para decidir si muestra login, creación inicial o verificación pendiente.
2. En una instalación ya configurada, el usuario introduce email y contraseña.
3. `AuthContext.login` envía POST `/api/auth/login`; el limitador controla intentos fallidos por IP.
4. El controlador normaliza email, busca un usuario activo y compara bcrypt. Si falla, responde `401`.
5. Si las credenciales son válidas, devuelve JWT de siete días y datos básicos del usuario.
6. El frontend guarda solo el token en `sessionStorage`, mantiene el usuario en contexto y navega a `/inicio`.
7. Axios adjunta Bearer a las siguientes solicitudes. El backend valida token, estado y rol actuales para cada acceso.
8. Al recargar, se consulta `/api/auth/perfil` para reconstruir el contexto. Al cerrar sesión o cumplir 30 minutos de inactividad, se borra el token local y se abandona la zona privada.

Si no existe ninguna cuenta, antes del paso 2 se crea el administrador inicial, se recibe el código por correo y se verifica; la respuesta de verificación permite regresar al login, no inicia sesión automáticamente.

### 9.2. Registrar un niño y obtener su carnet

1. El personal registra o selecciona una comunidad activa.
2. Registra al padre/tutor con comunidad y al menos un método de contacto. Si usará Telegram, el padre puede vincularse con `/start` y DPI; si eligió email se inicia el envío de bienvenida.
3. En Niños selecciona “Nuevo Niño”, completa nombres, apellidos, nacimiento y sexo y asocia padres existentes.
4. Si añade el primer padre sin haber seleccionado comunidad, el formulario toma la comunidad de ese padre. El personal puede elegirla explícitamente.
5. Tras la confirmación, envía POST `/api/ninos`. El backend genera `CS-####`, PIN de cuatro dígitos y URL, y guarda el niño con sus referencias.
6. Desde la acción Carnet QR, el frontend solicita GET `/api/carnet/generar/:ninoId`. El backend conserva/asegura credenciales y genera la imagen QR.
7. Se muestran código, PIN, imagen y enlace. El personal puede imprimirlos o solicitar POST `/api/carnet/enviar/:ninoId` para envío Telegram a los padres configurados.
8. El mismo listado permite consultar el expediente interno mediante JWT sin ingresar PIN.

La creación prepara credenciales/URL; la imagen QR se materializa al abrir o enviar el carnet. Guardar al niño por sí solo no envía automáticamente el carnet.

### 9.3. Medición que genera alerta y notifica al padre

1. El personal selecciona al niño en Crecimiento e introduce peso, talla y fecha. Si usa libras, el frontend convierte a kg.
2. Tras confirmar, envía POST `/api/crecimiento` con el identificador y los datos.
3. El backend obtiene nacimiento/sexo, valida la medición, calcula edad, IMC, Z, percentiles y clasificaciones y guarda `RegistroCrecimiento`.
4. Ejecuta `analizarNino`. Este selecciona la medición activa más reciente por fecha; una medición histórica recién insertada no reemplaza necesariamente a la utilizada para evaluar.
5. Si el estado de esa última medición corresponde, por ejemplo, a desnutrición y no existe alerta activa de ese motivo, crea una alerta crítica.
6. Obtiene los padres asociados y, según métodos seleccionados y datos disponibles, intenta Telegram, email o ambos.
7. Guarda una `Notificacion` por intento con `enviada`/`fallida`. Sin canales disponibles se conserva la alerta aunque no haya envíos.
8. La pantalla Alertas y el expediente muestran la alerta; el personal puede atenderla y registrar seguimiento. Una posterior evaluación normal desactiva la condición nutricional correspondiente.

Si ya había una alerta activa del mismo motivo, se actualiza cuando corresponde y no se notifica automáticamente otra vez. Las fallas de análisis se capturan en el controlador de crecimiento: no deshacen la medición guardada.

### 9.4. Padre que consulta carnet mediante código y PIN

1. El padre abre `/consultar`, o escanea el QR que abre `/carnet/CS-####` con el código precargado.
2. Introduce código si hace falta y PIN. El frontend requiere ambos valores no vacíos.
3. Envía POST `/api/carnet/ver/:codigo` con PIN como string; no necesita JWT.
4. El limitador controla intentos fallidos. El backend busca un niño activo con ese código y compara el PIN almacenado.
5. Si son correctos, arma el expediente con datos básicos, padres, vacunas, mediciones y alertas pendientes. No expone contactos ni PIN en esa respuesta.
6. La página muestra el componente `Expediente`, permite cambiar el período del historial e imprimir con el navegador.
7. “Consultar otro carnet” limpia los datos y PIN; cuando la ruta trae código mantiene ese código. Recargar pierde la consulta en memoria y vuelve a solicitar los datos de acceso.

El backend distingue `404` por código inexistente y `401` por PIN incorrecto. **En la interfaz actual, el interceptor global de Axios redirige a `/login` ante cualquier `401`, incluido un PIN incorrecto**; por ello no siempre permanece visible el mensaje de error en la consulta pública.

## 10. Seguridad

### 10.1. Controles implementados

| Control | Implementación y alcance |
| --- | --- |
| Contraseñas | bcrypt con salt/costo 10; se recalcula el hash al modificar password y guardar. |
| Autenticación | JWT firmado con `JWT_SECRET`; vencimiento de siete días; Bearer en encabezado. |
| Autorización | Middleware de roles en rutas; lectura del usuario actual en MongoDB por petición. |
| Estado de cuenta | Usuario inexistente/inactivo produce `401` al intentar acceso protegido; no requiere esperar expiración del JWT. |
| Cambio de contraseña | Se rechazan tokens anteriores a `passwordChangedAt`. |
| Sesión del navegador | `sessionStorage` para token, eliminación de un token antiguo en `localStorage` al iniciar. |
| Inactividad | Temporizador de 30 minutos; se reinicia con `pointerdown`, `keydown`, `scroll`, `touchstart`. |
| Registro de personal | Limitado a admin, salvo configuración inicial sin usuarios. |
| Recuperación/verificación | Códigos aleatorios, hash SHA-256, comparación temporalmente segura, expiración, intentos y espera entre solicitudes. |
| Conservación de administrador | No se permite autodesactivación, cambio del propio rol o dejar sin último admin activo mediante los controladores normales. |
| Carnet público | Requiere código/PIN de niño activo y limita intentos por IP. |
| Campos modificables | Controladores de padre/niño permiten solo campos explícitos; no aceptan escribir chat, PIN o estado por la edición ordinaria. |
| Telegram | Comprobación de asociación existente y revocación reservada a admin. |
| Duplicados | Índices únicos para email, código de carnet y ubicación/nombre de comunidad; DPI se verifica a nivel de aplicación. |
| Secretos de configuración | `.env` excluidos por `.gitignore`; integraciones y JWT usan variables del backend. |

### 10.2. Límites de solicitudes

Fuente: [rateLimitMiddleware.js](backend/middleware/rateLimitMiddleware.js). Todos usan una ventana de **15 minutos**, el almacén predeterminado en memoria y respuesta JSON `429`. No se ha configurado una clave distinta de la identificación por IP de la biblioteca.

| Acción | Máximo por ventana | Qué se cuenta |
| --- | --- | --- |
| Login | 10 | Se omiten solicitudes exitosas. |
| Solicitar recuperación | 3 | Todas las solicitudes. |
| Restablecer contraseña | 5 | Todas las solicitudes. |
| Consultar carnet | 10 | Se omiten solicitudes exitosas. |
| Crear administrador inicial | 3 | Todas las solicitudes. |
| Verificar administrador inicial | 5 | Todas las solicitudes. |
| Reenviar verificación inicial | 3 | Todas las solicitudes. |

Los contadores de cinco intentos del código guardados en `Usuario` son adicionales a estos límites por IP. Los límites en memoria se reinician con el proceso y no se comparten automáticamente entre instancias.

### 10.3. Sesión y alcance de la revocación

El cierre de sesión elimina el token del navegador; no hay endpoint de logout, lista de revocación ni refresh token. La inactividad se mide en el frontend y no revoca el JWT en el servidor. Un token copiado sigue siendo utilizable hasta expirar, cambiar contraseña o quedar inactiva la cuenta. React vuelve a verificar perfil al cargar, pero no consulta periódicamente su estado sin solicitudes.

`sessionStorage` limita la persistencia a la sesión de la pestaña según el navegador y continúa siendo accesible desde JavaScript. La aplicación no usa cookies HttpOnly para autenticarse. Los permisos guardados en contexto pueden quedar visualmente desactualizados hasta recargar, aunque el backend usa el rol actual en cada petición.

### 10.4. Infraestructura y limitaciones observables

Estas precisiones son necesarias para no presentar como controles existentes funciones que el código no implementa:

- **MongoDB solo en localhost:** el README propone una URI de loopback, pero eso no demuestra que `mongod` esté enlazado únicamente a localhost. El repositorio no incluye configuración de red, autenticación MongoDB, firewall de la VM ni reglas de Azure que permitan confirmarlo.
- **Nginx, PM2 y HTTPS:** forman parte del escenario de despliegue indicado, pero no hay archivos que acrediten su configuración efectiva. Express no termina TLS ni restringe explícitamente su host de escucha.
- **CORS:** se usa `cors()` sin una lista de orígenes configurada; no está limitado al dominio del frontend en el código actual.
- **PIN del carnet:** se almacena y compara sin hash; aparece en las respuestas de generación y documentos de niño devueltos al personal. Código y PIN se transmiten juntos al enviar el carnet por Telegram. No hay vencimiento o rotación de PIN implementados.
- **Respuestas públicas:** la consulta del carnet distingue código inexistente y PIN incorrecto. La recuperación de contraseña sí usa respuesta genérica para cuentas inexistentes/activas.
- **Validación de relaciones:** un `ref` no comprueba automáticamente existencia, estado activo ni coherencia territorial. Las validaciones no son uniformes entre controladores; no hay transacciones ni cascadas para los cambios relacionados.
- **Desactivación:** conserva datos e historial, pero no revoca todas las relaciones. Por ejemplo, envíos de alertas/carnet no filtran explícitamente padres inactivos; algunas operaciones internas de carnet buscan al niño por ID sin exigir activo, aunque su consulta pública sí lo exige.
- **Bot Telegram:** conocer un DPI registrado puede permitir la primera vinculación. Las comprobaciones de DPI/chat no son índices únicos y su estado de conversación vive en memoria; no se implementa un segundo factor ni limitador específico del bot.
- **Auditoría:** existen timestamps y registros de notificaciones, pero no una bitácora general de accesos/cambios. Las aplicaciones de vacunas y mediciones no guardan al profesional que las registró.
- **Consistencia de alertas y métricas:** la conservación de próximas dosis históricas puede mantener atrasos; los cambios de datos personales y eliminaciones no recalculan todas las entidades derivadas de inmediato.

### 10.5. Guía de trazabilidad para mantenimiento

| Tema | Archivos principales que deben revisarse al actualizar esta documentación |
| --- | --- |
| Montaje de API y entorno | `backend/server.js`, `frontend/src/services/api.js`, ambos `package.json`. |
| Campos y relaciones | Todos los archivos de `backend/models/`. |
| Endpoints y permisos | Todos los archivos de `backend/routes/`, `backend/middleware/authMiddleware.js`. |
| Autenticación y sesiones | `authController.js`, `usuarioController.js`, `rateLimitMiddleware.js`, `AuthContext.jsx`, `Login.jsx`. |
| Crecimiento | `omsService.js`, `crecimientoController.js`, tablas de `backend/data/oms/`, `Crecimiento.jsx`. |
| Vacunación y alertas | `vacunacionController.js`, `utils/calculos.js`, `utils/motorAlertas.js`, `alertaScheduler.js`. |
| Integraciones | `emailService.js`, `telegramService.js`, `telegramBot.js`, `notificacionController.js`. |
| Carnet | `carnetService.js`, `carnetController.js`, `ConsultarCarnet.jsx`, `Expediente.jsx`, `Ninos.jsx`. |
| Campañas, métricas y reportes | `campanaController.js`, `dashboardController.js`, `reporteService.js`, `reporteController.js` y sus páginas React. |

La documentación describe el comportamiento encontrado mediante revisión estática; no acredita resultados de una ejecución contra la base de datos, servicios externos ni infraestructura de producción.
