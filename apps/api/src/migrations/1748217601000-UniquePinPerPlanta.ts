import { MigrationInterface, QueryRunner } from "typeorm";

export class UniquePinPerPlanta1748217601000 implements MigrationInterface {
    name = 'UniquePinPerPlanta1748217601000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Elimina CUALQUIER índice único existente en asistencia_empleados que no sea la PK
        // ni el nuevo índice compuesto que vamos a crear.
        // Usa pg_index para no depender del nombre generado por TypeORM.
        await queryRunner.query(`
            DO $$
            DECLARE r RECORD;
            BEGIN
              FOR r IN
                SELECT i.relname AS indexname
                FROM pg_index ix
                JOIN pg_class t ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                WHERE t.relname = 'asistencia_empleados'
                  AND ix.indisunique = true
                  AND ix.indisprimary = false
                  AND i.relname != 'UQ_empleado_pin_planta'
              LOOP
                EXECUTE 'DROP INDEX IF EXISTS "' || r.indexname || '"';
              END LOOP;
            END $$
        `);

        // Crea el índice único compuesto: un PIN puede repetirse entre plantas distintas
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_empleado_pin_planta"
            ON "asistencia_empleados" ("pin", "planta")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_empleado_pin_planta"`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_asistencia_empleados_pin"
            ON "asistencia_empleados" ("pin")
        `);
    }
}
