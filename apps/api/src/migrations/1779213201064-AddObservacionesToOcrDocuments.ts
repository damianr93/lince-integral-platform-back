import { MigrationInterface, QueryRunner } from "typeorm";

export class AddObservacionesToOcrDocuments1779213201064 implements MigrationInterface {
    name = 'AddObservacionesToOcrDocuments1779213201064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" DROP CONSTRAINT "FK_asistencia_fichajes_empleado"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ocr_documents_uploaded_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ocr_documents_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ocr_documents_type_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_empleados_planta"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_fichajes_pin_tiempo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_fichajes_planta_tiempo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_fichajes_tiempo"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_raw_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_asistencia_raw_logs_device_sn"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_document_type_enum" RENAME TO "ocr_document_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_documents_type_enum" AS ENUM('REMITO', 'FACTURA', 'RETENCION')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "type" TYPE "public"."ocr_documents_type_enum" USING "type"::"text"::"public"."ocr_documents_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_document_status_enum" RENAME TO "ocr_document_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_documents_status_enum" AS ENUM('PENDIENTE', 'PROCESANDO', 'VALIDO', 'CON_ERRORES', 'REVISION_PENDIENTE', 'REVISADO', 'APROBADO', 'RECHAZADO')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" TYPE "public"."ocr_documents_status_enum" USING "status"::"text"::"public"."ocr_documents_status_enum"`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE'`);
        await queryRunner.query(`DROP TYPE "public"."ocr_document_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_role_enum" RENAME TO "ocr_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_documents_uploaded_by_role_enum" AS ENUM('OPERADOR_CAMPO', 'ADMINISTRATIVO', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "uploaded_by_role" TYPE "public"."ocr_documents_uploaded_by_role_enum" USING "uploaded_by_role"::"text"::"public"."ocr_documents_uploaded_by_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_config_type_enum" AS ENUM('REMITO', 'FACTURA', 'RETENCION')`);
        await queryRunner.query(`ALTER TABLE "ocr_config" ALTER COLUMN "type" TYPE "public"."ocr_config_type_enum" USING "type"::"text"::"public"."ocr_config_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_document_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "asistencia_empleados" DROP CONSTRAINT "UQ_asistencia_empleados_pin"`);
        await queryRunner.query(`ALTER TYPE "public"."planta_enum" RENAME TO "planta_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."asistencia_empleados_planta_enum" AS ENUM('tucuman', 'villa_nueva')`);
        await queryRunner.query(`ALTER TABLE "asistencia_empleados" ALTER COLUMN "planta" TYPE "public"."asistencia_empleados_planta_enum" USING "planta"::"text"::"public"."asistencia_empleados_planta_enum"`);
        await queryRunner.query(`DROP TYPE "public"."planta_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."planta_enum" RENAME TO "planta_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."asistencia_fichajes_planta_enum" AS ENUM('tucuman', 'villa_nueva')`);
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" ALTER COLUMN "planta" TYPE "public"."asistencia_fichajes_planta_enum" USING "planta"::"text"::"public"."asistencia_fichajes_planta_enum"`);
        await queryRunner.query(`DROP TYPE "public"."planta_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_a11de4de77fe1fa1413371a07b" ON "ocr_documents" ("type", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_94b042b01c1b2912dfed8e7f47" ON "ocr_documents" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c3a5be88d495a7014b6fdb3972" ON "ocr_documents" ("uploaded_by") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_026cb61290c3385b15b642ecd0" ON "asistencia_empleados" ("pin") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebd3f4621ea1d3f99d367590da" ON "asistencia_fichajes" ("planta", "tiempo") `);
        await queryRunner.query(`CREATE INDEX "IDX_bac35777978e1fda0220235235" ON "asistencia_fichajes" ("pin", "tiempo") `);
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" ADD CONSTRAINT "FK_3906263f7c2820caf439b43405a" FOREIGN KEY ("empleado_id") REFERENCES "asistencia_empleados"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ADD COLUMN IF NOT EXISTS "observaciones" varchar NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ocr_documents" DROP COLUMN IF EXISTS "observaciones"`);
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" DROP CONSTRAINT "FK_3906263f7c2820caf439b43405a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bac35777978e1fda0220235235"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebd3f4621ea1d3f99d367590da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_026cb61290c3385b15b642ecd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c3a5be88d495a7014b6fdb3972"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_94b042b01c1b2912dfed8e7f47"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a11de4de77fe1fa1413371a07b"`);
        await queryRunner.query(`CREATE TYPE "public"."planta_enum_old" AS ENUM('tucuman', 'villa_nueva')`);
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" ALTER COLUMN "planta" TYPE "public"."planta_enum_old" USING "planta"::"text"::"public"."planta_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."asistencia_fichajes_planta_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."planta_enum_old" RENAME TO "planta_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."planta_enum_old" AS ENUM('tucuman', 'villa_nueva')`);
        await queryRunner.query(`ALTER TABLE "asistencia_empleados" ALTER COLUMN "planta" TYPE "public"."planta_enum_old" USING "planta"::"text"::"public"."planta_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."asistencia_empleados_planta_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."planta_enum_old" RENAME TO "planta_enum"`);
        await queryRunner.query(`ALTER TABLE "asistencia_empleados" ADD CONSTRAINT "UQ_asistencia_empleados_pin" UNIQUE ("pin")`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_document_type_enum_old" AS ENUM('REMITO', 'FACTURA', 'RETENCION')`);
        await queryRunner.query(`ALTER TABLE "ocr_config" ALTER COLUMN "type" TYPE "public"."ocr_document_type_enum_old" USING "type"::"text"::"public"."ocr_document_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_config_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_document_type_enum_old" RENAME TO "ocr_document_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_role_enum_old" AS ENUM('OPERADOR_CAMPO', 'ADMINISTRATIVO', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "uploaded_by_role" TYPE "public"."ocr_role_enum_old" USING "uploaded_by_role"::"text"::"public"."ocr_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_documents_uploaded_by_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_role_enum_old" RENAME TO "ocr_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_document_status_enum_old" AS ENUM('PENDIENTE', 'PROCESANDO', 'VALIDO', 'CON_ERRORES', 'REVISION_PENDIENTE', 'REVISADO', 'APROBADO', 'RECHAZADO')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" TYPE "public"."ocr_document_status_enum_old" USING "status"::"text"::"public"."ocr_document_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE'`);
        await queryRunner.query(`DROP TYPE "public"."ocr_documents_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_document_status_enum_old" RENAME TO "ocr_document_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."ocr_document_type_enum_old" AS ENUM('REMITO', 'FACTURA', 'RETENCION')`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ALTER COLUMN "type" TYPE "public"."ocr_document_type_enum_old" USING "type"::"text"::"public"."ocr_document_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ocr_documents_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ocr_document_type_enum_old" RENAME TO "ocr_document_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_raw_logs_device_sn" ON "asistencia_raw_logs" ("device_sn") `);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_raw_logs_created_at" ON "asistencia_raw_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_fichajes_tiempo" ON "asistencia_fichajes" ("tiempo") `);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_fichajes_planta_tiempo" ON "asistencia_fichajes" ("planta", "tiempo") `);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_fichajes_pin_tiempo" ON "asistencia_fichajes" ("pin", "tiempo") `);
        await queryRunner.query(`CREATE INDEX "IDX_asistencia_empleados_planta" ON "asistencia_empleados" ("planta") `);
        await queryRunner.query(`CREATE INDEX "IDX_ocr_documents_type_status" ON "ocr_documents" ("status", "type") `);
        await queryRunner.query(`CREATE INDEX "IDX_ocr_documents_status" ON "ocr_documents" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ocr_documents_uploaded_by" ON "ocr_documents" ("uploaded_by") `);
        await queryRunner.query(`ALTER TABLE "asistencia_fichajes" ADD CONSTRAINT "FK_asistencia_fichajes_empleado" FOREIGN KEY ("empleado_id") REFERENCES "asistencia_empleados"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
