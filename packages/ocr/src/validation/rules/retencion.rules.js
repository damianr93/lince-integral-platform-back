"use strict";
/**
 * Reglas de validación para certificados de RETENCIÓN (SI.CO.RE. ARCA)
 *
 * Campos requeridos por defecto: cuitEmisor, tipoImpuesto, monto
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETENCION_RULES = void 0;
exports.validateRetencion = validateRetencion;
/** CUIT argentino: XX-XXXXXXXX-X o XXXXXXXXXXX (11 dígitos) */
function isValidCuit(value) {
    const digits = value.replace(/[-\s]/g, '');
    return /^\d{11}$/.test(digits);
}
/** Importe: número con puntos/comas como separadores */
function isValidAmount(value) {
    return /^\d[\d.,]*$/.test(value.replace(/\s/g, ''));
}
/** Tipos de impuesto válidos para retenciones */
const VALID_TIPOS = new Set(['GANANCIAS', 'IIBB']);
exports.RETENCION_RULES = [
    {
        field: 'cuitEmisor',
        validate: (v) => v && !isValidCuit(v)
            ? `CUIT '${v}' inválido — debe tener 11 dígitos (XX-XXXXXXXX-X)`
            : null,
    },
    {
        field: 'tipoImpuesto',
        validate: (v) => v && !VALID_TIPOS.has(v.toUpperCase())
            ? `Tipo de impuesto '${v}' inválido — debe ser GANANCIAS o IIBB`
            : null,
    },
    {
        field: 'monto',
        validate: (v) => v && !isValidAmount(v)
            ? `Monto '${v}' no es un número válido`
            : null,
    },
];
/**
 * Aplica todas las reglas de retención a los campos extraídos.
 */
function validateRetencion(fields, requiredFields) {
    const errors = [];
    for (const field of requiredFields) {
        const value = fields[field] ?? '';
        if (!value.trim()) {
            errors.push(`Campo requerido '${field}' no detectado o vacío`);
        }
    }
    for (const rule of exports.RETENCION_RULES) {
        if (requiredFields.includes(rule.field) && !fields[rule.field]?.trim()) {
            continue;
        }
        const value = fields[rule.field] ?? '';
        if (!value)
            continue;
        const error = rule.validate(value, fields);
        if (error)
            errors.push(error);
    }
    return [...new Set(errors)];
}
//# sourceMappingURL=retencion.rules.js.map