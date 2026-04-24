/**
 * Reglas de validación para REMITOS
 *
 * Cada regla recibe los campos extraídos y devuelve una lista de errores.
 * Si la lista está vacía → documento VÁLIDO.
 *
 * Los campos requeridos por defecto son: nroRemito, fecha, cliente.
 * El SUPERADMIN puede sobrescribir la lista desde OcrConfigEntity.
 */
import { ExtractedFields } from '../../ocr.types';
export interface ValidationRule {
    field: string;
    validate: (value: string, allFields: ExtractedFields) => string | null;
}
export declare const REMITO_RULES: ValidationRule[];
/**
 * Aplica todas las reglas de remito a los campos extraídos.
 * Permite sobreescribir los campos requeridos desde la DB.
 *
 * @param fields          Campos extraídos por Vision
 * @param requiredFields  Lista de campos obligatorios (de OcrConfigEntity)
 */
export declare function validateRemito(fields: ExtractedFields, requiredFields: string[]): string[];
//# sourceMappingURL=remito.rules.d.ts.map