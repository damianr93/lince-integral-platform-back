# lince-platform — Backend Turborepo

Monorepo **solo backend** de la plataforma Lince. Contiene la API NestJS y los packages compartidos entre módulos.

El frontend vive en `../lince-web/` (repo separado, standalone).

## Estructura

```
apps/
  api/              NestJS — deploy en Railway
packages/
  types/            Contratos TS compartidos entre packages del backend
  database/         TypeORM, entidades base, conexión Postgres
  auth/             JWT, guards, decoradores de roles
  ui/               (reservado)
  crm/              Módulo CRM ✅
  conciliaciones/   Módulo conciliaciones bancarias ✅
```

## Requisitos

- Node 20+
- pnpm 9

## Comandos

```sh
pnpm install

# Levantar API en desarrollo (recarga automática)
pnpm --filter @lince/api dev

# Verificar tipos en todo el workspace
pnpm check-types

# Build completo
pnpm build
```

## Variables de entorno

Crear `apps/api/.env` copiando `apps/api/.env.example` y completando los valores reales.
Claves mínimas para levantar en dev: `DATABASE_URL`, `CRM_MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

## Deploy — Railway

El archivo `nixpacks.toml` en la raíz configura el build y start automáticamente.

Pasos:
1. Crear nuevo servicio en Railway apuntando a este repo.
2. En **Variables**, cargar todas las claves de `apps/api/.env.example` con valores reales de producción.
3. Agregar el plugin **PostgreSQL** de Railway — genera `DATABASE_URL` automáticamente.
4. En el primer deploy, setear `DB_SYNCHRONIZE=true` para crear las tablas; luego cambiar a `false`.
5. Setear `ALLOWED_ORIGINS` con el dominio de Netlify del frontend (ej: `https://lince.netlify.app`).

## Estado de avance

| Fecha      | Hecho |
|------------|-------|
| 2026-03-22 | Setup inicial: `apps/api`, `packages/types`, `packages/database`, `packages/auth` |
| 2026-03-22 | `packages/crm` completo + integrado en `apps/api` |
| 2026-03-22 | `packages/conciliaciones` completo (TypeORM, migrado de Prisma) + integrado |
| Pendiente  | `packages/ocr` |
| Pendiente  | Migraciones TypeORM para conciliaciones y OCR |
| Pendiente  | Panel SUPERADMIN de gestión de usuarios (API ya tiene los endpoints) |
| 2026-03-30 | Marketing: `POST /marketing/campaigns` acepta `waves` opcional; validación server-side (suma = destinatarios elegibles); wizard en `lince-web` con paso Oleadas |
| 2026-04-02 | Frontend `lince-web` (OCR): modo demo con datos ficticios post-OCR en Dashboard admin y en Facturas; marcas `DEMO-OCR-MOCK` en código para retirarlo cuando deje de usarse en ventas |
| 2026-04-06 | Conciliaciones: `getRun` carga extract/system/pending **sin** columna `raw` (TypeORM `select`); respuesta sin `...run` duplicando relaciones; Nixpacks runtime heap 3072 MB |
| 2026-04-07 | Política TAG: usuarios con `area=TAG` quedan restringidos a OCR remitos (redirigidos a `/ocr/remitos` y sin navegación general); backend bloquea módulos no OCR para TAG |
| 2026-04-22 | OCR: `apps/api/tsconfig.json` mapea `@lince/ocr` al `src`; migración enum `RETENCION` en Postgres; dashboard OCR en `lince-web` con pestaña Retenciones (misma IU que remitos/facturas) |
| 2026-04-28 | RRHH / asistencia: `GET /asistencia/logs` acepta `nombre` (tokens AND con ILIKE sobre nombre+apellido del empleado asociado); `lince-web` RRHH agrupa fichajes por día (AR), empareja entrada→siguiente salida y tooltip en entradas |
| 2026-04-28 | Asistencia logs: query `fecha=YYYY-MM-DD` filtra un día calendario en `America/Argentina/Buenos_Aires` (sin paginar por filas); RRHH navega por día y muestra hora en AR sin sufijo GMT |
| 2026-04-28 | RRHH: tabla por par entrada+salida mismo día, duración coloreada (verde si ≥8 h, rojo si menos); huérfanos en filas aparte |
| 2026-04-28 | RRHH: vista por empleado con suma de tramos del día (total en planta ≥8 h verde); sin columnas PIN/dispositivo; detalle de fichajes desplegable |
| 2026-04-28 | RRHH: agregación solo con fichajes cuyo instante cae en el día calendario AR elegido (evita mezclar días si la API devuelve outliers); aviso si hay registros descartados; navegación día anterior/siguiente anclada a AR |
| 2026-04-28 | RRHH (`lince-web`): botón «Editar horarios» abre modal con fecha/hora en Argentina (−03) y `PATCH` solo filas modificadas (`tiempo` ISO) |
| 2026-04-28 | Asistencia ADMS: `ASISTENCIA_ATTLOG_TIMESTR_IS_UTC` para ATTLOG sin zona (UTC vs -03); emparejamiento RRHH exige salida posterior a entrada |
| 2026-04-28 | API: CORS registrado vía `NestFactory.create({ cors })` para que el preflight OPTIONS no caiga en 404; orígenes `localhost` / `127.0.0.1` (cualquier puerto) siempre permitidos además de `ALLOWED_ORIGINS` (evita conflicto con `NODE_ENV=production` en `.env` local) |

Ver `CONTEXT.md` en la raíz del proyecto para el panorama completo.
