import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAsistenciaModule1745500000000 implements MigrationInterface {
  name = 'AddAsistenciaModule1745500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "planta_enum" AS ENUM ('tucuman', 'villa_nueva')
    `);

    await queryRunner.query(`
      CREATE TYPE "estado_fichaje_enum" AS ENUM ('0', '1')
    `);

    // ── Empleados ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "asistencia_empleados" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "first_name"   VARCHAR       NOT NULL,
        "last_name"    VARCHAR       NOT NULL,
        "dni"          VARCHAR,
        "pin"          VARCHAR       NOT NULL,
        "planta"       "planta_enum" NOT NULL,
        "departamento" VARCHAR,
        "cargo"        VARCHAR,
        "activo"       BOOLEAN       NOT NULL DEFAULT true,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asistencia_empleados" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_asistencia_empleados_pin" UNIQUE ("pin")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_empleados_planta" ON "asistencia_empleados" ("planta")
    `);

    // ── Fichajes ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "asistencia_fichajes" (
        "id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
        "empleado_id" UUID,
        "pin"         VARCHAR       NOT NULL,
        "tiempo"      TIMESTAMPTZ   NOT NULL,
        "estado"      INTEGER       NOT NULL DEFAULT 0,
        "verify"      INTEGER,
        "device_sn"   VARCHAR,
        "planta"      "planta_enum",
        "raw_payload" TEXT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asistencia_fichajes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_asistencia_fichajes_empleado"
          FOREIGN KEY ("empleado_id")
          REFERENCES "asistencia_empleados"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_fichajes_pin_tiempo" ON "asistencia_fichajes" ("pin", "tiempo")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_fichajes_planta_tiempo" ON "asistencia_fichajes" ("planta", "tiempo")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_fichajes_tiempo" ON "asistencia_fichajes" ("tiempo" DESC)
    `);

    // ── Raw logs ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "asistencia_raw_logs" (
        "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
        "method"       VARCHAR     NOT NULL,
        "path"         VARCHAR     NOT NULL,
        "headers"      JSONB,
        "query_params" JSONB,
        "body_raw"     TEXT,
        "body_parsed"  JSONB,
        "device_sn"    VARCHAR,
        "ip"           VARCHAR,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_asistencia_raw_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_raw_logs_created_at" ON "asistencia_raw_logs" ("created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_asistencia_raw_logs_device_sn" ON "asistencia_raw_logs" ("device_sn")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "asistencia_raw_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asistencia_fichajes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asistencia_empleados"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_fichaje_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "planta_enum"`);
  }
}
