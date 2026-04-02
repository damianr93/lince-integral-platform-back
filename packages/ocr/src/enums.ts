/**
 * Enums del módulo OCR
 *
 * OcrRole    — Roles específicos dentro del módulo OCR (almacenados en modules.ocr.role)
 * DocumentType   — Tipo de documento gestionado
 * DocumentStatus — Ciclo de vida completo de un documento OCR
 */

export enum OcrRole {
  OPERADOR_CAMPO  = 'OPERADOR_CAMPO',   // Solo sube remitos, ve sus propias cargas
  ADMINISTRATIVO  = 'ADMINISTRATIVO',   // Sube facturas, corrige OCR, no puede aprobar
  ADMIN           = 'ADMIN',            // Ve todo, aprueba/rechaza
}

export enum DocumentType {
  REMITO  = 'REMITO',
  FACTURA = 'FACTURA',
}

/**
 * Ciclo de vida de un documento:
 *
 *  PENDIENTE
 *    └─► PROCESANDO   (OCR en progreso)
 *          ├─► VALIDO          (todos los campos OK)
 *          └─► CON_ERRORES     (campos faltantes o inválidos)
 *                ├─► REVISADO          (ADMINISTRATIVO corrigió campos)
 *                └─► REVISION_PENDIENTE (enviado a cola de ADMIN sin corregir)
 *
 *  VALIDO | REVISADO | REVISION_PENDIENTE
 *    ├─► APROBADO   (ADMIN aprueba)
 *    └─► RECHAZADO  (ADMIN rechaza)
 */
export enum DocumentStatus {
  PENDIENTE          = 'PENDIENTE',
  PROCESANDO         = 'PROCESANDO',
  VALIDO             = 'VALIDO',
  CON_ERRORES        = 'CON_ERRORES',
  REVISION_PENDIENTE = 'REVISION_PENDIENTE',
  REVISADO           = 'REVISADO',
  APROBADO           = 'APROBADO',
  RECHAZADO          = 'RECHAZADO',
}
