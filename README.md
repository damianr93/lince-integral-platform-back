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

Ver `CONTEXT.md` en la raíz del proyecto para el panorama completo.
