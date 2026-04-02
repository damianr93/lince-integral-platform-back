import { IsEnum, IsIn } from 'class-validator';
import { DocumentType } from '../../enums';
import { ALLOWED_MIME_TYPES, AllowedMimeType } from '../../storage/storage.service';

/**
 * POST /ocr/documents/upload-url
 *
 * El cliente solicita una presigned URL para subir un documento directamente a S3.
 * El servidor genera la URL y un documentId (UUID) que el cliente deberá usar
 * en el paso siguiente (confirm-upload).
 */
export class RequestUploadUrlDto {
  /** Tipo de documento a subir */
  @IsEnum(DocumentType)
  type: DocumentType;

  /** MIME type del archivo a subir */
  @IsIn([...ALLOWED_MIME_TYPES])
  contentType: AllowedMimeType;
}
