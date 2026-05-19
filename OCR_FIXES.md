# OCR — Plan de correcciones

Registro de bugs detectados en el módulo OCR y su estado de resolución.
Diagnóstico basado en análisis de imágenes reales + consulta directa a la DB de Railway (2026-05-19).

---

## Issues

### 1. `dniEstado` falso positivo
**Estado:** ✅ Resuelto (2026-05-19)  
**Impacto:** Alto — afecta la mayoría de los remitos procesados  
**Síntoma:** `dniEstado: "si"` en documentos donde no hay DNI escrito a mano  
**Causa:** `hasLabeledContent()` en `vision.service.ts` encuentra la etiqueta impresa "D.N.I." y luego detecta números del CUIT (`30-71606971-7` contiene 8+ dígitos) como "contenido del campo", retornando `true` sin que haya ningún valor manuscrito.  
**Archivo:** `packages/ocr/src/vision/vision.service.ts` → función `hasLabeledContent()` + `detectRemitoPresence()`  
**Fix propuesto:** Subir el umbral mínimo de dígitos para DNI (≥6 dígitos consecutivos sin guiones, o usar la regex específica de DNI argentino `\d{7,8}`) y/o excluir números que tienen formato CUIT (`\d{2}-\d{8}-\d`) del análisis de contenido.

---

### 2. `cliente` extrae etiqueta del formulario en lugar del valor
**Estado:** ✅ Resuelto (2026-05-19)  
**Impacto:** Alto — hace inútil el campo cliente para esos remitos  
**Síntoma:** `cliente: "Condición I.V.A."` o `cliente: "C.U.I.T. Nº"` en lugar del nombre real  
**Causa:** Document AI no puede leer el campo destinatario (vacío, ilegible, o mala imagen) y extrae la etiqueta más cercana del formulario como valor.  
**Ejemplos en DB:** `da6ff7e3`, `9fd1958c`  
**Archivo:** `packages/ocr/src/vision/vision.parser.ts` → parseo del campo `cliente` / `vision.service.ts` → post-procesado de entidades  
**Fix propuesto:** Agregar un filtro post-extracción que invalide como `cliente` cualquier valor que matchee etiquetas conocidas del formulario (`/^(condici[oó]n\s+i\.?v\.?a\.?|c\.?u\.?i\.?t\.?\s*n[°o]?|ing\.?\s+brutos|localidad|domicilio)$/i`). Si matchea → dejar `cliente` vacío → validación lo marca como error.

---

### 3. `nroRemito` ≠ `nroMercaderia` (números distintos en el mismo doc)
**Estado:** ✅ Resuelto (2026-05-19)  
**Impacto:** Medio — inconsistencia que confunde al operador administrativo  
**Síntoma:** `nroRemito: "00024473"`, `nroMercaderia: "R0014-00024463"` (difieren en ~10 unidades)  
**Causa:** El parser toma el número del encabezado del remito para `nroRemito` y el número del box "MERCADERÍA RETIRADA DE PLANTA" para `nroMercaderia`. A veces son distintos porque hay dos copias del número en el documento o Document AI confunde cuál es cuál.  
**Ejemplos en DB:** `da6ff7e3`, `9fd1958c`  
**Archivo:** `packages/ocr/src/vision/vision.parser.ts` → `extractRemitoNumber()` + `vision.service.ts` → resolución de `nroMercaderia`  
**Fix propuesto:** Investigar cuál de los dos números es el canónico (probablemente el del box "MERCADERÍA RETIRADA DE PLANTA" → `nroMercaderia`). Derivar `nroRemito` desde `nroMercaderia` si hay conflicto, o agregar una validación que los compare y marque como error si difieren.

---

