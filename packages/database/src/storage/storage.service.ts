/**
 * StorageService — AWS S3 (SDK v3)
 *
 * Infraestructura compartida para acceso a S3.
 * Usada por los módulos OCR y Logística.
 *
 * Variables de entorno:
 *  AWS_ACCESS_KEY_ID      — Access key de la IAM user/role con permisos S3
 *  AWS_SECRET_ACCESS_KEY  — Secret key
 *  AWS_REGION             — Región del bucket (ej: us-east-1)
 *  AWS_BUCKET_NAME        — Nombre del bucket
 */

import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const UPLOAD_URL_TTL_SECONDS = 600;
const VIEW_URL_TTL_SECONDS   = 3600;
const DOWNLOAD_URL_TTL_SECONDS = 60;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface PresignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const region          = this.config.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId     = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket           = this.config.get<string>('AWS_BUCKET_NAME', '');

    if (!this.bucket) {
      this.logger.warn(
        'AWS S3 no configurado. Definir AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.',
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
    return { uploadUrl, s3Key, expiresIn: UPLOAD_URL_TTL_SECONDS };
  }

  async getPresignedViewUrl(s3Key: string): Promise<string> {
    if (!this.isConfigured) return '';
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    return getSignedUrl(this.client!, command, { expiresIn: VIEW_URL_TTL_SECONDS });
  }

  async getPresignedDownloadUrl(s3Key: string): Promise<string> {
    if (!this.isConfigured) return '';
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    return getSignedUrl(this.client!, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  }

  async downloadToBuffer(s3Key: string): Promise<Buffer> {
    this.assertConfigured();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: s3Key });
    const response = await this.client!.send(command);

    if (!response.Body) throw new Error(`S3: objeto vacío para key ${s3Key}`);

    const stream = response.Body as Readable;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end',  () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteObject(s3Key: string): Promise<void> {
    if (!this.isConfigured) return;
    await this.client!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: s3Key }));
  }

  async moveObject(sourceKey: string, targetKey: string): Promise<void> {
    if (!this.isConfigured) return;
    if (sourceKey === targetKey) return;
    const copySource = `${this.bucket}/${encodeURIComponent(sourceKey).replace(/%2F/g, '/')}`;
    await this.client!.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: targetKey,
      CopySource: copySource,
    }));
    await this.deleteObject(sourceKey);
  }

  buildS3Key(
    type: 'remitos' | 'facturas' | 'retenciones',
    documentId: string,
    mimeType: AllowedMimeType,
    remitoNumber = 'noDetected',
    remitoDate   = 'noDetected',
  ): string {
    const year = new Date().getFullYear();
    const ext  = MIME_TO_EXT[mimeType] ?? 'bin';
    return `ocr/${type}/${year}/${this.buildDocumentFileName(documentId, remitoNumber, remitoDate, ext)}`;
  }

  buildDocumentS3KeyFromExisting(
    currentKey: string,
    documentId: string,
    remitoNumber = 'noDetected',
    remitoDate   = 'noDetected',
  ): string {
    const lastSlash = currentKey.lastIndexOf('/');
    const prefix    = lastSlash === -1 ? '' : currentKey.slice(0, lastSlash + 1);
    const fileName  = lastSlash === -1 ? currentKey : currentKey.slice(lastSlash + 1);
    const dot       = fileName.lastIndexOf('.');
    const ext       = dot === -1 ? 'bin' : fileName.slice(dot + 1);
    return `${prefix}${this.buildDocumentFileName(documentId, remitoNumber, remitoDate, ext)}`;
  }

  private buildDocumentFileName(
    documentId: string,
    remitoNumber: string,
    remitoDate: string,
    ext: string,
  ): string {
    return `${sanitizeS3NamePart(documentId)}-${sanitizeS3NamePart(remitoNumber)}-${sanitizeS3NamePart(remitoDate)}.${sanitizeS3NamePart(ext)}`;
  }

  private assertConfigured(): void {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Servicio de almacenamiento no disponible. Configurar AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.',
      );
    }
  }
}

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg':      'jpg',
  'image/png':       'png',
  'image/webp':      'webp',
  'application/pdf': 'pdf',
};

function sanitizeS3NamePart(value: string): string {
  const clean = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || 'noDetected';
}
