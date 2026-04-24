/**
 * DocumentsService
 *
 * Orquesta el ciclo de vida completo de documentos OCR:
 *  1. Solicitud de presigned URL para upload a S3
 *  2. Confirmación de upload + disparo de procesamiento OCR asíncrono
 *  3. Consultas con filtros (ADMIN ve todo, ADMINISTRATIVO solo sus facturas)
 *  4. Corrección de campos (ADMINISTRATIVO para sus facturas, ADMIN para todo)
 *  5. Aprobación / rechazo (solo ADMIN)
 */
import { Repository } from 'typeorm';
import { AuthUser } from '@lince/types';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentStatus, DocumentType, OcrRole } from '../enums';
import { StorageService } from '../storage/storage.service';
import { VisionService } from '../vision/vision.service';
import { ValidationService } from '../validation/validation.service';
import { OcrNotificationsService } from '../notifications/notifications.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { RejectDocumentDto } from './dto/approve-reject.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
export declare class DocumentsService {
    private readonly docRepo;
    private readonly storage;
    private readonly vision;
    private readonly validation;
    private readonly notifications;
    private readonly logger;
    constructor(docRepo: Repository<DocumentEntity>, storage: StorageService, vision: VisionService, validation: ValidationService, notifications: OcrNotificationsService);
    /**
     * Genera un documentId nuevo, crea el registro en DB con estado PENDIENTE,
     * y devuelve la presigned PUT URL para que el cliente suba el archivo a S3.
     *
     * Permisos:
     *  - REMITO:   OPERADOR_CAMPO, ADMIN, SUPERADMIN
     *  - FACTURA:  ADMINISTRATIVO, ADMIN, SUPERADMIN
     */
    requestUploadUrl(dto: RequestUploadUrlDto, user: AuthUser): Promise<{
        documentId: string;
        uploadUrl: string;
        s3Key: string;
        expiresIn: number;
        instructions: string;
    }>;
    /**
     * El cliente llama este endpoint después de hacer el PUT a S3.
     * Actualiza el estado a PROCESANDO y dispara el OCR de forma asíncrona.
     */
    confirmUpload(dto: ConfirmUploadDto, user: AuthUser): Promise<{
        documentId: string;
        status: DocumentStatus.PROCESANDO;
    }>;
    /**
     * Devuelve todos los documentos del sistema.
     * Solo ADMIN / SUPERADMIN.
     */
    findAll(filters: FilterDocumentsDto): Promise<{
        items: DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Devuelve solo las facturas del usuario autenticado.
     * Para ADMINISTRATIVO.
     */
    findMyFacturas(filters: FilterDocumentsDto, userId: string): Promise<{
        items: DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Devuelve solo las retenciones del usuario autenticado.
     * Para ADMINISTRATIVO.
     */
    findMyRetenciones(filters: FilterDocumentsDto, userId: string): Promise<{
        items: DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Devuelve documentos en cola de revisión (estado REVISION_PENDIENTE o CON_ERRORES).
     * Solo ADMIN / SUPERADMIN.
     */
    findReviewQueue(filters: FilterDocumentsDto): Promise<{
        items: DocumentEntity[];
        total: number;
        page: number;
        limit: number;
        pages: number;
    }>;
    /**
     * Devuelve un documento por ID.
     * Incluye presigned view URL del archivo original en S3.
     */
    findOne(id: string, user: AuthUser): Promise<{
        viewUrl: string | null;
        id: string;
        type: DocumentType;
        status: DocumentStatus;
        uploadedBy: string;
        uploadedByRole: OcrRole;
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
     * Polling de estado — endpoint liviano para que el cliente siga el progreso del OCR.
     */
    getStatus(id: string, user: AuthUser): Promise<DocumentEntity>;
    /**
     * Genera una presigned GET URL fresca para el archivo en S3.
     * Útil cuando el viewUrl del findOne ya expiró o no vino por un error silencioso.
     */
    getViewUrl(id: string, user: AuthUser): Promise<{
        viewUrl: string | null;
    }>;
    /**
     * Actualiza los campos extraídos por OCR.
     * Después de guardar, re-valida y cambia el estado a REVISADO si ya no hay errores.
     *
     * Permisos:
     *  - ADMINISTRATIVO: solo sus propias facturas
     *  - ADMIN / SUPERADMIN: cualquier documento
     */
    updateFields(id: string, dto: UpdateDocumentDto, user: AuthUser): Promise<DocumentEntity>;
    approve(id: string, user: AuthUser): Promise<DocumentEntity>;
    /**
     * Elimina un documento del sistema.
     * Borra el registro en DB y el objeto de S3 (si está configurado).
     * Solo ADMIN / SUPERADMIN.
     */
    deleteDocument(id: string, user: AuthUser): Promise<{
        deleted: boolean;
    }>;
    reject(id: string, dto: RejectDocumentDto, user: AuthUser): Promise<DocumentEntity>;
    private processOcr;
    private queryDocuments;
    /** Busca un documento que pertenezca al usuario autenticado o falla */
    private findOwnedOrFail;
    private assertCanView;
    private assertCanUpload;
    private assertCanEdit;
    private getOcrRole;
    private isAdminOrSuperAdmin;
}
//# sourceMappingURL=documents.service.d.ts.map