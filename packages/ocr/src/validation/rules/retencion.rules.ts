/**
 * Reglas de validación para certificados de RETENCIÓN (SI.CO.RE. ARCA)
 *
 * Campos requeridos por defecto: cuitEmisor, tipoImpuesto, monto
 */

import { ExtractedFields } from '../../ocr.types';
import { ValidationRule } from './remito.rules';

/** CUIT argentino: 11 dígitos con dígito verificador válido (algoritmo AFIP). */
function isValidCuit(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{11}$/.test(digits)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * +digits[i], 0);
  const rem = sum % 11;
  const check = rem === 0 ? 0 : 11 - rem;
  if (check === 10) return false;
  return check === +digits[10];
}

/** Importe: número con puntos/comas como separadores */
function isValidAmount(value: string): boolean {
  return /^\d[\d.,]*$/.test(value.replace(/\s/g, ''));
}

/** Tipos de impuesto válidos para retenciones */
const VALID_TIPOS = new Set(['GANANCIAS', 'IIBB']);

export const RETENCION_RULES: ValidationRule[] = [
  {
    field: 'cuitEmisor',
    validate: (v) =>
      v && !isValidCuit(v)
        ? `CUIT '${v}' inválido — 11 dígitos requeridos con dígito verificador correcto`
        : null,
  },
  {
    field: 'tipoImpuesto',
    validate: (v) =>
      v && !VALID_TIPOS.has(v.toUpperCase())
        ? `Tipo de impuesto '${v}' inválido — debe ser GANANCIAS o IIBB`
        : null,
  },
  {
    field: 'monto',
    validate: (v) =>
      v && !isValidAmount(v)
        ? `Monto '${v}' no es un número válido`
        : null,
  },
];

/**
 * Aplica todas las reglas de retención a los campos extraídos.
 */
export function validateRetencion(
  fields: ExtractedFields,
  requiredFields: string[],
): string[] {
  const errors: string[] = [];

  for (const field of requiredFields) {
    const value = fields[field] ?? '';
    if (!value.trim()) {
      errors.push(`Campo requerido '${field}' no detectado o vacío`);
    }
  }

  for (const rule of RETENCION_RULES) {
    if (requiredFields.includes(rule.field) && !fields[rule.field]?.trim()) {
      continue;
    }
    const value = fields[rule.field] ?? '';
    if (!value) continue;
    const error = rule.validate(value, fields);
    if (error) errors.push(error);
  }

  return [...new Set(errors)];
}
