/**
 * VisionService — Google Cloud Vision API
 *
 * Recibe un Buffer con la imagen/PDF, la envía a Vision y devuelve los campos
 * estructurados según el tipo de documento (REMITO o FACTURA).
 *
 * Autenticación (elegir UNA opción):
 *
 *  Opción A — Archivo JSON de Service Account (recomendado para dev local):
 *    GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account.json
 *
 *  Opción B — Contenido JSON como env var (recomendado para Railway):
 *    GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":...}
 *    → El servicio lo escribe en un archivo temporal al arrancar.
 *
 *  Opción C — API Key simple:
 *    GOOGLE_VISION_API_KEY=AIza...
 *    (Más limitada: no soporta todas las features de Vision)
 *
 * Permisos de la Service Account:
 *   Rol mínimo: "Cloud Vision API User" (roles/visionai.user)
 *   O bien: habilitar la API y usar una key de proyecto.
 *
 * Para PDFs multi-página, Vision requiere usar la feature DOCUMENT_TEXT_DETECTION
 * que soporta PDF/TIFF. Para imágenes simples, TEXT_DETECTION es suficiente.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as vision from '@google-cloud/vision';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DocumentType } from '../enums';
import { parseFacturaText, parseRemitoText } from './vision.parser';

export type ExtractedFields = Record<string, string>;

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private client: vision.ImageAnnotatorClient | null = null;

  constructor(private readonly config: ConfigService) {
    this.initClient();
  }

  /**
   * Extrae campos estructurados de un documento a partir de su contenido binario.
   *
   * @param buffer     Contenido del archivo (JPG / PNG / WEBP / PDF)
   * @param mimeType   MIME type para que Vision sepa cómo procesarlo
   * @param docType    Tipo de documento para aplicar el parser correcto
   */
  async extractFields(
    buffer: Buffer,
    mimeType: string,
    docType: DocumentType,
  ): Promise<{ fields: ExtractedFields; rawText: string }> {
    if (!this.client) {
      this.logger.warn(
        'VisionService no configurado — devolviendo campos vacíos. ' +
        'Configurar GOOGLE_APPLICATION_CREDENTIALS_JSON o GOOGLE_APPLICATION_CREDENTIALS.',
      );
      return { fields: {}, rawText: '' };
    }

    try {
      const rawText = await this.runTextDetection(buffer, mimeType);

      const parsed =
        docType === DocumentType.FACTURA
          ? parseFacturaText(rawText)
          : parseRemitoText(rawText);

      // Separar rawText de los campos estructurados
      const { rawText: _raw, ...fields } = parsed;
      return { fields: fields as ExtractedFields, rawText };
    } catch (err) {
      this.logger.error(`Error en Vision API: ${(err as Error).message}`);
      throw err;
    }
  }

  // ── Privados ───────────────────────────────────────────────────────────────

  private async runTextDetection(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!this.client) throw new Error('Vision client no inicializado');

    const isPdf = mimeType === 'application/pdf';

    if (isPdf) {
      // Para PDFs usar DOCUMENT_TEXT_DETECTION con el contenido inline
      const [result] = await this.client.documentTextDetection({
        image: { content: buffer.toString('base64') },
      });
      return result.fullTextAnnotation?.text ?? '';
    }

    // Para imágenes usar TEXT_DETECTION (más rápido para documentos de 1 página)
    const [result] = await this.client.textDetection({
      image: { content: buffer.toString('base64') },
    });

    // La primera anotación contiene el texto completo concatenado
    return result.textAnnotations?.[0]?.description ?? '';
  }

  private initClient(): void {
    // Opción B: JSON como env var (Railway)
    const credJson = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS_JSON');
    if (credJson) {
      try {
        const tmpFile = path.join(os.tmpdir(), 'gcloud-service-account.json');
        fs.writeFileSync(tmpFile, credJson, { mode: 0o600 });
        process.env['GOOGLE_APPLICATION_CREDENTIALS'] = tmpFile;
        this.logger.log('Google credentials cargadas desde GOOGLE_APPLICATION_CREDENTIALS_JSON');
      } catch (err) {
        this.logger.error('No se pudo escribir las credentials de Google Vision', err);
        return;
      }
    }

    // Opción A: archivo JSON por env var GOOGLE_APPLICATION_CREDENTIALS (ya seteado arriba o por el usuario)
    const credFile = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS')
      ?? process.env['GOOGLE_APPLICATION_CREDENTIALS'];

    // Opción C: API Key simple
    const apiKey = this.config.get<string>('GOOGLE_VISION_API_KEY');

    if (!credFile && !apiKey) {
      this.logger.warn(
        'Google Vision no configurado. ' +
        'Definir GOOGLE_APPLICATION_CREDENTIALS_JSON, GOOGLE_APPLICATION_CREDENTIALS, ' +
        'o GOOGLE_VISION_API_KEY para habilitar el OCR.',
      );
      return;
    }

    try {
      this.client = apiKey
        ? new vision.ImageAnnotatorClient({ apiKey })
        : new vision.ImageAnnotatorClient();

      this.logger.log('Google Cloud Vision client inicializado');
    } catch (err) {
      this.logger.error('Error al inicializar Vision client', err);
    }
  }
}
