# Ejercicios para desarrollador junior — lince-platform

Estos ejercicios están basados en código real del proyecto. Todos están en la rama `develop`.

**Reglas:**
- Trabajá siempre en `develop`, nunca en `main`
- Antes de empezar cada ejercicio, leé el TODO completo en el código
- Cuando termines, abrí una PR de `develop` → `main`
- Hacé type-check antes de la PR: `pnpm turbo run check-types --filter=@lince/crm`

---

## TODO-1 — Extraer magic number en analytics.service.ts
**Dificultad:** Fácil  
**Archivo:** `packages/crm/src/analytics/analytics.service.ts`  
**Buscá:** el comentario `TODO-1` al inicio del archivo

### Qué hay que hacer
El valor `1000 * 60 * 60 * 12` está hardcodeado como tiempo de vida del caché de errores geográficos. No queda claro qué representa ese número sin hacer la cuenta.

Extraelo a una constante con nombre **antes** de la clase, igual que ya se hizo en `geo.service.ts` con `ONE_HOUR_MS` y `ONE_DAY_MS` (miralo como referencia).

### Resultado esperado
```typescript
const TWELVE_HOURS_MS = 1_000 * 60 * 60 * 12;

// ...dentro de la clase:
private readonly geoFailureTtlMs = TWELVE_HOURS_MS;
```

---

## TODO-2 — Reemplazar console.error por Logger de NestJS
**Dificultad:** Fácil/Medio  
**Archivo:** `packages/crm/src/analytics/analytics.service.ts`  
**Buscá:** el comentario `TODO-2` al inicio del archivo

### Qué hay que hacer
El servicio tiene **11 llamadas a `console.error()`**. En NestJS esto es incorrecto: no respeta el sistema de logging, no incluye el contexto del servicio, y no se puede configurar por entorno.

Tenés que hacer tres cosas:
1. Agregar `Logger` al import de `@nestjs/common`
2. Declarar la propiedad `private readonly logger = new Logger(AnalyticsService.name)` en la clase
3. Reemplazar los 11 `console.error()` por `this.logger.error()`

Buscá cómo se usa en `MarketingService` o `CustomersService` para ver el patrón exacto.

### Resultado esperado
```typescript
// import
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

// propiedad de clase
private readonly logger = new Logger(AnalyticsService.name);

// en cada catch
this.logger.error('Error en AnalyticsService.totales:', err);
```

---

## TODO-3 — Magic numbers en validación de año
**Dificultad:** Fácil  
**Archivo:** `packages/crm/src/analytics/analytics.controller.ts`  
**Buscá:** el comentario `TODO-3` al inicio del archivo, y el método `parseYear()` más abajo

### Qué hay que hacer
El método `parseYear()` valida que el año esté entre `2000` y `2100`. Esos dos números están literales en el código sin explicar qué son ni por qué.

Definí dos constantes antes de la clase con nombres descriptivos y usalas en la condición.

### Resultado esperado
```typescript
const MIN_VALID_YEAR = 2000;
const MAX_VALID_YEAR = 2100;

// ...en parseYear():
if (!Number.isInteger(parsed) || parsed < MIN_VALID_YEAR || parsed > MAX_VALID_YEAR) {
```

---

## TODO-4 — Límites de consulta hardcodeados en marketing.service.ts
**Dificultad:** Fácil/Medio  
**Archivo:** `packages/crm/src/marketing/marketing.service.ts`  
**Buscá:** el comentario `TODO-4` cerca de las constantes `BATCH_SIZE` y `MAX_ATTEMPTS`

### Qué hay que hacer
En dos métodos del servicio hay llamadas a `.limit()` con números literales:
- `.limit(200)` en `getDirectMessages()`
- `.limit(500)` en `getLogs()`

Definí dos constantes junto a `BATCH_SIZE` y `MAX_ATTEMPTS` (que ya están bien definidas arriba) y reemplazá los literales.

### Resultado esperado
```typescript
const MAX_DIRECT_MESSAGES = 200;
const MAX_CAMPAIGN_LOGS   = 500;

// en getDirectMessages():
.limit(MAX_DIRECT_MESSAGES)

// en getLogs():
.limit(MAX_CAMPAIGN_LOGS)
```

---

## TODO-5 — Eliminar duplicación en resolución de asesores
**Dificultad:** Medio/Difícil  
**Archivos:**
- `packages/crm/src/follow-up/customer-follow-up.service.ts` → `resolveAssigneeEmail()`
- `packages/crm/src/marketing/marketing.service.ts` → `resolvePhoneNumberId()`  
**Buscá:** el comentario `TODO-5` antes del método `resolveAssigneeEmail`

### Qué hay que hacer
Hay dos funciones privadas en dos servicios distintos que mapean el mismo conjunto de asesores (EZEQUIEL, DENIS, MARTIN, JULIAN, SIN_ASIGNAR) a datos de configuración:

- `resolveAssigneeEmail()` → mapea asesor a **email** para notificaciones
- `resolvePhoneNumberId()` → mapea asesor a **ID de teléfono YCloud** para WhatsApp

Si se agrega un asesor nuevo (ya pasó antes — se agregó JULIAN), hay que acordarse de modificar los dos archivos.

**Tu tarea:**
1. Creá `packages/crm/src/utils/advisor.utils.ts`
2. Exportá una función (o lo que consideres más limpio) que centralice el mapeo de asesores. Pensá bien qué parámetros recibe y qué devuelve.
3. Reemplazá las implementaciones en ambos servicios por llamadas a la nueva función

**Cosas a tener en cuenta antes de unificar:**
- `resolveAssigneeEmail()` tiene lógica de fallback de emails (3 niveles de fallback) que `resolvePhoneNumberId()` no tiene. Analizá bien ambas.
- La nueva función va a necesitar acceso a `ConfigService`. ¿Cómo se lo pasás?
- Mirá `phone.utils.ts` para ver cómo exportamos utilidades en este proyecto

**No hay una única solución correcta.** Cuando termines, explicá en el PR por qué elegiste la API que elegiste.

---

## Orden recomendado

| # | Ejercicio | Tiempo estimado |
|---|-----------|----------------|
| 1 | TODO-1 magic number analytics | 15 min |
| 2 | TODO-3 magic numbers año | 15 min |
| 3 | TODO-4 límites marketing | 20 min |
| 4 | TODO-2 Logger en analytics | 30 min |
| 5 | TODO-5 unificar asesores | 1-2 hs |

Hacé los primeros cuatro en un solo commit, y el cinco en otro separado (es un cambio más grande que conviene revisar aparte).
