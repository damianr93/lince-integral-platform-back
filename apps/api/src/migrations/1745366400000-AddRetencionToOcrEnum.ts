import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRetencionToOcrEnum1745366400000 implements MigrationInterface {
  name = 'AddRetencionToOcrEnum1745366400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "ocr_document_type_enum" ADD VALUE IF NOT EXISTS 'RETENCION'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permite eliminar valores de un enum directamente.
    // Para revertir hay que recrear el tipo sin el valor eliminado.
    await queryRunner.query(`
      ALTER TABLE "ocr_documents"
        ALTER COLUMN "type" TYPE VARCHAR
        USING "type"::VARCHAR
    `);
    await queryRunner.query(`DROP TYPE "ocr_document_type_enum"`);
    await queryRunner.query(`
      CREATE TYPE "ocr_document_type_enum" AS ENUM ('REMITO', 'FACTURA')
    `);
    await queryRunner.query(`
      ALTER TABLE "ocr_documents"
        ALTER COLUMN "type" TYPE "ocr_document_type_enum"
        USING "type"::"ocr_document_type_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "ocr_config"
        ALTER COLUMN "type" TYPE VARCHAR
        USING "type"::VARCHAR
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_config_type_enum"`);
  }
}
