import { DocumentStatus, DocumentType, OcrRole } from '../enums';
/**
 * Tabla principal del módulo OCR.
 * Almacena metadatos de remitos y facturas.
 * El archivo binario vive en AWS S3 (s3Key).
 * Los campos extraídos por el engine OCR se guardan en extractedData (JSONB).
 */
export declare class DocumentEntity {
    id: string;
    type: DocumentType;
    status: DocumentStatus;
    /** UUID del usuario que subió el documento */
    uploadedBy: string;
    /** Rol OCR del usuario en el momento de la carga */
    uploadedByRole: OcrRole;
    /** Clave del objeto original en S3 (ej: "ocr/remitos/2026/uuid.jpg") */
    s3Key: string;
    /** Clave del thumbnail en S3 — se genera de forma asíncrona (nullable hasta generarse) */
    s3ThumbnailKey: string | null;
    /**
     * Campos extraídos por el engine OCR.
     * Para REMITO: { numero, fecha, proveedor, destinatario, productos, total }
     * Para FACTURA: { numero, fecha, proveedor, cuit, neto, iva, total, tipo }
     */
    extractedData: Record<string, string> | null;
    /**
     * Lista de errores de validación detectados.
     * Ej: ["Campo 'cuit' no detectado", "Campo 'total' inválido"]
     */
    validationErrors: string[] | null;
    /** UUID del usuario que corrigió los campos */
    correctedBy: string | null;
    correctedAt: Date | null;
    /** UUID del ADMIN que revisó el documento */
    reviewedBy: string | null;
    /** UUID del ADMIN que aprobó o rechazó */
    approvedBy: string | null;
    approvedAt: Date | null;
    /** Motivo de rechazo (requerido cuando status = RECHAZADO) */
    rejectReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=document.entity.d.ts.map