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

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,

    private readonly storage:       StorageService,
    private readonly vision:        VisionService,
    private readonly validation:    ValidationService,
    private readonly notifications: OcrNotificationsService,
  ) {}

  // ── 1. Solicitud de presigned URL ─────────────────────────────────────────

  /**
   * Genera un documentId nuevo, crea el registro en DB con estado PENDIENTE,
   * y devuelve la presigned PUT URL para que el cliente suba el archivo a S3.
   *
   * Permisos:
   *  - REMITO:   OPERADOR_CAMPO, ADMIN, SUPERADMIN
   *  - FACTURA:  ADMINISTRATIVO, ADMIN, SUPERADMIN
   */
  async requestUploadUrl(dto: RequestUploadUrlDto, user: AuthUser) {
    const ocrRole = this.getOcrRole(user);
    this.assertCanUpload(dto.type, ocrRole, user);

    const documentId = uuidv4();
    const folder     = dto.type === DocumentType.FACTURA    ? 'facturas'
                     : dto.type === DocumentType.RETENCION ? 'retenciones'
                     : 'remitos';
    const s3Key      = this.storage.buildS3Key(folder, documentId, dto.contentType);

    const { uploadUrl, expiresIn } = await this.storage.getPresignedUploadUrl(
      s3Key,
      dto.contentType,
    );

    // Crear registro en DB antes de que el cliente suba el archivo
    const doc = this.docRepo.create({
      id:             documentId,
      type:           dto.type,
      status:         DocumentStatus.PENDIENTE,
      uploadedBy:     user.id,
      uploadedByRole: ocrRole,
      s3Key,
      s3ThumbnailKey: null,
      extractedData:  null,
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
  async confirmUpload(dto: ConfirmUploadDto, user: AuthUser) {
    const doc = await this.findOwnedOrFail(dto.documentId, user);

    if (doc.status !== DocumentStatus.PENDIENTE) {
      throw new BadRequestException(
        `El documento ya fue procesado (estado: ${doc.status})`,
      );
    }

    doc.status = DocumentStatus.PROCESANDO;
    await this.docRepo.save(doc);

    // OCR asíncrono — no bloquea la respuesta HTTP
    this.processOcr(doc).catch((err) =>
      this.logger.error(`Error en OCR doc ${doc.id}: ${err.message}`),
    );

    return { documentId: doc.id, status: doc.status };
  }

  // ── 3. Consultas ──────────────────────────────────────────────────────────

  /**
   * Devuelve todos los documentos del sistema.
   * Solo ADMIN / SUPERADMIN.
   */
  async findAll(filters: FilterDocumentsDto) {
    return this.queryDocuments(filters, {});
  }

  /**
   * Devuelve solo las facturas del usuario autenticado.
   * Para ADMINISTRATIVO.
   */
  async findMyFacturas(filters: FilterDocumentsDto, userId: string) {
    return this.queryDocuments(filters, {
      type:       DocumentType.FACTURA,
      uploadedBy: userId,
    });
  }

  /**
   * Devuelve solo las retenciones del usuario autenticado.
   * Para ADMINISTRATIVO.
   */
  async findMyRetenciones(filters: FilterDocumentsDto, userId: string) {
    return this.queryDocuments(filters, {
      type:       DocumentType.RETENCION,
      uploadedBy: userId,
    });
  }

  /**
   * Devuelve documentos en cola de revisión (estado REVISION_PENDIENTE o CON_ERRORES).
   * Solo ADMIN / SUPERADMIN.
   */
  async findReviewQueue(filters: FilterDocumentsDto) {
    return this.queryDocuments(filters, {
      status: In([
        DocumentStatus.REVISION_PENDIENTE,
        DocumentStatus.CON_ERRORES,
      ]) as unknown as DocumentStatus,
    });
  }

  /**
   * Devuelve un documento por ID.
   * Incluye presigned view URL del archivo original en S3.
   */
  async findOne(id: string, user: AuthUser) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    this.assertCanView(doc, user);

    const viewUrl = await this.storage.getPresignedViewUrl(doc.s3Key).catch(() => null);

    return { ...doc, viewUrl };
  }

  /**
   * Polling de estado — endpoint liviano para que el cliente siga el progreso del OCR.
   */
  async getStatus(id: string, user: AuthUser) {
    const doc = await this.docRepo.findOne({
      where:  { id },
      select: ['id', 'status', 'validationErrors', 'updatedAt'],
    });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);
    this.assertCanView(doc, user);
    return doc;
  }

  // ── 3b. View URL fresca ───────────────────────────────────────────────────

  /**
   * Genera una presigned GET URL fresca para el archivo en S3.
   * Útil cuando el viewUrl del findOne ya expiró o no vino por un error silencioso.
   */
  async getViewUrl(id: string, user: AuthUser): Promise<{ viewUrl: string | null }> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);
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
  async updateFields(id: string, dto: UpdateDocumentDto, user: AuthUser) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    this.assertCanEdit(doc, user);

    const ocrRole = this.getOcrRole(user);

    // Merge de campos (solo los enviados reemplazan los existentes)
    doc.extractedData = { ...(doc.extractedData ?? {}), ...(dto.extractedData ?? {}) };
    doc.correctedBy   = user.id;
    doc.correctedAt   = new Date();

    // Re-validar después de la corrección
    const errors = await this.validation.validate(doc.extractedData, doc.type);
    doc.validationErrors = errors.length > 0 ? errors : null;
    doc.status           = errors.length > 0
      ? DocumentStatus.CON_ERRORES
      : DocumentStatus.REVISADO;

    await this.docRepo.save(doc);

    this.logger.log(`Campos corregidos — doc ${id} por ${ocrRole} (user: ${user.id})`);

    return doc;
  }

  // ── 5. Aprobación / Rechazo ───────────────────────────────────────────────

  async approve(id: string, user: AuthUser) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    const canApprove = [
      DocumentStatus.VALIDO,
      DocumentStatus.REVISADO,
      DocumentStatus.REVISION_PENDIENTE,
      DocumentStatus.CON_ERRORES,
    ].includes(doc.status);

    if (!canApprove) {
      throw new BadRequestException(`No se puede aprobar un documento en estado ${doc.status}`);
    }

    doc.status     = DocumentStatus.APROBADO;
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
  async deleteDocument(id: string, user: AuthUser): Promise<{ deleted: boolean }> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    // Intentar eliminar de S3 (no bloquea si falla o no está configurado)
    await this.storage.deleteObject(doc.s3Key).catch((err) =>
      this.logger.warn(`No se pudo eliminar S3 key ${doc.s3Key}: ${(err as Error).message}`),
    );
    if (doc.s3ThumbnailKey) {
      await this.storage.deleteObject(doc.s3ThumbnailKey).catch(() => null);
    }

    await this.docRepo.remove(doc);
    this.logger.log(`Documento ${id} eliminado por ${user.id}`);

    return { deleted: true };
  }

  async reject(id: string, dto: RejectDocumentDto, user: AuthUser) {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    if (doc.status === DocumentStatus.RECHAZADO) {
      throw new BadRequestException('El documento ya fue rechazado');
    }

    doc.status       = DocumentStatus.RECHAZADO;
    doc.reviewedBy   = user.id;
    doc.approvedBy   = user.id;
    doc.approvedAt   = new Date();
    doc.rejectReason = dto.reason ?? null;
    await this.docRepo.save(doc);

    this.logger.log(`Documento ${id} RECHAZADO por ${user.id}`);

    return doc;
  }

  // ── OCR pipeline (asíncrono) ──────────────────────────────────────────────

  private async processOcr(doc: DocumentEntity): Promise<void> {
    try {
      // Descargar desde S3
      const buffer = await this.storage.downloadToBuffer(doc.s3Key);

      // Inferir MIME type desde la extensión de la clave S3
      const mimeType = inferMimeType(doc.s3Key);

      // Extraer campos con el engine OCR configurado
      const { fields, rawText } = await this.vision.extractFields(
        buffer,
        mimeType,
        doc.type,
      );

      // Remover rawText de los campos guardados (solo para depuración interna)
      const { rawText: _r, ...cleanFields } = fields as Record<string, string> & { rawText?: string };
      void _r; void rawText;

      // Validar campos extraídos
      const errors = await this.validation.validate(cleanFields, doc.type);

      doc.extractedData    = cleanFields;
      doc.validationErrors = errors.length > 0 ? errors : null;
      doc.status           = errors.length > 0
        ? DocumentStatus.CON_ERRORES
        : DocumentStatus.VALIDO;

      await this.docRepo.save(doc);

      this.logger.log(
        `OCR completado — doc ${doc.id} → ${doc.status}` +
        (errors.length > 0 ? ` (${errors.length} errores)` : ''),
      );

      // Notificar si hay errores
      if (errors.length > 0) {
        await this.notifications.notifyDocumentWithErrors({
          documentId:   doc.id,
          documentType: doc.type,
          uploadedBy:   doc.uploadedBy,
          errors,
        });
      }
    } catch (err) {
      this.logger.error(`OCR falló para doc ${doc.id}: ${(err as Error).message}`);
      doc.status = DocumentStatus.CON_ERRORES;
      doc.validationErrors = [`Error interno de procesamiento: ${(err as Error).message}`];
      await this.docRepo.save(doc);
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private async queryDocuments(
    filters: FilterDocumentsDto,
    extra: FindOptionsWhere<DocumentEntity>,
  ) {
    const where: FindOptionsWhere<DocumentEntity> = { ...extra };

    if (filters.type)       where.type       = filters.type;
    if (filters.status)     where.status     = filters.status;
    if (filters.uploadedBy) where.uploadedBy = filters.uploadedBy;

    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
      const to   = filters.dateTo   ? new Date(filters.dateTo)   : new Date();
      where.createdAt = Between(from, to);
    }

    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;

    const [items, total] = await this.docRepo.findAndCount({
      where,
      order:  { createdAt: 'DESC' },
      skip:   (page - 1) * limit,
      take:   limit,
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Busca un documento que pertenezca al usuario autenticado o falla */
  private async findOwnedOrFail(id: string, user: AuthUser): Promise<DocumentEntity> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    const isAdmin = this.isAdminOrSuperAdmin(user);
    if (!isAdmin && doc.uploadedBy !== user.id) {
      throw new ForbiddenException('No tenés acceso a este documento');
    }

    return doc;
  }

  private assertCanView(doc: DocumentEntity, user: AuthUser): void {
    const ocrRole = this.getOcrRole(user);

    if (this.isAdminOrSuperAdmin(user)) return;

    // ADMIN (OCR) ve todo
    if (ocrRole === OcrRole.ADMIN) return;

    // OPERADOR_CAMPO y ADMINISTRATIVO solo ven sus propios documentos
    if (doc.uploadedBy !== user.id) {
      throw new ForbiddenException('No tenés acceso a este documento');
    }
  }

  private assertCanUpload(
    type: DocumentType,
    ocrRole: OcrRole,
    user: AuthUser,
  ): void {
    if (this.isAdminOrSuperAdmin(user)) return;

    if (type === DocumentType.REMITO && ocrRole === OcrRole.ADMINISTRATIVO) {
      throw new ForbiddenException('ADMINISTRATIVO no puede subir remitos');
    }
    if (type === DocumentType.FACTURA && ocrRole === OcrRole.OPERADOR_CAMPO) {
      throw new ForbiddenException('OPERADOR_CAMPO no puede subir facturas');
    }
    if (type === DocumentType.RETENCION && ocrRole === OcrRole.OPERADOR_CAMPO) {
      throw new ForbiddenException('OPERADOR_CAMPO no puede subir retenciones');
    }
  }

  private assertCanEdit(doc: DocumentEntity, user: AuthUser): void {
    if (this.isAdminOrSuperAdmin(user)) return;

    const ocrRole = this.getOcrRole(user);

    if (ocrRole === OcrRole.ADMIN) return;

    // ADMINISTRATIVO solo puede editar sus propias facturas y retenciones
    if (ocrRole === OcrRole.ADMINISTRATIVO) {
      if (doc.type !== DocumentType.FACTURA && doc.type !== DocumentType.RETENCION) {
        throw new ForbiddenException('ADMINISTRATIVO solo puede editar facturas y retenciones');
      }
      if (doc.uploadedBy !== user.id) {
        throw new ForbiddenException('Solo podés editar tus propios documentos');
      }
      return;
    }

    throw new ForbiddenException('No tenés permisos para editar documentos');
  }

  private getOcrRole(user: AuthUser): OcrRole {
    const moduleRole = user.modules?.['ocr']?.role as OcrRole | undefined;
    return moduleRole ?? OcrRole.OPERADOR_CAMPO;
  }

  private isAdminOrSuperAdmin(user: AuthUser): boolean {
    return user.globalRole === 'ADMIN' || user.globalRole === 'SUPERADMIN';
  }
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function inferMimeType(s3Key: string): string {
  const ext = s3Key.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    pdf:  'application/pdf',
  };
  return map[ext ?? ''] ?? 'image/jpeg';
}
