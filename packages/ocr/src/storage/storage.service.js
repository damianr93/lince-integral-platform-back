"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.ALLOWED_MIME_TYPES = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const common_2 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
/** Tiempo de expiración de la presigned PUT URL (segundos). 10 minutos. */
const UPLOAD_URL_TTL_SECONDS = 600;
/** Tiempo de expiración de la presigned GET URL (segundos). 1 hora. */
const VIEW_URL_TTL_SECONDS = 3600;
/** Extensiones permitidas para upload */
exports.ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];
let StorageService = StorageService_1 = class StorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(StorageService_1.name);
        this.client = null;
        const region = this.config.get('AWS_REGION', 'us-east-1');
        const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY');
        this.bucket = this.config.get('AWS_BUCKET_NAME', '');
        if (!this.bucket) {
            this.logger.warn('AWS S3 no configurado. Definir AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY para habilitar el almacenamiento de documentos.');
            return;
        }
        this.client = new client_s3_1.S3Client({
            region,
            ...(accessKeyId && secretAccessKey
                ? { credentials: { accessKeyId, secretAccessKey } }
                : {}),
        });
        this.logger.log(`S3 inicializado — bucket: ${this.bucket} (${region})`);
    }
    get isConfigured() {
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
    async getPresignedUploadUrl(s3Key, contentType) {
        this.assertConfigured();
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
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
    async getPresignedViewUrl(s3Key) {
        if (!this.isConfigured)
            return '';
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
            expiresIn: VIEW_URL_TTL_SECONDS,
        });
    }
    /**
     * Descarga el contenido de un objeto S3 como Buffer.
     * Usado internamente por el engine OCR para enviar el archivo a Google Cloud.
     *
     * @param s3Key Clave del objeto en S3
     */
    async downloadToBuffer(s3Key) {
        this.assertConfigured();
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
        });
        const response = await this.client.send(command);
        if (!response.Body) {
            throw new Error(`S3: objeto vacío para key ${s3Key}`);
        }
        // SDK v3 devuelve un ReadableStream (Node.js) en entornos Node
        const stream = response.Body;
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
    /**
     * Elimina un objeto de S3.
     * Usado si el usuario cancela antes de confirmar el upload, o al rechazar.
     *
     * @param s3Key Clave del objeto en S3
     */
    async deleteObject(s3Key) {
        if (!this.isConfigured)
            return; // Sin S3 no hay nada que borrar
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
        });
        await this.client.send(command);
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
    assertConfigured() {
        if (!this.isConfigured) {
            throw new common_2.ServiceUnavailableException('Servicio de almacenamiento no disponible. Configurar AWS_BUCKET_NAME, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.');
        }
    }
    buildS3Key(type, documentId, mimeType) {
        const year = new Date().getFullYear();
        const ext = MIME_TO_EXT[mimeType] ?? 'bin';
        return `ocr/${type}/${year}/${documentId}.${ext}`;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
const MIME_TO_EXT = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
};
//# sourceMappingURL=storage.service.js.map