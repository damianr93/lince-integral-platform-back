import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentStatus, DocumentType, OcrRole } from '../enums';

/**
 * Tabla principal del módulo OCR.
 * Almacena metadatos de remitos y facturas.
 * El archivo binario vive en AWS S3 (s3Key).
 * Los campos extraídos por el engine OCR se guardan en extractedData (JSONB).
 */
@Entity('ocr_documents')
@Index(['uploadedBy'])
@Index(['status'])
@Index(['type', 'status'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Tipo y estado ──────────────────────────────────────────────────────────

  @Column({ type: 'enum', enum: DocumentType })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDIENTE,
  })
  status: DocumentStatus;

  // ── Quién subió el documento ───────────────────────────────────────────────

  /** UUID del usuario que subió el documento */
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  /** Rol OCR del usuario en el momento de la carga */
  @Column({ name: 'uploaded_by_role', type: 'enum', enum: OcrRole })
  uploadedByRole: OcrRole;

  // ── S3 ────────────────────────────────────────────────────────────────────

  /** Clave del objeto original en S3 (ej: "ocr/remitos/2026/uuid.jpg") */
  @Column({ name: 's3_key' })
  s3Key: string;

  /** Clave del thumbnail en S3 — se genera de forma asíncrona (nullable hasta generarse) */
  @Column({ name: 's3_thumbnail_key', nullable: true, type: 'varchar' })
  s3ThumbnailKey: string | null;

  // ── OCR ───────────────────────────────────────────────────────────────────

  /**
   * Campos extraídos por el engine OCR.
   * Para REMITO: { numero, fecha, proveedor, destinatario, productos, total }
   * Para FACTURA: { numero, fecha, proveedor, cuit, neto, iva, total, tipo }
   */
  @Column({ name: 'extracted_data', type: 'jsonb', nullable: true })
  extractedData: Record<string, string> | null;

  /**
   * Lista de errores de validación detectados.
   * Ej: ["Campo 'cuit' no detectado", "Campo 'total' inválido"]
   */
  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  validationErrors: string[] | null;

  // ── Corrección (ADMINISTRATIVO) ────────────────────────────────────────────

  /** UUID del usuario que corrigió los campos */
  @Column({ name: 'corrected_by', type: 'uuid', nullable: true })
  correctedBy: string | null;

  @Column({ name: 'corrected_at', type: 'timestamptz', nullable: true })
  correctedAt: Date | null;

  // ── Revisión / Aprobación (ADMIN) ──────────────────────────────────────────

  /** UUID del ADMIN que revisó el documento */
  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  /** UUID del ADMIN que aprobó o rechazó */
  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  /** Motivo de rechazo (requerido cuando status = RECHAZADO) */
  @Column({ name: 'reject_reason', type: 'varchar', nullable: true })
  rejectReason: string | null;

  // ── Timestamps ────────────────────────────────────────────────────────────

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
