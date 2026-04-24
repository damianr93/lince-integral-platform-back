/**
 * OcrModule — Módulo raíz del sistema OCR
 *
 * Integra todos los submódulos:
 *  - DocumentsModule  → CRUD + upload flow + aprobaciones
 *  - StorageModule    → AWS S3 presigned URLs
 *  - VisionModule     → Engine OCR (Google Document AI / Vision fallback)
 *  - OcrNotificationsModule → Emails transaccionales
 *
 * Para habilitar el módulo, agregar OcrModule en AppModule e incluir
 * las entidades en buildDataSourceOptions() (ver apps/api/src/app.module.ts).
 */
export declare class OcrModule {
}
//# sourceMappingURL=ocr.module.d.ts.map