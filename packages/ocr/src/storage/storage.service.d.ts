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
import { ConfigService } from '@nestjs/config';
/** Extensiones permitidas para upload */
export declare const ALLOWED_MIME_TYPES: readonly ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export interface PresignedUploadResult {
    /** URL para hacer PUT desde el cliente directamente a S3 */
    uploadUrl: string;
    /** Clave S3 del objeto — se almacena en DocumentEntity.s3Key */
    s3Key: string;
    /** TTL en segundos de la URL generada */
    expiresIn: number;
}
export declare class StorageService {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly bucket;
    constructor(config: ConfigService);
    get isConfigured(): boolean;
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
    getPresignedUploadUrl(s3Key: string, contentType: AllowedMimeType): Promise<PresignedUploadResult>;
    /**
     * Genera una presigned GET URL para visualización segura del documento.
     * Usarla en el frontend para mostrar la imagen/PDF original.
     *
     * @param s3Key Clave del objeto en S3
     */
    getPresignedViewUrl(s3Key: string): Promise<string>;
    /**
     * Descarga el contenido de un objeto S3 como Buffer.
     * Usado internamente por el engine OCR para enviar el archivo a Google Cloud.
     *
     * @param s3Key Clave del objeto en S3
     */
    downloadToBuffer(s3Key: string): Promise<Buffer>;
    /**
     * Elimina un objeto de S3.
     * Usado si el usuario cancela antes de confirmar el upload, o al rechazar.
     *
     * @param s3Key Clave del objeto en S3
     */
    deleteObject(s3Key: string): Promise<void>;
    /**
     * Construye la clave S3 canónica para un documento.
     *
     * Formato: ocr/{tipo}/{año}/{uuid}.{ext}
     *
     * @param type       'remitos' | 'facturas'
     * @param documentId UUID del documento (ya generado antes del upload)
     * @param mimeType   MIME type para determinar la extensión
     */
    private assertConfigured;
    buildS3Key(type: 'remitos' | 'facturas' | 'retenciones', documentId: string, mimeType: AllowedMimeType): string;
}
//# sourceMappingURL=storage.service.d.ts.map