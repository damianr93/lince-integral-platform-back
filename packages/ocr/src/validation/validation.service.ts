/**
 * ValidationService
 *
 * Orquesta la validación de campos OCR para un documento.
 * Consulta OcrConfigEntity para obtener los campos requeridos dinámicos
 * y delega al set de reglas correspondiente según el tipo de documento.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OcrConfigEntity } from '../entities/ocr-config.entity';
import { DocumentType } from '../enums';
import { ExtractedFields } from '../ocr.types';
import { validateFactura } from './rules/factura.rules';
import { validateRemito } from './rules/remito.rules';
import { validateRetencion } from './rules/retencion.rules';

const VALID_TIPOS_FACTURA = new Set(['A', 'B', 'C', 'M', 'E']);

/**
 * Normaliza los campos extraídos antes de validarlos.
 *
 * Document AI devuelve a veces valores de clasificación interna (ej: "INVOICE_STATEMENT",
 * "INVOICE_A") en lugar del valor real que figura en el documento. Estos valores no
 * representan un error del usuario, sino que OCR no pudo determinar el campo.
 * Se eliminan del objeto para que la validación los trate como "no detectado".
 */
function normalizeExtractedFields(
  fields: ExtractedFields,
  docType: DocumentType,
): ExtractedFields {
  const out: ExtractedFields = { ...fields };

  if (docType === DocumentType.FACTURA) {
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
const DEFAULT_REQUIRED_FIELDS: Record<DocumentType, string[]> = {
  [DocumentType.REMITO]:    ['nroRemito', 'fecha', 'cliente'],
  [DocumentType.FACTURA]:   ['numero', 'fecha', 'proveedor', 'cuit', 'total'],
  [DocumentType.RETENCION]: ['cuitEmisor', 'tipoImpuesto', 'monto'],
};

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(OcrConfigEntity)
    private readonly configRepo: Repository<OcrConfigEntity>,
  ) {}

  /**
   * Valida los campos extraídos por OCR contra las reglas del tipo de documento.
   *
   * @returns Lista de errores (vacía = válido)
   */
  async validate(
    fields: ExtractedFields,
    docType: DocumentType,
  ): Promise<string[]> {
    const requiredFields = await this.getRequiredFields(docType);

    // Normalizar campos que Document AI puede devolver con valores de clasificación
    // propios (ej: "INVOICE_STATEMENT") en lugar del valor real del documento.
    // Si el campo no tiene el formato esperado, se elimina para que sea tratado
    // como "no detectado" en lugar de "formato inválido".
    const normalizedFields = normalizeExtractedFields(fields, docType);

    if (docType === DocumentType.FACTURA)   return validateFactura(normalizedFields, requiredFields);
    if (docType === DocumentType.RETENCION) return validateRetencion(normalizedFields, requiredFields);
    return validateRemito(normalizedFields, requiredFields);
  }

  /**
   * Devuelve los campos requeridos para un tipo de documento.
   * Prioriza la configuración de DB; cae a los defaults si no existe.
   */
  async getRequiredFields(docType: DocumentType): Promise<string[]> {
    const config = await this.configRepo.findOne({ where: { type: docType } });
    return config?.requiredFields ?? DEFAULT_REQUIRED_FIELDS[docType];
  }

  /**
   * Crea o actualiza la configuración de campos requeridos para un tipo.
   * Solo puede llamarlo el SUPERADMIN.
   */
  async upsertConfig(
    docType: DocumentType,
    requiredFields: string[],
    fieldLabels: Record<string, string> = {},
  ): Promise<OcrConfigEntity> {
    await this.configRepo.upsert(
      { type: docType, requiredFields, fieldLabels },
      ['type'],
    );
    return this.configRepo.findOneOrFail({ where: { type: docType } });
  }

  /** Devuelve la configuración actual de ambos tipos de documento */
  async getAllConfigs(): Promise<OcrConfigEntity[]> {
    return this.configRepo.find();
  }
}
