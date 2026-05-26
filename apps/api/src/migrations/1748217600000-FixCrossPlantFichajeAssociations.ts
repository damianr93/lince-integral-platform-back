import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCrossPlantFichajeAssociations1748217600000 implements MigrationInterface {
    name = 'FixCrossPlantFichajeAssociations1748217600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Desvincula fichajes cuya planta no coincide con la planta del empleado asociado.
        // Esto ocurrió cuando "Sincronizar empleados Villa Nueva" creó empleados de villa_nueva
        // y la reconciliación los asoció a fichajes de tucumán (mismo PIN, distinta planta).
        const result = await queryRunner.query(`
            UPDATE asistencia_fichajes f
            SET empleado_id = NULL
            FROM asistencia_empleados e
            WHERE f.empleado_id = e.id
              AND f.planta IS NOT NULL
              AND e.planta IS NOT NULL
              AND f.planta::text != e.planta::text
        `);
        const affected = Array.isArray(result) ? result[1] : (result?.rowCount ?? result);
        console.log(`FixCrossPlantFichajeAssociations: ${affected} fichajes corregidos`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No se puede revertir: los vínculos originales eran incorrectos.
    }
}
