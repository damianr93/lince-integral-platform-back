/**
 * Reglas de validación para FACTURAS argentinas
 *
 * Aplica validaciones de formato propias del sistema impositivo argentino
 * (CUIT, número de comprobante, tipos de factura).
 */

import { ExtractedFields } from '../../ocr.types';
import { ValidationRule } from './remito.rules';

/** CUIT argentino: XX-XXXXXXXX-X o XXXXXXXXXXX (11 dígitos) */
function isValidCuit(value: string): boolean {
  const digits = value.replace(/[\-\s]/g, '');
  return /^\d{11}$/.test(digits);
}

/** Número de comprobante AFIP: XXXX-XXXXXXXX */
function isValidFacturaNumber(value: string): boolean {
  return /^\d{1,4}[-\s]\d{6,8}$/.test(value.trim());
}

/** Tipos de comprobante válidos en Argentina */
const VALID_TIPOS = new Set(['A', 'B', 'C', 'M', 'E']);

/** Importe: número con puntos/comas como separadores */
function isValidAmount(value: string): boolean {
  return /^\d[\d.,]*$/.test(value.replace(/\s/g, ''));
}

export const FACTURA_RULES: ValidationRule[] = [
  // Formato número de comprobante
  {
    field: 'numero',
    validate: (v) =>
      v && !isValidFacturaNumber(v)
        ? `Número de factura '${v}' no tiene formato XXXX-XXXXXXXX`
        : null,
  },

  // Formato CUIT
  {
    field: 'cuit',
    validate: (v) =>
      v && !isValidCuit(v)
        ? `CUIT '${v}' inválido — debe tener 11 dígitos (XX-XXXXXXXX-X)`
        : null,
  },

  // Tipo de comprobante
  {
    field: 'tipo',
    validate: (v) =>
      v && !VALID_TIPOS.has(v.toUpperCase())
        ? `Tipo de factura '${v}' inválido — debe ser A, B, C, M o E`
        : null,
  },

  // Formato importe total
  {
    field: 'total',
    validate: (v) =>
      v && !isValidAmount(v)
        ? `Importe total '${v}' no es un número válido`
        : null,
  },

  // Formato importe neto
  {
    field: 'neto',
    validate: (v) =>
      v && !isValidAmount(v)
        ? `Importe neto '${v}' no es un número válido`
        : null,
  },
];

/**
 * Aplica todas las reglas de factura a los campos extraídos.
 *
 * @param fields          Campos extraídos por Vision
 * @param requiredFields  Lista de campos obligatorios (de OcrConfigEntity)
 */
export function validateFactura(
  fields: ExtractedFields,
  requiredFields: string[],
): string[] {
  const errors: string[] = [];

  // Campos requeridos dinámicos (de DB)
  for (const field of requiredFields) {
    const value = fields[field] ?? '';
    if (!value.trim()) {
      errors.push(`Campo requerido '${field}' no detectado o vacío`);
    }
  }

  // Reglas de formato (solo si el campo fue detectado)
  for (const rule of FACTURA_RULES) {
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
