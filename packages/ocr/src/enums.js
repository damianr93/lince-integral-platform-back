"use strict";
/**
 * Enums del módulo OCR
 *
 * OcrRole    — Roles específicos dentro del módulo OCR (almacenados en modules.ocr.role)
 * DocumentType   — Tipo de documento gestionado
 * DocumentStatus — Ciclo de vida completo de un documento OCR
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStatus = exports.DocumentType = exports.OcrRole = void 0;
var OcrRole;
(function (OcrRole) {
    OcrRole["OPERADOR_CAMPO"] = "OPERADOR_CAMPO";
    OcrRole["ADMINISTRATIVO"] = "ADMINISTRATIVO";
    OcrRole["ADMIN"] = "ADMIN";
})(OcrRole || (exports.OcrRole = OcrRole = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["REMITO"] = "REMITO";
    DocumentType["FACTURA"] = "FACTURA";
    DocumentType["RETENCION"] = "RETENCION";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
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
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDIENTE"] = "PENDIENTE";
    DocumentStatus["PROCESANDO"] = "PROCESANDO";
    DocumentStatus["VALIDO"] = "VALIDO";
    DocumentStatus["CON_ERRORES"] = "CON_ERRORES";
    DocumentStatus["REVISION_PENDIENTE"] = "REVISION_PENDIENTE";
    DocumentStatus["REVISADO"] = "REVISADO";
    DocumentStatus["APROBADO"] = "APROBADO";
    DocumentStatus["RECHAZADO"] = "RECHAZADO";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
//# sourceMappingURL=enums.js.map