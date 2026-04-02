import { IsUUID } from 'class-validator';

/**
 * POST /ocr/documents/confirm-upload
 *
 * El cliente confirma que el archivo ya fue subido a S3.
 * El servidor dispara el procesamiento OCR de forma asíncrona.
 */
export class ConfirmUploadDto {
  /** ID del documento creado en el paso anterior (request-upload-url) */
  @IsUUID()
  documentId: string;
}
