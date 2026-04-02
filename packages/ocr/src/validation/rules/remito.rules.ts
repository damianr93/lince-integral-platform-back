/**
 * Reglas de validación para REMITOS
 *
 * Cada regla recibe los campos extraídos y devuelve una lista de errores.
 * Si la lista está vacía → documento VÁLIDO.
 *
 * Los campos requeridos por defecto son: numero, fecha, proveedor.
 * El SUPERADMIN puede sobrescribir la lista desde OcrConfigEntity.
 */

import { ExtractedFields } from '../../vision/vision.service';

export interface ValidationRule {
  field: string;
  validate: (value: string, allFields: ExtractedFields) => string | null;
}

/** Campo requerido: no vacío */
function required(field: string, label: string): ValidationRule {
  return {
    field,
    validate: (v) => (v.trim() ? null : `Campo '${label}' no detectado o vacío`),
  };
}

/** Formato de fecha DD/MM/YYYY o DD-MM-YYYY */
function isValidDate(value: string): boolean {
  return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(value.trim());
}

export const REMITO_RULES: ValidationRule[] = [
  required('numero', 'Número de remito'),
  required('fecha',  'Fecha'),
  required('proveedor', 'Proveedor'),

  // Validación de formato de fecha (si el campo fue detectado)
  {
    field: 'fecha',
    validate: (v) =>
      v && !isValidDate(v)
        ? `Fecha '${v}' no tiene formato válido (DD/MM/YYYY)`
        : null,
  },
];

/**
 * Aplica todas las reglas de remito a los campos extraídos.
 * Permite sobreescribir los campos requeridos desde la DB.
 *
 * @param fields          Campos extraídos por Vision
 * @param requiredFields  Lista de campos obligatorios (de OcrConfigEntity)
 */
export function validateRemito(
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

  // Reglas de formato (solo si el campo existe)
  for (const rule of REMITO_RULES) {
    // No duplicar errores de campos requeridos ya reportados
    if (requiredFields.includes(rule.field) && !fields[rule.field]?.trim()) {
      continue;
    }
    const value = fields[rule.field] ?? '';
    if (!value) continue; // campo opcional y vacío → no aplicar formato
    const error = rule.validate(value, fields);
    if (error) errors.push(error);
  }

  return [...new Set(errors)]; // eliminar duplicados
}
