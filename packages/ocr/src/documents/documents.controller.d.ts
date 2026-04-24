/**
 * DocumentsController — /ocr/documents
 *
 * Endpoints públicos del módulo OCR.
 * Todos requieren autenticación JWT + módulo OCR habilitado.
 *
 * Permisos por endpoint:
 *
 *  POST   /upload-url         → OPERADOR_CAMPO (remitos), ADMINISTRATIVO (facturas), ADMIN/SUPERADMIN
 *  POST   /confirm-upload     → El que subió el documento
 *  GET    /                   → Solo ADMIN / SUPERADMIN
 *  GET    /facturas            → ADMINISTRATIVO (solo las propias)
 *  GET    /retenciones        → ADMINISTRATIVO (solo las propias)
 *  GET    /review-queue       → Solo ADMIN / SUPERADMIN
 *  GET    /:id                → El dueño del doc, ADMIN, SUPERADMIN
 *  GET    /:id/status         → El dueño del doc, ADMIN, SUPERADMIN (polling liviano)
 *  PATCH  /:id                → ADMINISTRATIVO (sus facturas), ADMIN, SUPERADMIN
 *  PATCH  /:id/approve        → Solo ADMIN / SUPERADMIN
 *  PATCH  /:id/reject         → Solo ADMIN / SUPERADMIN
 *  DELETE /:id                → Solo ADMIN / SUPERADMIN
 *
 * Configuración (solo SUPERADMIN):
 *  GET    /config             → Ver campos requeridos por tipo
 *  PATCH  /config/:type       → Actualizar campos requeridos
 */
import { AuthUser } from '@lince/types';
import { DocumentsService } from './documents.service';
import { ValidationService } from '../validation/validation.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ApproveDocumentDto, RejectDocumentDto } from './dto/approve-reject.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentType } from '../enums';
declare class UpdateOcrConfigDto {
    type: DocumentType;
    requiredFields: string[];
    fieldLabels?: Record<string, string>;
}
export declare class DocumentsController {
    private readonly documents;
    private readonly validation;
    constructor(documents: DocumentsService, validation: ValidationService);
    /**
     * Solicitar presigned URL para subir un documento a S3.
     * El cliente recibe: { documentId, uploadUrl, s3Key, expiresIn }
     * Debe hacer: PUT <uploadUrl> con el archivo binario y Content-Type correcto.
     */
    requestUploadUrl(dto: RequestUploadUrlDto, user: AuthUser): Promise<{
        documentId: string;
        uploadUrl: string;
        s3Key: string;
        expiresIn: number;
        instructions: string;
    }>;
    /**
     * Confirmar que el archivo ya fue subido a S3.
     * Dispara el procesamiento OCR de forma asíncrona.
     * El cliente puede hacer polling en GET /:id/status para seguir el progreso.
     */
    confirmUpload(dto: ConfirmUploadDto, user: AuthUser): Promise<{
        documentId: string;
        status: import("../enums").DocumentStatus.PROCESANDO;
    }>;
    /**
     * Lista todos los documentos del sistema con filtros.
     * Solo ADMIN / SUPERADMIN.
     */
    findAll(filters: FilterDocumentsDto): Promise<{
        items: import("..").DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Lista las facturas propias del ADMINISTRATIVO autenticado.
     */
    findMyFacturas(filters: FilterDocumentsDto, user: AuthUser): Promise<{
        items: import("..").DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Lista las retenciones propias del ADMINISTRATIVO autenticado.
     */
    findMyRetenciones(filters: FilterDocumentsDto, user: AuthUser): Promise<{
        items: import("..").DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Cola de revisión — documentos que requieren atención del ADMIN.
     * Solo ADMIN / SUPERADMIN.
     */
    findReviewQueue(filters: FilterDocumentsDto): Promise<{
        items: import("..").DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Obtiene una presigned GET URL fresca para visualizar el archivo original.
     * Útil cuando la URL del findOne expiró o vino nula por un error de S3.
     */
    getViewUrl(id: string, user: AuthUser): Promise<{
        viewUrl: string | null;
    }>;
    /**
     * Polling de estado — endpoint liviano, devuelve solo id + status + errores.
     */
    getStatus(id: string, user: AuthUser): Promise<import("..").DocumentEntity>;
    /**
     * Detalle completo de un documento, incluye presigned view URL para la imagen.
     */
    findOne(id: string, user: AuthUser): Promise<{
        viewUrl: string | null;
        id: string;
        type: DocumentType;
        status: import("../enums").DocumentStatus;
        uploadedBy: string;
        uploadedByRole: import("../enums").OcrRole;
        s3Key: string;
        s3ThumbnailKey: string | null;
        extractedData: Record<string, string> | null;
        validationErrors: string[] | null;
        correctedBy: string | null;
        correctedAt: Date | null;
        reviewedBy: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        rejectReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Corregir campos extraídos por OCR.
     * Después de guardar, re-valida y actualiza el estado.
     */
    updateFields(id: string, dto: UpdateDocumentDto, user: AuthUser): Promise<import("..").DocumentEntity>;
    /**
     * Aprobar un documento. Solo ADMIN / SUPERADMIN.
     */
    approve(id: string, _dto: ApproveDocumentDto, user: AuthUser): Promise<import("..").DocumentEntity>;
    /**
     * Rechazar un documento. Solo ADMIN / SUPERADMIN.
     */
    reject(id: string, dto: RejectDocumentDto, user: AuthUser): Promise<import("..").DocumentEntity>;
    /**
     * Eliminar un documento. Solo ADMIN / SUPERADMIN.
     * Borra de DB y de S3 (si está configurado).
     */
    deleteDocument(id: string, user: AuthUser): Promise<{
        deleted: boolean;
    }>;
    /**
     * Ver configuración actual de campos requeridos por tipo de documento.
     */
    getConfigs(): Promise<import("..").OcrConfigEntity[]>;
    /**
     * Actualizar campos requeridos para un tipo de documento.
     */
    updateConfig(dto: UpdateOcrConfigDto): Promise<import("..").OcrConfigEntity>;
}
export {};
//# sourceMappingURL=documents.controller.d.ts.map