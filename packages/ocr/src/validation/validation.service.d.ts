/**
 * ValidationService
 *
 * Orquesta la validación de campos OCR para un documento.
 * Consulta OcrConfigEntity para obtener los campos requeridos dinámicos
 * y delega al set de reglas correspondiente según el tipo de documento.
 */
import { Repository } from 'typeorm';
import { OcrConfigEntity } from '../entities/ocr-config.entity';
import { DocumentType } from '../enums';
import { ExtractedFields } from '../ocr.types';
export declare class ValidationService {
    private readonly configRepo;
    constructor(configRepo: Repository<OcrConfigEntity>);
    /**
     * Valida los campos extraídos por OCR contra las reglas del tipo de documento.
     *
     * @returns Lista de errores (vacía = válido)
     */
    validate(fields: ExtractedFields, docType: DocumentType): Promise<string[]>;
    /**
     * Devuelve los campos requeridos para un tipo de documento.
     * Prioriza la configuración de DB; cae a los defaults si no existe.
     */
    getRequiredFields(docType: DocumentType): Promise<string[]>;
    /**
     * Crea o actualiza la configuración de campos requeridos para un tipo.
     * Solo puede llamarlo el SUPERADMIN.
     */
    upsertConfig(docType: DocumentType, requiredFields: string[], fieldLabels?: Record<string, string>): Promise<OcrConfigEntity>;
    /** Devuelve la configuración actual de ambos tipos de documento */
    getAllConfigs(): Promise<OcrConfigEntity[]>;
}
//# sourceMappingURL=validation.service.d.ts.map