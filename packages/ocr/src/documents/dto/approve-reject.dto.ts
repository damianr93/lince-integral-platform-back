import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * PATCH /ocr/documents/:id/approve
 * No requiere body — el endpoint simplemente marca como APROBADO.
 */
export class ApproveDocumentDto {}

/**
 * PATCH /ocr/documents/:id/reject
 *
 * El ADMIN debe indicar el motivo del rechazo.
 * El motivo se guarda en DocumentEntity.rejectReason y se notifica al usuario.
 */
export class RejectDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
