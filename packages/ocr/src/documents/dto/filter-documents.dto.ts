import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { DocumentStatus, DocumentType } from '../../enums';

/**
 * GET /ocr/documents          → ADMIN / SUPERADMIN (todos los documentos)
 * GET /ocr/documents/me/facturas → ADMINISTRATIVO (solo sus facturas)
 * GET /ocr/documents/me/retenciones → ADMINISTRATIVO (solo sus retenciones)
 * GET /ocr/documents/review-queue → ADMIN / SUPERADMIN (cola de revisión)
 *
 * Todos los parámetros son opcionales.
 */
export class FilterDocumentsDto {
  /** Filtrar por tipo de documento */
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  /** Filtrar por estado */
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  /** Filtrar por usuario que subió (UUID) */
  @IsUUID()
  @IsOptional()
  uploadedBy?: string;

  /** Filtrar desde esta fecha (ISO 8601) */
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  /** Filtrar hasta esta fecha (ISO 8601) */
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  /** Número de página (base 1) */
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /** Documentos por página (máximo 100) */
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
