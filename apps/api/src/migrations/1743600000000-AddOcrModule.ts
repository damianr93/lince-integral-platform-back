import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Módulo OCR
 *
 * Crea las tablas:
 *  - ocr_documents   — documentos (remitos + facturas) con ciclo de vida OCR
 *  - ocr_config      — configuración de campos requeridos por tipo (SUPERADMIN)
 */
export class AddOcrModule1743600000000 implements MigrationInterface {
  name = 'AddOcrModule1743600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ─────────────────────────────────────────────────────────────────

    // Limpiar tipos huérfanos que pudo haber dejado un synchronize fallido
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_document_type_enum_old" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_document_status_enum_old" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_role_enum_old" CASCADE`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ocr_document_type_enum" AS ENUM ('REMITO', 'FACTURA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ocr_document_status_enum" AS ENUM (
          'PENDIENTE', 'PROCESANDO', 'VALIDO', 'CON_ERRORES',
          'REVISION_PENDIENTE', 'REVISADO', 'APROBADO', 'RECHAZADO'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ocr_role_enum" AS ENUM ('OPERADOR_CAMPO', 'ADMINISTRATIVO', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    // ── Tabla ocr_documents ───────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ocr_documents" (
        "id"                UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "type"              "ocr_document_type_enum"   NOT NULL,
        "status"            "ocr_document_status_enum" NOT NULL DEFAULT 'PENDIENTE',
        "uploaded_by"       UUID        NOT NULL,
        "uploaded_by_role"  "ocr_role_enum" NOT NULL,
        "s3_key"            VARCHAR     NOT NULL,
        "s3_thumbnail_key"  VARCHAR,
        "extracted_data"    JSONB,
        "validation_errors" JSONB,
        "corrected_by"      UUID,
        "corrected_at"      TIMESTAMPTZ,
        "reviewed_by"       UUID,
        "approved_by"       UUID,
        "approved_at"       TIMESTAMPTZ,
        "reject_reason"     VARCHAR,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_ocr_documents" PRIMARY KEY ("id")
      )
    `);

    // Índices para consultas frecuentes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ocr_documents_uploaded_by" ON "ocr_documents" ("uploaded_by")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ocr_documents_status" ON "ocr_documents" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ocr_documents_type_status" ON "ocr_documents" ("type", "status")`);

    // ── Tabla ocr_config ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ocr_config" (
        "type"            "ocr_document_type_enum" NOT NULL,
        "required_fields" JSONB NOT NULL,
        "field_labels"    JSONB NOT NULL DEFAULT '{}',
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_ocr_config" PRIMARY KEY ("type")
      )
    `);

    // Datos iniciales — campos requeridos por defecto
    // INSERT solo si no existe ya (idempotente)
    await queryRunner.query(`
      INSERT INTO "ocr_config" ("type", "required_fields", "field_labels") VALUES
        ('REMITO',  '["numero","fecha","proveedor"]',                  '{"numero":"Número","fecha":"Fecha","proveedor":"Proveedor","destinatario":"Destinatario","total":"Total"}'),
        ('FACTURA', '["numero","fecha","proveedor","cuit","total"]',    '{"numero":"N° Comprobante","fecha":"Fecha","proveedor":"Razón Social","cuit":"CUIT","neto":"Neto","iva":"IVA","total":"Total","tipo":"Tipo"}')
      ON CONFLICT ("type") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ocr_config"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ocr_documents_type_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ocr_documents_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ocr_documents_uploaded_by"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ocr_documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_document_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_document_type_enum"`);
  }
}
