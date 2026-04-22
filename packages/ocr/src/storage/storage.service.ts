/**
 * StorageService — AWS S3 (SDK v3)
 *
 * Responsabilidades:
 *  - Generar presigned PUT URLs para que el cliente suba directo a S3
 *  - Generar presigned GET URLs para visualización segura (no expone el bucket)
 *  - Descargar objetos a buffer (para enviarlos a Google Cloud OCR)
 *  - Eliminar objetos
 *
 * Configuración (todas opcionales hasta tener credenciales reales):
 *  AWS_ACCESS_KEY_ID      — Access key de la IAM user/role con permisos S3
 *  AWS_SECRET_ACCESS_KEY  — Secret key
 *  AWS_REGION             — Región del bucket (ej: us-east-1)
 *  AWS_BUCKET_NAME        — Nombre del bucket
 *
 * Política IAM mínima requerida:
 *  s3:PutObject, s3:GetObject, s3:DeleteObject en arn:aws:s3:::BUCKET/*
 *
 * Estructura de claves en S3:
 *  ocr/{tipo}/{año}/{uuid}.{ext}          ← original
 *  ocr/{tipo}/{año}/thumbs/{uuid}.jpg     ← thumbnail (generación futura)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

/** Tiempo de expiración de la presigned PUT URL (segundos). 10 minutos. */
const UPLOAD_URL_TTL_SECONDS = 600;

/** Tiempo de expiración de la presigned GET URL (segundos). 1 hora. */
const VIEW_URL_TTL_SECONDS = 3600;

/** Extensiones permitidas para upload */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface PresignedUploadResult {
  /** URL para hacer PUT desde el cliente directamente a S3 */
  uploadUrl: string;
  /** Clave S3 del objeto — se almacena en DocumentEntity.s3Key */
  s3Key: string;
  /** TTL en segundos de la URL generada */
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region         = this.config.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId    = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket          = this.config.get<string>('AWS_BUCKET_NAME', '');

    if (!this.bucket) {
      this.logger.warn(
        'AWS S3 no configurado. Definir AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY para habilitar el almacenamiento de documentos.',
      );
      return;
    }

    this.client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });

    this.logger.log(`S3 inicializado — bucket: ${this.bucket} (${region})`);
  }

  get isConfigured(): boolean {
    return this.client !== null && !!this.bucket;
  }

  /**
   * Genera una presigned PUT URL para subir un archivo directamente a S3
   * desde el browser/PWA sin pasar por el servidor.
   *
   * El cliente debe hacer:
   *   PUT <uploadUrl>
   *   Headers: Content-Type: <contentType>
   *   Body: <file binary>
   *
   * @param s3Key   Clave destino en S3 (generada por el llamante)
   * @param contentType MIME type del archivo
   */
  async getPresignedUploadUrl(
    s3Key: string,
    contentType: AllowedMimeType,
  ): Promise<PresignedUploadResult> {
    this.assertConfigured();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client!, command, {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    });

    this.logger.debug(`Presigned upload URL generada para key: ${s3Key}`);

    return { uploadUrl, s3Key, expiresIn: UPLOAD_URL_TTL_SECONDS };
  }

  /**
   * Genera una presigned GET URL para visualización segura del documento.
   * Usarla en el frontend para mostrar la imagen/PDF original.
   *
   * @param s3Key Clave del objeto en S3
   */
  async getPresignedViewUrl(s3Key: string): Promise<string> {
    if (!this.isConfigured) return '';
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    return getSignedUrl(this.client!, command, {
      expiresIn: VIEW_URL_TTL_SECONDS,
    });
  }

  /**
   * Descarga el contenido de un objeto S3 como Buffer.
   * Usado internamente por el engine OCR para enviar el archivo a Google Cloud.
   *
   * @param s3Key Clave del objeto en S3
   */
  async downloadToBuffer(s3Key: string): Promise<Buffer> {
    this.assertConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const response = await this.client!.send(command);

    if (!response.Body) {
      throw new Error(`S3: objeto vacío para key ${s3Key}`);
    }

    // SDK v3 devuelve un ReadableStream (Node.js) en entornos Node
    const stream = response.Body as Readable;

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end',  ()           => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Elimina un objeto de S3.
   * Usado si el usuario cancela antes de confirmar el upload, o al rechazar.
   *
   * @param s3Key Clave del objeto en S3
   */
  async deleteObject(s3Key: string): Promise<void> {
    if (!this.isConfigured) return; // Sin S3 no hay nada que borrar
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    await this.client!.send(command);
    this.logger.debug(`Objeto S3 eliminado: ${s3Key}`);
  }

  /**
   * Construye la clave S3 canónica para un documento.
   *
   * Formato: ocr/{tipo}/{año}/{uuid}.{ext}
   *
   * @param type       'remitos' | 'facturas'
   * @param documentId UUID del documento (ya generado antes del upload)
   * @param mimeType   MIME type para determinar la extensión
   */
  private assertConfigured(): void {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Servicio de almacenamiento no disponible. Configurar AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.',
      );
    }
  }

  buildS3Key(
    type: 'remitos' | 'facturas' | 'retenciones',
    documentId: string,
    mimeType: AllowedMimeType,
  ): string {
    const year = new Date().getFullYear();
    const ext  = MIME_TO_EXT[mimeType] ?? 'bin';
    return `ocr/${type}/${year}/${documentId}.${ext}`;
  }
}

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg':     'jpg',
  'image/png':      'png',
  'image/webp':     'webp',
  'application/pdf': 'pdf',
};
