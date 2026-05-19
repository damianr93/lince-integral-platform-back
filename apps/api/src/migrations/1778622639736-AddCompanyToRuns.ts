import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyToRuns1778622639736 implements MigrationInterface {
    name = 'AddCompanyToRuns1778622639736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reconciliation_runs" ADD "company" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reconciliation_runs" DROP COLUMN "company"`);
    }
}
