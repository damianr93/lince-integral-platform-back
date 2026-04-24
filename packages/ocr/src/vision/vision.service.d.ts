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
import { ConfigService } from '@nestjs/config';
import { DocumentType } from '../enums';
import type { ExtractedFields } from '../ocr.types';
export type { ExtractedFields } from '../ocr.types';
export declare class VisionService {
    private readonly config;
    private readonly logger;
    private engine;
    private readonly documentAi;
    private documentAiClient;
    private visionClient;
    constructor(config: ConfigService);
    /**
     * Extrae campos estructurados de un documento a partir de su contenido binario.
     */
    extractFields(buffer: Buffer, mimeType: string, docType: DocumentType): Promise<{
        fields: ExtractedFields;
        rawText: string;
    }>;
    private extractWithDocumentAi;
    private getProcessorId;
    private extractFacturaFieldsFromDocumentAi;
    private extractRemitoFieldsFromDocumentAi;
    private extractRetencionFieldsFromDocumentAi;
    /**
     * Busca en el formMap una clave que contenga un número de remito con formato XXXXX-XXXXXXXX.
     * Document AI genera la clave normalizando el texto del campo nombre,
     * así "N° 00014-00012686" queda como "n_00014-00012686".
     */
    private findRemitoNumber;
    /**
     * Busca en el formMap el primer campo cuyo VALUE empieza con el prefijo dado.
     * Útil para campos como "FIRMA" donde el label fue OCR-izado con otra clave.
     */
    private findFieldStartingWith;
    private buildEntityValueMap;
    private buildFormValueMap;
    private extractEntityValue;
    private formatDateValue;
    private formatMoneyValue;
    private pickFirst;
    private extractWithVision;
    private runVisionTextDetection;
    private initGoogleCredentials;
    private initDocumentAiClient;
    private initVisionClient;
    private selectEngine;
}
//# sourceMappingURL=vision.service.d.ts.map