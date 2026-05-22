import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGpsToOcrDocuments1779469721221 implements MigrationInterface {
    name = 'AddGpsToOcrDocuments1779469721221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ocr_documents" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" ADD "longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ocr_documents" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "ocr_documents" DROP COLUMN "latitude"`);
    }

}
