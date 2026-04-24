import { DocumentStatus, DocumentType } from '../../enums';
/**
 * GET /ocr/documents          → ADMIN / SUPERADMIN (todos los documentos)
 * GET /ocr/documents/me/facturas → ADMINISTRATIVO (solo sus facturas)
 * GET /ocr/documents/me/retenciones → ADMINISTRATIVO (solo sus retenciones)
 * GET /ocr/documents/review-queue → ADMIN / SUPERADMIN (cola de revisión)
 *
 * Todos los parámetros son opcionales.
 */
export declare class FilterDocumentsDto {
    /** Filtrar por tipo de documento */
    type?: DocumentType;
    /** Filtrar por estado */
    status?: DocumentStatus;
    /** Filtrar por usuario que subió (UUID) */
    uploadedBy?: string;
    /** Filtrar desde esta fecha (ISO 8601) */
    dateFrom?: string;
    /** Filtrar hasta esta fecha (ISO 8601) */
    dateTo?: string;
    /** Número de página (base 1) */
    page?: number;
    /** Documentos por página (máximo 100) */
    limit?: number;
}
//# sourceMappingURL=filter-documents.dto.d.ts.map