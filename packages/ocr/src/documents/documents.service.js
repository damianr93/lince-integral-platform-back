"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const document_entity_1 = require("../entities/document.entity");
const enums_1 = require("../enums");
const storage_service_1 = require("../storage/storage.service");
const vision_service_1 = require("../vision/vision.service");
const validation_service_1 = require("../validation/validation.service");
const notifications_service_1 = require("../notifications/notifications.service");
let DocumentsService = DocumentsService_1 = class DocumentsService {
    constructor(docRepo, storage, vision, validation, notifications) {
        this.docRepo = docRepo;
        this.storage = storage;
        this.vision = vision;
        this.validation = validation;
        this.notifications = notifications;
        this.logger = new common_1.Logger(DocumentsService_1.name);
    }
    // ── 1. Solicitud de presigned URL ─────────────────────────────────────────
    /**
     * Genera un documentId nuevo, crea el registro en DB con estado PENDIENTE,
     * y devuelve la presigned PUT URL para que el cliente suba el archivo a S3.
     *
     * Permisos:
     *  - REMITO:   OPERADOR_CAMPO, ADMIN, SUPERADMIN
     *  - FACTURA:  ADMINISTRATIVO, ADMIN, SUPERADMIN
     */
    async requestUploadUrl(dto, user) {
        const ocrRole = this.getOcrRole(user);
        this.assertCanUpload(dto.type, ocrRole, user);
        const documentId = (0, uuid_1.v4)();
        const folder = dto.type === enums_1.DocumentType.FACTURA ? 'facturas'
            : dto.type === enums_1.DocumentType.RETENCION ? 'retenciones'
                : 'remitos';
        const s3Key = this.storage.buildS3Key(folder, documentId, dto.contentType);
        const { uploadUrl, expiresIn } = await this.storage.getPresignedUploadUrl(s3Key, dto.contentType);
        // Crear registro en DB antes de que el cliente suba el archivo
        const doc = this.docRepo.create({
            id: documentId,
            type: dto.type,
            status: enums_1.DocumentStatus.PENDIENTE,
            uploadedBy: user.id,
            uploadedByRole: ocrRole,
            s3Key,
            s3ThumbnailKey: null,
            extractedData: null,
            validationErrors: null,
        });
        await this.docRepo.save(doc);
        this.logger.log(`Upload URL generada — doc ${documentId} (${dto.type})`);
        return {
            documentId,
            uploadUrl,
            s3Key,
            expiresIn,
            instructions: 'PUT al uploadUrl con Content-Type del archivo. Luego llamar /confirm-upload.',
        };
    }
    // ── 2. Confirmación de upload + OCR ──────────────────────────────────────
    /**
     * El cliente llama este endpoint después de hacer el PUT a S3.
     * Actualiza el estado a PROCESANDO y dispara el OCR de forma asíncrona.
     */
    async confirmUpload(dto, user) {
        const doc = await this.findOwnedOrFail(dto.documentId, user);
        if (doc.status !== enums_1.DocumentStatus.PENDIENTE) {
            throw new common_1.BadRequestException(`El documento ya fue procesado (estado: ${doc.status})`);
        }
        doc.status = enums_1.DocumentStatus.PROCESANDO;
        await this.docRepo.save(doc);
        // OCR asíncrono — no bloquea la respuesta HTTP
        this.processOcr(doc).catch((err) => this.logger.error(`Error en OCR doc ${doc.id}: ${err.message}`));
        return { documentId: doc.id, status: doc.status };
    }
    // ── 3. Consultas ──────────────────────────────────────────────────────────
    /**
     * Devuelve todos los documentos del sistema.
     * Solo ADMIN / SUPERADMIN.
     */
    async findAll(filters) {
        return this.queryDocuments(filters, {});
    }
    /**
     * Devuelve solo las facturas del usuario autenticado.
     * Para ADMINISTRATIVO.
     */
    async findMyFacturas(filters, userId) {
        return this.queryDocuments(filters, {
            type: enums_1.DocumentType.FACTURA,
            uploadedBy: userId,
        });
    }
    /**
     * Devuelve solo las retenciones del usuario autenticado.
     * Para ADMINISTRATIVO.
     */
    async findMyRetenciones(filters, userId) {
        return this.queryDocuments(filters, {
            type: enums_1.DocumentType.RETENCION,
            uploadedBy: userId,
        });
    }
    /**
     * Devuelve documentos en cola de revisión (estado REVISION_PENDIENTE o CON_ERRORES).
     * Solo ADMIN / SUPERADMIN.
     */
    async findReviewQueue(filters) {
        return this.queryDocuments(filters, {
            status: (0, typeorm_2.In)([
                enums_1.DocumentStatus.REVISION_PENDIENTE,
                enums_1.DocumentStatus.CON_ERRORES,
            ]),
        });
    }
    /**
     * Devuelve un documento por ID.
     * Incluye presigned view URL del archivo original en S3.
     */
    async findOne(id, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        this.assertCanView(doc, user);
        const viewUrl = await this.storage.getPresignedViewUrl(doc.s3Key).catch(() => null);
        return { ...doc, viewUrl };
    }
    /**
     * Polling de estado — endpoint liviano para que el cliente siga el progreso del OCR.
     */
    async getStatus(id, user) {
        const doc = await this.docRepo.findOne({
            where: { id },
            select: ['id', 'status', 'validationErrors', 'updatedAt'],
        });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        this.assertCanView(doc, user);
        return doc;
    }
    // ── 3b. View URL fresca ───────────────────────────────────────────────────
    /**
     * Genera una presigned GET URL fresca para el archivo en S3.
     * Útil cuando el viewUrl del findOne ya expiró o no vino por un error silencioso.
     */
    async getViewUrl(id, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        this.assertCanView(doc, user);
        const viewUrl = await this.storage.getPresignedViewUrl(doc.s3Key).catch(() => null);
        return { viewUrl: viewUrl || null };
    }
    // ── 4. Corrección de campos ───────────────────────────────────────────────
    /**
     * Actualiza los campos extraídos por OCR.
     * Después de guardar, re-valida y cambia el estado a REVISADO si ya no hay errores.
     *
     * Permisos:
     *  - ADMINISTRATIVO: solo sus propias facturas
     *  - ADMIN / SUPERADMIN: cualquier documento
     */
    async updateFields(id, dto, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        this.assertCanEdit(doc, user);
        const ocrRole = this.getOcrRole(user);
        // Merge de campos (solo los enviados reemplazan los existentes)
        doc.extractedData = { ...(doc.extractedData ?? {}), ...(dto.extractedData ?? {}) };
        doc.correctedBy = user.id;
        doc.correctedAt = new Date();
        // Re-validar después de la corrección
        const errors = await this.validation.validate(doc.extractedData, doc.type);
        doc.validationErrors = errors.length > 0 ? errors : null;
        doc.status = errors.length > 0
            ? enums_1.DocumentStatus.CON_ERRORES
            : enums_1.DocumentStatus.REVISADO;
        await this.docRepo.save(doc);
        this.logger.log(`Campos corregidos — doc ${id} por ${ocrRole} (user: ${user.id})`);
        return doc;
    }
    // ── 5. Aprobación / Rechazo ───────────────────────────────────────────────
    async approve(id, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        const canApprove = [
            enums_1.DocumentStatus.VALIDO,
            enums_1.DocumentStatus.REVISADO,
            enums_1.DocumentStatus.REVISION_PENDIENTE,
            enums_1.DocumentStatus.CON_ERRORES,
        ].includes(doc.status);
        if (!canApprove) {
            throw new common_1.BadRequestException(`No se puede aprobar un documento en estado ${doc.status}`);
        }
        doc.status = enums_1.DocumentStatus.APROBADO;
        doc.reviewedBy = user.id;
        doc.approvedBy = user.id;
        doc.approvedAt = new Date();
        await this.docRepo.save(doc);
        this.logger.log(`Documento ${id} APROBADO por ${user.id}`);
        return doc;
    }
    // ── 6. Eliminar documento ──────────────────────────────────────────────────
    /**
     * Elimina un documento del sistema.
     * Borra el registro en DB y el objeto de S3 (si está configurado).
     * Solo ADMIN / SUPERADMIN.
     */
    async deleteDocument(id, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        // Intentar eliminar de S3 (no bloquea si falla o no está configurado)
        await this.storage.deleteObject(doc.s3Key).catch((err) => this.logger.warn(`No se pudo eliminar S3 key ${doc.s3Key}: ${err.message}`));
        if (doc.s3ThumbnailKey) {
            await this.storage.deleteObject(doc.s3ThumbnailKey).catch(() => null);
        }
        await this.docRepo.remove(doc);
        this.logger.log(`Documento ${id} eliminado por ${user.id}`);
        return { deleted: true };
    }
    async reject(id, dto, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        if (doc.status === enums_1.DocumentStatus.RECHAZADO) {
            throw new common_1.BadRequestException('El documento ya fue rechazado');
        }
        doc.status = enums_1.DocumentStatus.RECHAZADO;
        doc.reviewedBy = user.id;
        doc.approvedBy = user.id;
        doc.approvedAt = new Date();
        doc.rejectReason = dto.reason ?? null;
        await this.docRepo.save(doc);
        this.logger.log(`Documento ${id} RECHAZADO por ${user.id}`);
        return doc;
    }
    // ── OCR pipeline (asíncrono) ──────────────────────────────────────────────
    async processOcr(doc) {
        try {
            // Descargar desde S3
            const buffer = await this.storage.downloadToBuffer(doc.s3Key);
            // Inferir MIME type desde la extensión de la clave S3
            const mimeType = inferMimeType(doc.s3Key);
            // Extraer campos con el engine OCR configurado
            const { fields, rawText } = await this.vision.extractFields(buffer, mimeType, doc.type);
            // Remover rawText de los campos guardados (solo para depuración interna)
            const { rawText: _r, ...cleanFields } = fields;
            void _r;
            void rawText;
            // Validar campos extraídos
            const errors = await this.validation.validate(cleanFields, doc.type);
            doc.extractedData = cleanFields;
            doc.validationErrors = errors.length > 0 ? errors : null;
            doc.status = errors.length > 0
                ? enums_1.DocumentStatus.CON_ERRORES
                : enums_1.DocumentStatus.VALIDO;
            await this.docRepo.save(doc);
            this.logger.log(`OCR completado — doc ${doc.id} → ${doc.status}` +
                (errors.length > 0 ? ` (${errors.length} errores)` : ''));
            // Notificar si hay errores
            if (errors.length > 0) {
                await this.notifications.notifyDocumentWithErrors({
                    documentId: doc.id,
                    documentType: doc.type,
                    uploadedBy: doc.uploadedBy,
                    errors,
                });
            }
        }
        catch (err) {
            this.logger.error(`OCR falló para doc ${doc.id}: ${err.message}`);
            doc.status = enums_1.DocumentStatus.CON_ERRORES;
            doc.validationErrors = [`Error interno de procesamiento: ${err.message}`];
            await this.docRepo.save(doc);
        }
    }
    // ── Helpers privados ──────────────────────────────────────────────────────
    async queryDocuments(filters, extra) {
        const where = { ...extra };
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        if (filters.uploadedBy)
            where.uploadedBy = filters.uploadedBy;
        if (filters.dateFrom || filters.dateTo) {
            const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
            const to = filters.dateTo ? new Date(filters.dateTo) : new Date();
            where.createdAt = (0, typeorm_2.Between)(from, to);
        }
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const [items, total] = await this.docRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
    /** Busca un documento que pertenezca al usuario autenticado o falla */
    async findOwnedOrFail(id, user) {
        const doc = await this.docRepo.findOne({ where: { id } });
        if (!doc)
            throw new common_1.NotFoundException(`Documento ${id} no encontrado`);
        const isAdmin = this.isAdminOrSuperAdmin(user);
        if (!isAdmin && doc.uploadedBy !== user.id) {
            throw new common_1.ForbiddenException('No tenés acceso a este documento');
        }
        return doc;
    }
    assertCanView(doc, user) {
        const ocrRole = this.getOcrRole(user);
        if (this.isAdminOrSuperAdmin(user))
            return;
        // ADMIN (OCR) ve todo
        if (ocrRole === enums_1.OcrRole.ADMIN)
            return;
        // OPERADOR_CAMPO y ADMINISTRATIVO solo ven sus propios documentos
        if (doc.uploadedBy !== user.id) {
            throw new common_1.ForbiddenException('No tenés acceso a este documento');
        }
    }
    assertCanUpload(type, ocrRole, user) {
        if (this.isAdminOrSuperAdmin(user))
            return;
        if (type === enums_1.DocumentType.REMITO && ocrRole === enums_1.OcrRole.ADMINISTRATIVO) {
            throw new common_1.ForbiddenException('ADMINISTRATIVO no puede subir remitos');
        }
        if (type === enums_1.DocumentType.FACTURA && ocrRole === enums_1.OcrRole.OPERADOR_CAMPO) {
            throw new common_1.ForbiddenException('OPERADOR_CAMPO no puede subir facturas');
        }
        if (type === enums_1.DocumentType.RETENCION && ocrRole === enums_1.OcrRole.OPERADOR_CAMPO) {
            throw new common_1.ForbiddenException('OPERADOR_CAMPO no puede subir retenciones');
        }
    }
    assertCanEdit(doc, user) {
        if (this.isAdminOrSuperAdmin(user))
            return;
        const ocrRole = this.getOcrRole(user);
        if (ocrRole === enums_1.OcrRole.ADMIN)
            return;
        // ADMINISTRATIVO solo puede editar sus propias facturas y retenciones
        if (ocrRole === enums_1.OcrRole.ADMINISTRATIVO) {
            if (doc.type !== enums_1.DocumentType.FACTURA && doc.type !== enums_1.DocumentType.RETENCION) {
                throw new common_1.ForbiddenException('ADMINISTRATIVO solo puede editar facturas y retenciones');
            }
            if (doc.uploadedBy !== user.id) {
                throw new common_1.ForbiddenException('Solo podés editar tus propios documentos');
            }
            return;
        }
        throw new common_1.ForbiddenException('No tenés permisos para editar documentos');
    }
    getOcrRole(user) {
        const moduleRole = user.modules?.['ocr']?.role;
        return moduleRole ?? enums_1.OcrRole.OPERADOR_CAMPO;
    }
    isAdminOrSuperAdmin(user) {
        return user.globalRole === 'ADMIN' || user.globalRole === 'SUPERADMIN';
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        storage_service_1.StorageService,
        vision_service_1.VisionService,
        validation_service_1.ValidationService,
        notifications_service_1.OcrNotificationsService])
], DocumentsService);
// ── Utils ─────────────────────────────────────────────────────────────────────
function inferMimeType(s3Key) {
    const ext = s3Key.split('.').pop()?.toLowerCase();
    const map = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        pdf: 'application/pdf',
    };
    return map[ext ?? ''] ?? 'image/jpeg';
}
//# sourceMappingURL=documents.service.js.map