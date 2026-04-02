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
import { ExtractedFields } from '../vision/vision.service';
import { validateFactura } from './rules/factura.rules';
import { validateRemito } from './rules/remito.rules';

/** Campos requeridos por defecto si no hay configuración en DB */
const DEFAULT_REQUIRED_FIELDS: Record<DocumentType, string[]> = {
  [DocumentType.REMITO]:  ['numero', 'fecha', 'proveedor'],
  [DocumentType.FACTURA]: ['numero', 'fecha', 'proveedor', 'cuit', 'total'],
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

    return docType === DocumentType.FACTURA
      ? validateFactura(fields, requiredFields)
      : validateRemito(fields, requiredFields);
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
