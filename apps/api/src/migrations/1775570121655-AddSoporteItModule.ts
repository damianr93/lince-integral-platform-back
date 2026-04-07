import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoporteItModule1775570121655 implements MigrationInterface {
    name = 'AddSoporteItModule1775570121655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "soporte_it_relevamiento_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "relevamientoId" uuid NOT NULL, "orden" integer NOT NULL DEFAULT '0', "titulo" character varying NOT NULL, "procedimiento" text, "observacion" text, "conclusion" text, CONSTRAINT "PK_0bd5a545065748131d136cb74da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "soporte_it_relevamientos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "incidenteId" uuid NOT NULL, "creadoPorId" uuid, "fecha" date NOT NULL DEFAULT ('now'::text)::date, "modalidad" character varying, "conclusionGeneral" text, "pasosASeguir" text, "recomendaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_e192416c63ad05c6199cae0267" UNIQUE ("incidenteId"), CONSTRAINT "PK_4fc102472493dd61b3645eb8af7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "soporte_it_incidentes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numeroReporte" integer NOT NULL DEFAULT '0', "equipoId" uuid NOT NULL, "reportadoPorId" uuid, "descripcion" text NOT NULL, "urgencia" character varying NOT NULL DEFAULT 'media', "estado" character varying NOT NULL DEFAULT 'pending', "fechaReporte" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "aplicacionesAfectadas" text, "accionesPrevias" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a12ddbc28d1191d1ed37c566fdf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "soporte_it_equipos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numeroActivo" integer, "aCargoDe" character varying, "sector" character varying, "hostname" character varying, "windowsUserId" character varying, "fabricante" character varying, "modelo" character varying, "ramGb" character varying, "sistemaOperativo" text, "procesador" text, "firmwareUefi" text, "graficos" text, "almacenamiento" text, "adaptadorRed" text, "ipv6" text, "controladorUsbHost" text, "estado" character varying NOT NULL DEFAULT 'activo', "notas" text, "usuarioPlatId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3fd09cf78501dbd082d2dc2249b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamiento_items" ADD CONSTRAINT "FK_a68d9d9b801d4b2a526fca036e2" FOREIGN KEY ("relevamientoId") REFERENCES "soporte_it_relevamientos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamientos" ADD CONSTRAINT "FK_e192416c63ad05c6199cae02672" FOREIGN KEY ("incidenteId") REFERENCES "soporte_it_incidentes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamientos" ADD CONSTRAINT "FK_53b735fa7e07bc9b5737547eef3" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "soporte_it_incidentes" ADD CONSTRAINT "FK_2d327f751d45cdb008d59e477de" FOREIGN KEY ("equipoId") REFERENCES "soporte_it_equipos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "soporte_it_incidentes" ADD CONSTRAINT "FK_86de054f12a2c84acb1bc3c587d" FOREIGN KEY ("reportadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "soporte_it_equipos" ADD CONSTRAINT "FK_9a62fe7d61624bf170ef39c7793" FOREIGN KEY ("usuarioPlatId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "soporte_it_equipos" DROP CONSTRAINT "FK_9a62fe7d61624bf170ef39c7793"`);
        await queryRunner.query(`ALTER TABLE "soporte_it_incidentes" DROP CONSTRAINT "FK_86de054f12a2c84acb1bc3c587d"`);
        await queryRunner.query(`ALTER TABLE "soporte_it_incidentes" DROP CONSTRAINT "FK_2d327f751d45cdb008d59e477de"`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamientos" DROP CONSTRAINT "FK_53b735fa7e07bc9b5737547eef3"`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamientos" DROP CONSTRAINT "FK_e192416c63ad05c6199cae02672"`);
        await queryRunner.query(`ALTER TABLE "soporte_it_relevamiento_items" DROP CONSTRAINT "FK_a68d9d9b801d4b2a526fca036e2"`);
        await queryRunner.query(`DROP TABLE "soporte_it_equipos"`);
        await queryRunner.query(`DROP TABLE "soporte_it_incidentes"`);
        await queryRunner.query(`DROP TABLE "soporte_it_relevamientos"`);
        await queryRunner.query(`DROP TABLE "soporte_it_relevamiento_items"`);
    }

}
