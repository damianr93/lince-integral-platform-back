/**
 * Reglas de validación para certificados de RETENCIÓN (SI.CO.RE. ARCA)
 *
 * Campos requeridos por defecto: cuitEmisor, tipoImpuesto, monto
 */
import { ExtractedFields } from '../../ocr.types';
import { ValidationRule } from './remito.rules';
export declare const RETENCION_RULES: ValidationRule[];
/**
 * Aplica todas las reglas de retención a los campos extraídos.
 */
export declare function validateRetencion(fields: ExtractedFields, requiredFields: string[]): string[];
//# sourceMappingURL=retencion.rules.d.ts.map