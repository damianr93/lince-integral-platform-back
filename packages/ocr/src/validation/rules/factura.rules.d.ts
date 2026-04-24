/**
 * Reglas de validación para FACTURAS argentinas
 *
 * Aplica validaciones de formato propias del sistema impositivo argentino
 * (CUIT, número de comprobante, tipos de factura).
 */
import { ExtractedFields } from '../../ocr.types';
import { ValidationRule } from './remito.rules';
export declare const FACTURA_RULES: ValidationRule[];
/**
 * Aplica todas las reglas de factura a los campos extraídos.
 *
 * @param fields          Campos extraídos por Vision
 * @param requiredFields  Lista de campos obligatorios (de OcrConfigEntity)
 */
export declare function validateFactura(fields: ExtractedFields, requiredFields: string[]): string[];
//# sourceMappingURL=factura.rules.d.ts.map