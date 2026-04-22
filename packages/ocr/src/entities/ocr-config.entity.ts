import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentType } from '../enums';

/**
 * Configuración de campos requeridos por tipo de documento.
 * SUPERADMIN puede modificar qué campos son obligatorios para cada tipo.
 *
 * Una fila por DocumentType. Se inicializa con valores por defecto en el seed.
 */
@Entity('ocr_config')
export class OcrConfigEntity {
  /** DocumentType como PK — solo hay una config por tipo */
  @PrimaryColumn({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  /**
   * Lista de campos que deben estar presentes y no vacíos tras el OCR.
   * Si alguno falta → status CON_ERRORES.
   *
   * Defaults:
   *   REMITO:  ['nroRemito', 'fecha', 'cliente']
   *   FACTURA: ['numero', 'fecha', 'proveedor', 'cuit', 'total']
   */
  @Column({ name: 'required_fields', type: 'jsonb' })
  requiredFields: string[];

  /** Descripción libre de cada campo (para mostrar en la UI) */
  @Column({ name: 'field_labels', type: 'jsonb', default: '{}' })
  fieldLabels: Record<string, string>;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
