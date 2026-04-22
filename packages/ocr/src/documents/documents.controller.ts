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

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, ModuleGuard, RolesGuard, CurrentUser, RequireModule, Roles } from '@lince/auth';
import { ModuleKey, GlobalRole, AuthUser } from '@lince/types';
import { DocumentsService } from './documents.service';
import { ValidationService } from '../validation/validation.service';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { FilterDocumentsDto } from './dto/filter-documents.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ApproveDocumentDto, RejectDocumentDto } from './dto/approve-reject.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentType } from '../enums';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

// ── DTO inline para config ────────────────────────────────────────────────────
class UpdateOcrConfigDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsObject()
  requiredFields: string[];

  @IsObject()
  @IsOptional()
  fieldLabels?: Record<string, string>;
}

// ── Guards base para todos los endpoints ─────────────────────────────────────
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule(ModuleKey.OCR)
@Controller('ocr/documents')
export class DocumentsController {
  constructor(
    private readonly documents:   DocumentsService,
    private readonly validation:  ValidationService,
  ) {}

  // ── Upload flow ────────────────────────────────────────────────────────────

  /**
   * Solicitar presigned URL para subir un documento a S3.
   * El cliente recibe: { documentId, uploadUrl, s3Key, expiresIn }
   * Debe hacer: PUT <uploadUrl> con el archivo binario y Content-Type correcto.
   */
  @Post('upload-url')
  requestUploadUrl(
    @Body() dto: RequestUploadUrlDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.requestUploadUrl(dto, user);
  }

  /**
   * Confirmar que el archivo ya fue subido a S3.
   * Dispara el procesamiento OCR de forma asíncrona.
   * El cliente puede hacer polling en GET /:id/status para seguir el progreso.
   */
  @Post('confirm-upload')
  confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.confirmUpload(dto, user);
  }

  // ── Consultas ──────────────────────────────────────────────────────────────

  /**
   * Lista todos los documentos del sistema con filtros.
   * Solo ADMIN / SUPERADMIN.
   */
  @Get()
  findAll(@Query() filters: FilterDocumentsDto) {
    return this.documents.findAll(filters);
  }

  /**
   * Lista las facturas propias del ADMINISTRATIVO autenticado.
   */
  @Get('facturas')
  findMyFacturas(
    @Query() filters: FilterDocumentsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.findMyFacturas(filters, user.id);
  }

  /**
   * Lista las retenciones propias del ADMINISTRATIVO autenticado.
   */
  @Get('retenciones')
  findMyRetenciones(
    @Query() filters: FilterDocumentsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.findMyRetenciones(filters, user.id);
  }

  /**
   * Cola de revisión — documentos que requieren atención del ADMIN.
   * Solo ADMIN / SUPERADMIN.
   */
  @Get('review-queue')
  findReviewQueue(@Query() filters: FilterDocumentsDto) {
    return this.documents.findReviewQueue(filters);
  }

  /**
   * Obtiene una presigned GET URL fresca para visualizar el archivo original.
   * Útil cuando la URL del findOne expiró o vino nula por un error de S3.
   */
  @Get(':id/view-url')
  getViewUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.getViewUrl(id, user);
  }

  /**
   * Polling de estado — endpoint liviano, devuelve solo id + status + errores.
   */
  @Get(':id/status')
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.getStatus(id, user);
  }

  /**
   * Detalle completo de un documento, incluye presigned view URL para la imagen.
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.findOne(id, user);
  }

  // ── Corrección y revisión ──────────────────────────────────────────────────

  /**
   * Corregir campos extraídos por OCR.
   * Después de guardar, re-valida y actualiza el estado.
   */
  @Patch(':id')
  updateFields(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.updateFields(id, dto, user);
  }

  /**
   * Aprobar un documento. Solo ADMIN / SUPERADMIN.
   */
  @Patch(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: ApproveDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.approve(id, user);
  }

  /**
   * Rechazar un documento. Solo ADMIN / SUPERADMIN.
   */
  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.reject(id, dto, user);
  }

  /**
   * Eliminar un documento. Solo ADMIN / SUPERADMIN.
   * Borra de DB y de S3 (si está configurado).
   */
  @Delete(':id')
  deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.deleteDocument(id, user);
  }

  // ── Configuración (SUPERADMIN) ─────────────────────────────────────────────

  /**
   * Ver configuración actual de campos requeridos por tipo de documento.
   */
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  @Get('config/all')
  getConfigs() {
    return this.validation.getAllConfigs();
  }

  /**
   * Actualizar campos requeridos para un tipo de documento.
   */
  @UseGuards(RolesGuard)
  @Roles(GlobalRole.SUPERADMIN)
  @Patch('config/update')
  updateConfig(@Body() dto: UpdateOcrConfigDto) {
    return this.validation.upsertConfig(dto.type, dto.requiredFields, dto.fieldLabels);
  }
}