### 4. `fecha` toma la fecha de imprenta en lugar de la del remito
**Estado:** ✅ Resuelto (2026-05-19)  
**Impacto:** Medio — genera errores de validación por formato incorrecto  
**Síntoma:** `fecha: "impresión:\n23/10/2025"` — el parser captura "Fecha impresión: 23/10/2025" del pie de imprenta en lugar de la fecha real del remito  
**Causa:** El pie de la imprenta ("Fecha impresión: 11/12/2025") contiene una fecha en formato DD/MM/YYYY que el parser extrae antes de encontrar la fecha correcta del encabezado.  
**Archivo:** `packages/ocr/src/vision/vision.parser.ts` → `parseRemitoText()` → extracción de fecha  
**Fix propuesto:** Dar prioridad a la fecha en contexto de "FECHA:" del encabezado sobre cualquier fecha que aparezca junto a "impresión" o "Imprenta". Agregar exclusión: si la fecha candidata está precedida por "impresión" o "Vto", descartarla.

---

### 5. "ANULADO" diagonal no detectado por Document AI
**Estado:** ⬜ Pendiente  
**Impacto:** Medio — el sistema no marca documentos anulados automáticamente  
**Síntoma:** `observaciones: null` en remito con sello diagonal "ANULADO" claramente visible  
**Causa:** Document AI (modo procesador estructurado) no extrae texto que se superpone en diagonal sobre el contenido del formulario. El rawText que llega al regex `/\bANULAD[OA]\b/i` no contiene la palabra.  
**Fix propuesto:** Usar `documentTextDetection()` de Vision API como segunda pasada para detectar "ANULADO" cuando Document AI es el motor principal. O cambiar la estrategia: usar `textDetection` de Vision API como fallback específico para detección de sellos/stamps, independientemente de si Document AI fue el motor principal.  
**Nota:** Este es el fix más complejo — requiere una segunda llamada a la API por documento.

---

### 6. Remito rotado 90° — todos los campos fallan
**Estado:** ⬜ Pendiente  
**Impacto:** Bajo (problema operacional, no de código)  
**Síntoma:** Cuando el operador fotografía el remito de costado, Document AI no puede leer ningún campo correctamente  
**Causa:** Imagen rotada 90°. Document AI puede corregir orientación en modo `documentTextDetection` pero no siempre lo hace con procesadores custom.  
**Fix propuesto (técnico):** Leer los metadatos EXIF de la imagen antes de enviar a la API y rotar si `Orientation != 1`. Usar `sharp` (ya disponible en el ecosistema o agregar como dep).  
**Fix propuesto (operacional):** Instruir al operador que fotografíe el remito derecho. Agregar mensaje de error más claro cuando los campos clave son todos vacíos.

---

## Orden de ataque recomendado

| # | Issue | Dificultad | Impacto |
|---|-------|-----------|---------|
| 1 | `dniEstado` falso positivo | Baja | Alto |
| 2 | `cliente` = etiqueta del formulario | Baja | Alto |
| 3 | `fecha` de imprenta | Media | Medio |
| 4 | `nroRemito` ≠ `nroMercaderia` | Media | Medio |
| 5 | ANULADO diagonal | Alta | Medio |
| 6 | Imagen rotada | Alta | Bajo |

---

## Historial

| Fecha | Acción |
|-------|--------|
| 2026-05-19 | Diagnóstico completo en base a 3 imágenes reales + DB de Railway |
| 2026-05-19 | Migración `AddObservacionesToOcrDocuments` corregida (enum drops + observaciones column) |
| 2026-05-19 | Detección de "ANULADO" implementada en `processOcr()` (pendiente de validar con imagen diagonal) |
| 2026-05-19 | Fix #1: `hasActualDniContent()` reemplaza detección de DNI — busca solo en sección post-etiqueta, descarta CUITs |
| 2026-05-19 | Fix #2: `isFormLabel()` filtra valores inválidos en campo cliente (Condición I.V.A., C.U.I.T. Nº, etc.) |
| 2026-05-19 | Fix #3 (nroRemito): `nroMercaderia` ahora es fuente canónica — se extrae primero en ambos paths y se usa para derivar `ptoVenta`/`nroRemito` |
| 2026-05-19 | Fix #4 (fecha): Document AI path valida que `fecha` sea `DD/MM/YYYY`; valores con "impresión:" se descartan y el fallback regex los completa |
| 2026-05-19 | Fix #5 (dniEstado parser path): `detectRemitoPresenceFromText` ahora busca DNI solo en la sección post-etiqueta, descartando CUITs — igual que `hasActualDniContent` en Document AI path |
