import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

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

  /** Latitud GPS donde se tomó la foto (enviado desde app mobile) */
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  /** Longitud GPS donde se tomó la foto (enviado desde app mobile) */
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
