import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGeoPointsTable1779496649216 implements MigrationInterface {
    name = 'AddGeoPointsTable1779496649216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "geo_points" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carpeta" character varying NOT NULL, "nombre" character varying NOT NULL, "descripcion" text, "lat" numeric(10,7) NOT NULL, "lng" numeric(10,7) NOT NULL, "iconFile" character varying NOT NULL, "orden" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_52198aac03613a293eaba0f5ddd" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "geo_points"`);
    }

}
