"use strict";
/**
 * ValidationService
 *
 * Orquesta la validación de campos OCR para un documento.
 * Consulta OcrConfigEntity para obtener los campos requeridos dinámicos
 * y delega al set de reglas correspondiente según el tipo de documento.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ocr_config_entity_1 = require("../entities/ocr-config.entity");
const enums_1 = require("../enums");
const factura_rules_1 = require("./rules/factura.rules");
const remito_rules_1 = require("./rules/remito.rules");
const retencion_rules_1 = require("./rules/retencion.rules");
const VALID_TIPOS_FACTURA = new Set(['A', 'B', 'C', 'M', 'E']);
/**
 * Normaliza los campos extraídos antes de validarlos.
 *
 * Document AI devuelve a veces valores de clasificación interna (ej: "INVOICE_STATEMENT",
 * "INVOICE_A") en lugar del valor real que figura en el documento. Estos valores no
 * representan un error del usuario, sino que OCR no pudo determinar el campo.
 * Se eliminan del objeto para que la validación los trate como "no detectado".
 */
function normalizeExtractedFields(fields, docType) {
    const out = { ...fields };
    if (docType === enums_1.DocumentType.FACTURA) {
        const tipo = out['tipo'];
        if (tipo && !VALID_TIPOS_FACTURA.has(tipo.toUpperCase().trim())) {
            // El valor no es una letra argentina válida (A/B/C/M/E) — lo eliminamos.
            // El check de campo requerido reportará "tipo no detectado" si corresponde.
            delete out['tipo'];
        }
    }
    return out;
}
/** Campos requeridos por defecto si no hay configuración en DB */
const DEFAULT_REQUIRED_FIELDS = {
    [enums_1.DocumentType.REMITO]: ['nroRemito', 'fecha', 'cliente'],
    [enums_1.DocumentType.FACTURA]: ['numero', 'fecha', 'proveedor', 'cuit', 'total'],
    [enums_1.DocumentType.RETENCION]: ['cuitEmisor', 'tipoImpuesto', 'monto'],
};
let ValidationService = class ValidationService {
    constructor(configRepo) {
        this.configRepo = configRepo;
    }
    /**
     * Valida los campos extraídos por OCR contra las reglas del tipo de documento.
     *
     * @returns Lista de errores (vacía = válido)
     */
    async validate(fields, docType) {
        const requiredFields = await this.getRequiredFields(docType);
        // Normalizar campos que Document AI puede devolver con valores de clasificación
        // propios (ej: "INVOICE_STATEMENT") en lugar del valor real del documento.
        // Si el campo no tiene el formato esperado, se elimina para que sea tratado
        // como "no detectado" en lugar de "formato inválido".
        const normalizedFields = normalizeExtractedFields(fields, docType);
        if (docType === enums_1.DocumentType.FACTURA)
            return (0, factura_rules_1.validateFactura)(normalizedFields, requiredFields);
        if (docType === enums_1.DocumentType.RETENCION)
            return (0, retencion_rules_1.validateRetencion)(normalizedFields, requiredFields);
        return (0, remito_rules_1.validateRemito)(normalizedFields, requiredFields);
    }
    /**
     * Devuelve los campos requeridos para un tipo de documento.
     * Prioriza la configuración de DB; cae a los defaults si no existe.
     */
    async getRequiredFields(docType) {
        const config = await this.configRepo.findOne({ where: { type: docType } });
        return config?.requiredFields ?? DEFAULT_REQUIRED_FIELDS[docType];
    }
    /**
     * Crea o actualiza la configuración de campos requeridos para un tipo.
     * Solo puede llamarlo el SUPERADMIN.
     */
    async upsertConfig(docType, requiredFields, fieldLabels = {}) {
        await this.configRepo.upsert({ type: docType, requiredFields, fieldLabels }, ['type']);
        return this.configRepo.findOneOrFail({ where: { type: docType } });
    }
    /** Devuelve la configuración actual de ambos tipos de documento */
    async getAllConfigs() {
        return this.configRepo.find();
    }
};
exports.ValidationService = ValidationService;
exports.ValidationService = ValidationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(ocr_config_entity_1.OcrConfigEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ValidationService);
//# sourceMappingURL=validation.service.js.map