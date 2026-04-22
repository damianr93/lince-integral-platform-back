/**
 * VisionService — Motor OCR configurable (Document AI / Vision API)
 *
 * Mantiene la interfaz histórica del módulo (`extractFields`) para no romper
 * el resto del código, pero ahora soporta dos engines:
 *
 *  - Document AI (recomendado): parser especializado de facturas y extractor
 *    custom/form para remitos.
 *  - Vision API (fallback): OCR de texto + parseo por regex.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import * as vision from '@google-cloud/vision';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DocumentType } from '../enums';
import type { ExtractedFields } from '../ocr.types';
import { parseFacturaText, parseRemitoText, parseRetencionText } from './vision.parser';

export type { ExtractedFields } from '../ocr.types';

type OcrEngine = 'documentai' | 'vision';

interface DocumentAiConfig {
  projectId:           string;
  location:            string;
  facturaProcessorId:  string;
  remitoProcessorId:   string;
  retencionProcessorId: string;
  ocrProcessorId:      string;
}

interface ProcessedDocument {
  text?: string;
  entities?: unknown[];
  pages?: unknown[];
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);

  private engine: OcrEngine = 'documentai';

  private readonly documentAi: DocumentAiConfig;
  private documentAiClient: DocumentProcessorServiceClient | null = null;


  private visionClient: vision.ImageAnnotatorClient | null = null;

  constructor(private readonly config: ConfigService) {
    this.documentAi = {
      projectId:            this.config.get<string>('OCR_DOCUMENT_AI_PROJECT_ID', '').trim(),
      location:             this.config.get<string>('OCR_DOCUMENT_AI_LOCATION', 'us').trim() || 'us',
      facturaProcessorId:   this.config.get<string>('OCR_DOCUMENT_AI_FACTURA_PROCESSOR_ID', '').trim(),
      remitoProcessorId:    this.config.get<string>('OCR_DOCUMENT_AI_REMITO_PROCESSOR_ID', '').trim(),
      retencionProcessorId: this.config.get<string>('OCR_DOCUMENT_AI_RETENCION_PROCESSOR_ID', '').trim(),
      ocrProcessorId:       this.config.get<string>('OCR_DOCUMENT_AI_OCR_PROCESSOR_ID', '').trim(),
    };

    this.initGoogleCredentials();
    this.initDocumentAiClient();
    this.initVisionClient();
    this.selectEngine();
  }

  /**
   * Extrae campos estructurados de un documento a partir de su contenido binario.
   */
  async extractFields(
    buffer: Buffer,
    mimeType: string,
    docType: DocumentType,
  ): Promise<{ fields: ExtractedFields; rawText: string }> {
    if (this.engine === 'documentai' && this.documentAiClient) {
      try {
        return await this.extractWithDocumentAi(buffer, mimeType, docType);
      } catch (err) {
        this.logger.error(`Document AI falló: ${(err as Error).message}`);
        if (this.visionClient) {
          this.logger.warn('Fallback automático a Vision API');
          return this.extractWithVision(buffer, mimeType, docType);
        }
        throw err;
      }
    }

    if (this.visionClient) {
      return this.extractWithVision(buffer, mimeType, docType);
    }

    this.logger.warn(
      'OCR no configurado. Definir variables de Document AI o Vision para habilitar extracción.',
    );

    return { fields: {}, rawText: '' };
  }

  // ── Document AI ───────────────────────────────────────────────────────────

  private async extractWithDocumentAi(
    buffer: Buffer,
    mimeType: string,
    docType: DocumentType,
  ): Promise<{ fields: ExtractedFields; rawText: string }> {
    const processorId = this.getProcessorId(docType);

    if (!processorId) {
      throw new Error(
        `No hay processor configurado para ${docType}. Definir OCR_DOCUMENT_AI_${docType}_PROCESSOR_ID o OCR_DOCUMENT_AI_OCR_PROCESSOR_ID.`,
      );
    }

    if (!this.documentAiClient) {
      throw new Error('Document AI client no inicializado');
    }

    const name = this.documentAiClient.processorPath(
      this.documentAi.projectId,
      this.documentAi.location,
      processorId,
    );

    const [result] = await this.documentAiClient.processDocument({
      name,
      rawDocument: {
        content: buffer.toString('base64'),
        mimeType,
      },
    });

    const doc = (result.document ?? {}) as ProcessedDocument;
    const rawText = normalizeText(doc.text ?? '');

    const primary =
      docType === DocumentType.FACTURA
        ? this.extractFacturaFieldsFromDocumentAi(doc)
        : docType === DocumentType.RETENCION
        ? this.extractRetencionFieldsFromDocumentAi(doc)
        : this.extractRemitoFieldsFromDocumentAi(doc);

    // Fallback conservador: si falta algo, intentamos completar con regex sobre texto OCR.
    const parsedByText =
      docType === DocumentType.FACTURA
        ? parseFacturaText(rawText)
        : docType === DocumentType.RETENCION
        ? parseRetencionText(rawText)
        : parseRemitoText(rawText);

    const { rawText: _unusedRaw, ...fallbackFields } = parsedByText;
    void _unusedRaw;

    const merged = mergeFields(primary, fallbackFields as ExtractedFields);

    return { fields: merged, rawText };
  }

  private getProcessorId(docType: DocumentType): string {
    if (docType === DocumentType.FACTURA) {
      return this.documentAi.facturaProcessorId || this.documentAi.ocrProcessorId;
    }
    if (docType === DocumentType.RETENCION) {
      return this.documentAi.retencionProcessorId || this.documentAi.ocrProcessorId;
    }
    return this.documentAi.remitoProcessorId || this.documentAi.ocrProcessorId;
  }

  private extractFacturaFieldsFromDocumentAi(doc: ProcessedDocument): ExtractedFields {
    const entityMap = this.buildEntityValueMap(doc);

    const fields: ExtractedFields = {
      numero: this.pickFirst(entityMap, ['invoice_id', 'invoice_number', 'numero']),
      fecha: this.pickFirst(entityMap, ['invoice_date', 'fecha']),
      proveedor: this.pickFirst(entityMap, ['supplier_name', 'vendor_name', 'proveedor']),
      cuit: normalizeCuit(this.pickFirst(entityMap, ['supplier_tax_id', 'tax_id', 'cuit'])),
      neto: this.pickFirst(entityMap, ['net_amount', 'subtotal_amount', 'base_imponible', 'neto']),
      iva: this.pickFirst(entityMap, ['total_tax_amount', 'tax_amount', 'vat/amount', 'iva']),
      total: this.pickFirst(entityMap, ['total_amount', 'amount_due', 'importe_total', 'total']),
      // Document AI puede devolver valores como INVOICE_STATEMENT, INVOICE, etc.
      // Si no es una letra argentina válida (A/B/C/M/E), devolvemos vacío para
      // que el fallback de regex sobre el texto crudo lo complete correctamente.
      tipo: normalizeTipoFactura(this.pickFirst(entityMap, ['invoice_type', 'tipo'])),
    };

    return pruneEmpty(fields);
  }

  private extractRemitoFieldsFromDocumentAi(doc: ProcessedDocument): ExtractedFields {
    const formMap = this.buildFormValueMap(doc);

    const form = (aliases: string[]) => this.pickFirst(formMap, aliases);

    // Número de remito: Document AI lo detecta como campo "n_00014-00012686" o similar.
    // Buscamos cualquier clave que contenga el patrón XXXXX-XXXXXXXX.
    const nroRaw = this.findRemitoNumber(formMap);
    const [ptoVenta = '', nroRemito = ''] = nroRaw ? nroRaw.split(/[-–]/) : [];

    // Lugar de entrega: OCR puede leer "LUGAR" como "JGAR" — buscamos ambas variantes.
    const lugarEntrega = form([
      'lugar_de_entrega', 'jgar_de_entrega', 'luga_de_entrega',
      'lugar_entrega', 'lugar_de_entreg',
    ]);

    // Firma: si el campo "firma" tiene contenido (nombre/DNI), está firmado.
    // El campo suele estar bajo clave "on" porque OCR lee mal el label.
    // Buscamos cualquier campo cuyo valor empiece con "FIRMA".
    const firmaVal = this.findFieldStartingWith(formMap, 'FIRMA');
    const firmado  = firmaVal && firmaVal.trim().length > 6 ? 'si' : '';

    // CUIT cliente: campo "CUIT N" → clave normalizada "cuit_n"
    const cuitCliente = normalizeCuit(form(['cuit_n', 'cuit_cliente']));

    // CUIT transportista: campo "C.U.I.T.:" → clave normalizada "c_u_i_t"
    const cuitTransportista = normalizeCuit(form(['c_u_i_t', 'c_u_i_t_', 'cuit_transportista']));

    // Domicilio transportista: campo "Domicilio:" (con dos puntos) → clave "domicilio"
    // El cliente usa "Domicilio" sin dos puntos — misma clave normalizada pero
    // el transportista suele aparecer primero en el form. Lo dejamos para Document AI
    // y la regex fallback corrige el del cliente.
    const domicilioTransportista = form(['domicilio']);

    // Camión: campo "Camión:" → clave "cami_n" (ó normalizada a _)
    const camion = form(['cami_n', 'camion', 'cam_n']);

    // Nro. mercadería retirada en planta: campo largo → extraemos el código "R..."
    const mercaderiaRaw = form([
      'merced_a_retirada_de_planta',
      'mercader_a_retirada_de_planta',
      'mercanc_a_retirada_de_planta',
      'mercaderia_retirada_de_planta',
    ]);
    const nroMercaderia = (/R\d{4}-\d{5,8}/.exec(mercaderiaRaw) ?? [])[0] ?? '';

    // Nota: "cliente" y "domicilioCliente" se omiten intencionalmente — el fallback
    // de regex los extrae correctamente (Document AI invierte key/value en esa sección).
    const fields: ExtractedFields = {
      fecha:                  form(['fecha']),
      ptoVenta:               ptoVenta.trim(),
      nroRemito:              nroRemito.trim(),
      cuitCliente,
      lugarEntrega,
      nroMercaderia,
      firmado,
      chofer:                 (form(['chofer']) || '').replace(/\s*\(\d+\)\s*$/, '').trim(),
      camion,
      batea:                  form(['batea']),
      cuitTransportista,
      domicilioTransportista,
    };

    return pruneEmpty(fields);
  }

  private extractRetencionFieldsFromDocumentAi(doc: ProcessedDocument): ExtractedFields {
    const entityMap = this.buildEntityValueMap(doc);
    const formMap   = this.buildFormValueMap(doc);

    // CUIT del Agente de Retención — puede aparecer como supplier_tax_id o campo de formulario
    const cuitRaw =
      this.pickFirst(entityMap, ['supplier_tax_id', 'tax_id', 'cuit_agente', 'cuit']) ||
      this.pickFirst(formMap,   ['c_u_i_t_n', 'cuit_n', 'c_u_i_t', 'cuit']);

    // Tipo de impuesto — campo "Impuesto" en sección C
    const impuestoRaw =
      this.pickFirst(entityMap, ['impuesto', 'tax_type', 'income_tax_type']) ||
      this.pickFirst(formMap,   ['impuesto']);

    // Monto de la retención
    const montoRaw =
      this.pickFirst(entityMap, ['monto_retencion', 'retention_amount', 'total_tax_amount', 'tax_amount']) ||
      this.pickFirst(formMap,   ['monto_de_la_retenci_n', 'monto_retencion', 'monto']);

    return pruneEmpty({
      cuitEmisor:   normalizeCuit(cuitRaw),
      tipoImpuesto: classifyImpuesto(impuestoRaw),
      monto:        montoRaw,
    });
  }

  /**
   * Busca en el formMap una clave que contenga un número de remito con formato XXXXX-XXXXXXXX.
   * Document AI genera la clave normalizando el texto del campo nombre,
   * así "N° 00014-00012686" queda como "n_00014-00012686".
   */
  private findRemitoNumber(formMap: Map<string, string>): string {
    const pattern = /\d{4,5}[-–]\d{6,8}/;

    for (const key of formMap.keys()) {
      const m = pattern.exec(key);
      if (m) return m[0];
    }

    // También puede aparecer como valor del campo "remito" o "n"
    for (const [key, value] of formMap.entries()) {
      if (/^(remito|n[°o]?)$/.test(key)) {
        const m = pattern.exec(value);
        if (m) return m[0];
      }
    }

    return '';
  }

  /**
   * Busca en el formMap el primer campo cuyo VALUE empieza con el prefijo dado.
   * Útil para campos como "FIRMA" donde el label fue OCR-izado con otra clave.
   */
  private findFieldStartingWith(formMap: Map<string, string>, prefix: string): string {
    const p = prefix.toUpperCase();
    for (const value of formMap.values()) {
      if (value.trimStart().toUpperCase().startsWith(p)) return value;
    }
    return '';
  }

  private buildEntityValueMap(doc: ProcessedDocument): Map<string, string> {
    const map = new Map<string, string>();
    const queue: unknown[] = Array.isArray(doc.entities) ? [...doc.entities] : [];

    while (queue.length > 0) {
      const entity = queue.shift() as Record<string, unknown> | undefined;
      if (!entity) continue;

      const typeRaw = asTrimmedString(entity.type);
      const key = normalizeKey(typeRaw);
      const value = this.extractEntityValue(entity);

      if (key && value && !map.has(key)) {
        map.set(key, value);
      }

      const properties = entity.properties;
      if (Array.isArray(properties)) {
        queue.push(...properties);
      }
    }

    return map;
  }

  private buildFormValueMap(doc: ProcessedDocument): Map<string, string> {
    const map = new Map<string, string>();
    const pages = Array.isArray(doc.pages) ? doc.pages : [];
    const fullText = doc.text ?? '';

    for (const page of pages) {
      const formFields = asArray((page as { formFields?: unknown[] }).formFields);

      for (const rawField of formFields) {
        const field = rawField as {
          fieldName?: { textAnchor?: unknown };
          fieldValue?: { textAnchor?: unknown };
        };

        const keyText = normalizeKey(
          extractAnchorText(field.fieldName?.textAnchor, fullText),
        );

        const valueText = normalizeText(
          extractAnchorText(field.fieldValue?.textAnchor, fullText),
        );

        if (keyText && valueText && !map.has(keyText)) {
          map.set(keyText, valueText);
        }
      }
    }

    return map;
  }

  private extractEntityValue(entity: Record<string, unknown>): string {
    const normalizedValue = (entity.normalizedValue ?? {}) as Record<string, unknown>;

    const normalizedText = asTrimmedString(normalizedValue.text);
    if (normalizedText) return normalizedText;

    const date = this.formatDateValue(normalizedValue.dateValue);
    if (date) return date;

    const money = this.formatMoneyValue(normalizedValue.moneyValue);
    if (money) return money;

    const integer = normalizedValue.integerValue;
    if (typeof integer === 'number') return String(integer);

    const float = normalizedValue.floatValue;
    if (typeof float === 'number') return stripTrailingZeros(String(float));

    const bool = normalizedValue.booleanValue;
    if (typeof bool === 'boolean') return bool ? 'true' : 'false';

    return asTrimmedString(entity.mentionText);
  }

  private formatDateValue(value: unknown): string {
    if (!value || typeof value !== 'object') return '';

    const date = value as {
      day?: number;
      month?: number;
      year?: number;
    };

    const day = typeof date.day === 'number' ? date.day : 0;
    const month = typeof date.month === 'number' ? date.month : 0;
    const year = typeof date.year === 'number' ? date.year : 0;

    if (!day || !month || !year) return '';

    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  private formatMoneyValue(value: unknown): string {
    if (!value || typeof value !== 'object') return '';

    const money = value as {
      units?: number | string | bigint;
      nanos?: number;
    };

    const unitsRaw = money.units;
    const nanosRaw = typeof money.nanos === 'number' ? money.nanos : 0;

    if (unitsRaw == null && !nanosRaw) return '';

    const units = Number(unitsRaw ?? 0);
    const decimals = Math.abs(nanosRaw / 1_000_000_000);

    if (Number.isNaN(units)) return '';

    const sign = units < 0 || nanosRaw < 0 ? -1 : 1;
    const absolute = Math.abs(units) + decimals;
    return stripTrailingZeros(String(sign * absolute));
  }

  private pickFirst(map: Map<string, string>, aliases: string[]): string {
    for (const alias of aliases) {
      const v = map.get(normalizeKey(alias));
      if (v && v.trim()) return v.trim();
    }
    return '';
  }

  // ── Vision API (fallback) ────────────────────────────────────────────────

  private async extractWithVision(
    buffer: Buffer,
    mimeType: string,
    docType: DocumentType,
  ): Promise<{ fields: ExtractedFields; rawText: string }> {
    if (!this.visionClient) {
      throw new Error('Vision client no inicializado');
    }

    const rawText = await this.runVisionTextDetection(buffer, mimeType);

    const parsed =
      docType === DocumentType.FACTURA
        ? parseFacturaText(rawText)
        : docType === DocumentType.RETENCION
        ? parseRetencionText(rawText)
        : parseRemitoText(rawText);

    const { rawText: _raw, ...fields } = parsed;
    void _raw;

    return { fields: fields as ExtractedFields, rawText };
  }

  private async runVisionTextDetection(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!this.visionClient) throw new Error('Vision client no inicializado');

    const isPdf = mimeType === 'application/pdf';

    if (isPdf) {
      const [result] = await this.visionClient.documentTextDetection({
        image: { content: buffer.toString('base64') },
      });
      return result.fullTextAnnotation?.text ?? '';
    }

    const [result] = await this.visionClient.textDetection({
      image: { content: buffer.toString('base64') },
    });

    return result.textAnnotations?.[0]?.description ?? '';
  }

  // ── Inicialización ────────────────────────────────────────────────────────

  private initGoogleCredentials(): void {
    const credJson = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS_JSON');
    if (!credJson) return;

    try {
      const tmpFile = path.join(os.tmpdir(), 'gcloud-service-account.json');
      fs.writeFileSync(tmpFile, credJson, { mode: 0o600 });
      process.env['GOOGLE_APPLICATION_CREDENTIALS'] = tmpFile;
      this.logger.log('Google credentials cargadas desde GOOGLE_APPLICATION_CREDENTIALS_JSON');
    } catch (err) {
      this.logger.error('No se pudo escribir las credentials de Google', err);
    }
  }

  private initDocumentAiClient(): void {
    const hasProcessorConfigured =
      !!this.documentAi.facturaProcessorId ||
      !!this.documentAi.remitoProcessorId ||
      !!this.documentAi.ocrProcessorId;

    if (!this.documentAi.projectId || !hasProcessorConfigured) {
      this.logger.warn(
        'Document AI no configurado. Definir OCR_DOCUMENT_AI_PROJECT_ID y al menos un processor ID.',
      );
      return;
    }

    try {
      this.documentAiClient = new DocumentProcessorServiceClient();
      this.logger.log(
        `Document AI client inicializado (${this.documentAi.location})`,
      );
    } catch (err) {
      this.logger.error('Error al inicializar Document AI client', err);
    }
  }

  private initVisionClient(): void {
    const credFile =
      this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ??
      process.env['GOOGLE_APPLICATION_CREDENTIALS'];

    const apiKey = this.config.get<string>('GOOGLE_VISION_API_KEY');

    if (!credFile && !apiKey) {
      return;
    }

    try {
      this.visionClient = apiKey
        ? new vision.ImageAnnotatorClient({ apiKey })
        : new vision.ImageAnnotatorClient();

      this.logger.log('Vision API client inicializado');
    } catch (err) {
      this.logger.error('Error al inicializar Vision client', err);
    }
  }

  private selectEngine(): void {
    const preferredRaw = this.config.get<string>('OCR_ENGINE', 'documentai');
    const preferred = preferredRaw.trim().toLowerCase();

    if (preferred === 'vision') {
      if (this.visionClient) {
        this.engine = 'vision';
        this.logger.log('OCR engine activo: Vision API');
        return;
      }

      if (this.documentAiClient) {
        this.engine = 'documentai';
        this.logger.warn('OCR_ENGINE=vision pero Vision no está configurado. Se usa Document AI.');
        return;
      }

      this.logger.warn('Sin engine OCR disponible (Vision/Document AI)');
      return;
    }

    if (this.documentAiClient) {
      this.engine = 'documentai';
      this.logger.log('OCR engine activo: Document AI');
      return;
    }

    if (this.visionClient) {
      this.engine = 'vision';
      this.logger.warn('Document AI no disponible. Se usa Vision API como fallback.');
      return;
    }

    this.logger.warn('Sin engine OCR disponible (Document AI/Vision)');
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

function normalizeKey(raw: string): string {
  return normalizeText(raw)
    .toLowerCase()
    .replace(/[^a-z0-9_\-/]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function asTrimmedString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function extractAnchorText(anchor: unknown, fullText: string): string {
  if (!anchor || typeof anchor !== 'object') return '';

  const textAnchor = anchor as {
    textSegments?: Array<{ startIndex?: string | number; endIndex?: string | number }>;
    content?: string;
  };

  const directContent = asTrimmedString(textAnchor.content);
  if (directContent) return directContent;

  const segments = asArray(textAnchor.textSegments);
  if (segments.length === 0 || !fullText) return '';

  const chunks: string[] = [];
  for (const seg of segments) {
    const start = Number(seg.startIndex ?? 0);
    const end = Number(seg.endIndex ?? 0);

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;
    chunks.push(fullText.slice(start, end));
  }

  return normalizeText(chunks.join(' '));
}

function mergeFields(primary: ExtractedFields, fallback: ExtractedFields): ExtractedFields {
  const merged: ExtractedFields = { ...fallback };

  for (const [key, value] of Object.entries(primary)) {
    if (value?.trim()) {
      merged[key] = value.trim();
    }
  }

  return pruneEmpty(merged);
}

function pruneEmpty(fields: ExtractedFields): ExtractedFields {
  const out: ExtractedFields = {};

  for (const [key, value] of Object.entries(fields)) {
    const clean = value?.trim();
    if (clean) out[key] = clean;
  }

  return out;
}

function stripTrailingZeros(value: string): string {
  if (!value.includes('.')) return value;
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function normalizeCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

/** Clasifica el campo impuesto en "GANANCIAS" | "IIBB" | "" */
function classifyImpuesto(raw: string): string {
  if (!raw) return '';
  if (/Ingresos?\s+Brutos?|I\.?I\.?B\.?B\.?/i.test(raw)) return 'IIBB';
  if (/Ganancias/i.test(raw)) return 'GANANCIAS';
  return '';
}

/**
 * Normaliza el valor del tipo de factura devuelto por Document AI.
 * Document AI puede retornar valores como "INVOICE_STATEMENT", "INVOICE", etc.
 * Solo se acepta la letra argentina (A/B/C/M/E); cualquier otro valor
 * retorna vacío para que el fallback regex lo complete desde el texto crudo.
 */
function normalizeTipoFactura(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (/^[ABCME]$/.test(upper)) return upper;
  return '';
}
