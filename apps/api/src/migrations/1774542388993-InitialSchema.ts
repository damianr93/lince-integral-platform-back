import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774542388993 implements MigrationInterface {
    name = 'InitialSchema1774542388993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "modules" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8c2ad80240e18fcac9e7c526311" UNIQUE ("name"), CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_globalrole_enum" AS ENUM('SUPERADMIN', 'ADMIN', 'USER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "globalRole" "public"."users_globalrole_enum" NOT NULL DEFAULT 'USER', "modules" jsonb NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, "area" character varying, "mustChangePassword" boolean NOT NULL DEFAULT false, "refreshTokenHash" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "pattern" character varying NOT NULL, "isRegex" boolean NOT NULL DEFAULT false, "caseSensitive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c7a8837399eb5b3d49600ba4ba0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_6bdb3db95dd955d3c701e935426" UNIQUE ("name"), CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."unmatched_systems_status_enum" AS ENUM('OVERDUE', 'DEFERRED')`);
        await queryRunner.query(`CREATE TABLE "unmatched_systems" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "systemLineId" uuid NOT NULL, "status" "public"."unmatched_systems_status_enum" NOT NULL, CONSTRAINT "UQ_1351a01780cd5ccc748e6327bc1" UNIQUE ("systemLineId"), CONSTRAINT "REL_1351a01780cd5ccc748e6327bc" UNIQUE ("systemLineId"), CONSTRAINT "PK_710aa978e188e98f489d67d586e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pending_items_status_enum" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED')`);
        await queryRunner.query(`CREATE TABLE "pending_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "area" character varying NOT NULL, "status" "public"."pending_items_status_enum" NOT NULL DEFAULT 'OPEN', "resolvedAt" TIMESTAMP, "note" text, "systemLineId" uuid, CONSTRAINT "PK_77eb717d94b7d01ad838b81fe48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "system_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "rowIndex" integer, "issueDate" TIMESTAMP, "dueDate" TIMESTAMP, "amount" double precision NOT NULL, "amountKey" bigint NOT NULL, "description" character varying, "raw" jsonb NOT NULL, CONSTRAINT "PK_d637b4778eb661f91f01568c4df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "extractLineId" uuid NOT NULL, "systemLineId" uuid NOT NULL, "deltaDays" integer NOT NULL, CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unmatched_extracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "extractLineId" uuid NOT NULL, CONSTRAINT "UQ_16b29a4019ca53f355ea2815be1" UNIQUE ("extractLineId"), CONSTRAINT "REL_16b29a4019ca53f355ea2815be" UNIQUE ("extractLineId"), CONSTRAINT "PK_5634ac50bb9547039c4ac0fb521" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "extract_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "date" TIMESTAMP, "concept" character varying, "amount" double precision NOT NULL, "amountKey" bigint NOT NULL, "raw" jsonb NOT NULL, "categoryId" uuid, "excluded" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3209465350883a99b6b40494faf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cheques_status_enum" AS ENUM('ISSUED', 'CLEARED', 'OVERDUE')`);
        await queryRunner.query(`CREATE TABLE "cheques" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "number" character varying, "issueDate" TIMESTAMP, "dueDate" TIMESTAMP, "amount" double precision NOT NULL, "status" "public"."cheques_status_enum" NOT NULL DEFAULT 'ISSUED', "note" text, CONSTRAINT "PK_b87771b4d5f52b7e5bf4498e912" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."run_members_role_enum" AS ENUM('OWNER', 'EDITOR', 'VIEWER')`);
        await queryRunner.query(`CREATE TABLE "run_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "userId" character varying NOT NULL, "role" "public"."run_members_role_enum" NOT NULL DEFAULT 'EDITOR', CONSTRAINT "UQ_1be7c82bc0fe24250a90b26cee3" UNIQUE ("runId", "userId"), CONSTRAINT "PK_4982283bbd0c8a337d417fe8ccf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recon_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "authorId" character varying NOT NULL, "body" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3719a74b627f4c6f99a427cd75e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recon_issue_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "issueId" uuid NOT NULL, "authorId" character varying NOT NULL, "body" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee545e681b7349406f77d3b3acd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "recon_issues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "runId" uuid NOT NULL, "title" character varying NOT NULL, "body" text, "createdById" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3009760da48d55436831eecec12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reconciliation_runs_status_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`CREATE TABLE "reconciliation_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying, "bankName" character varying, "accountRef" character varying, "windowDays" integer NOT NULL DEFAULT '0', "cutDate" TIMESTAMP, "status" "public"."reconciliation_runs_status_enum" NOT NULL DEFAULT 'OPEN', "excludeConcepts" jsonb NOT NULL DEFAULT '[]', "enabledCategoryIds" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" character varying NOT NULL, CONSTRAINT "PK_4edbdb165c9e754997036a4176a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "expense_rules" ADD CONSTRAINT "FK_71ad1d0937eca5bb83c9f506119" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unmatched_systems" ADD CONSTRAINT "FK_2541fa617622ed9ebc7d7299325" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unmatched_systems" ADD CONSTRAINT "FK_1351a01780cd5ccc748e6327bc1" FOREIGN KEY ("systemLineId") REFERENCES "system_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_items" ADD CONSTRAINT "FK_6a86230a070018b7b2e3c6b9d1a" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pending_items" ADD CONSTRAINT "FK_7f4cd8483d6528adfe6326db82a" FOREIGN KEY ("systemLineId") REFERENCES "system_lines"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system_lines" ADD CONSTRAINT "FK_03acbd42cb0c016ad411a94b1c6" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_314e36a6688b62ccd7404199ed5" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_db175641bb3c3fe6da588ea3ee9" FOREIGN KEY ("extractLineId") REFERENCES "extract_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_e72de18d6b23f59a640b19c7560" FOREIGN KEY ("systemLineId") REFERENCES "system_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unmatched_extracts" ADD CONSTRAINT "FK_90cb0954004657823fefb4177a1" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unmatched_extracts" ADD CONSTRAINT "FK_16b29a4019ca53f355ea2815be1" FOREIGN KEY ("extractLineId") REFERENCES "extract_lines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "extract_lines" ADD CONSTRAINT "FK_2ca4f70132e67f60b41cfb57ca6" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "extract_lines" ADD CONSTRAINT "FK_e008f63857a3dcd6e5664e7833a" FOREIGN KEY ("categoryId") REFERENCES "expense_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cheques" ADD CONSTRAINT "FK_a1b2cb4ecb418436ff458a5abbd" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "run_members" ADD CONSTRAINT "FK_3aac20ff5a746f64c0f64c6cdfc" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recon_messages" ADD CONSTRAINT "FK_6b7f6ce4d21c1e4a42284c8efac" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recon_issue_comments" ADD CONSTRAINT "FK_19d8ddc6e42a382020874804e35" FOREIGN KEY ("issueId") REFERENCES "recon_issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recon_issues" ADD CONSTRAINT "FK_b42a8d7bfe32d0afc2e8ab30698" FOREIGN KEY ("runId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recon_issues" DROP CONSTRAINT "FK_b42a8d7bfe32d0afc2e8ab30698"`);
        await queryRunner.query(`ALTER TABLE "recon_issue_comments" DROP CONSTRAINT "FK_19d8ddc6e42a382020874804e35"`);
        await queryRunner.query(`ALTER TABLE "recon_messages" DROP CONSTRAINT "FK_6b7f6ce4d21c1e4a42284c8efac"`);
        await queryRunner.query(`ALTER TABLE "run_members" DROP CONSTRAINT "FK_3aac20ff5a746f64c0f64c6cdfc"`);
        await queryRunner.query(`ALTER TABLE "cheques" DROP CONSTRAINT "FK_a1b2cb4ecb418436ff458a5abbd"`);
        await queryRunner.query(`ALTER TABLE "extract_lines" DROP CONSTRAINT "FK_e008f63857a3dcd6e5664e7833a"`);
        await queryRunner.query(`ALTER TABLE "extract_lines" DROP CONSTRAINT "FK_2ca4f70132e67f60b41cfb57ca6"`);
        await queryRunner.query(`ALTER TABLE "unmatched_extracts" DROP CONSTRAINT "FK_16b29a4019ca53f355ea2815be1"`);
        await queryRunner.query(`ALTER TABLE "unmatched_extracts" DROP CONSTRAINT "FK_90cb0954004657823fefb4177a1"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_e72de18d6b23f59a640b19c7560"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_db175641bb3c3fe6da588ea3ee9"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_314e36a6688b62ccd7404199ed5"`);
        await queryRunner.query(`ALTER TABLE "system_lines" DROP CONSTRAINT "FK_03acbd42cb0c016ad411a94b1c6"`);
        await queryRunner.query(`ALTER TABLE "pending_items" DROP CONSTRAINT "FK_7f4cd8483d6528adfe6326db82a"`);
        await queryRunner.query(`ALTER TABLE "pending_items" DROP CONSTRAINT "FK_6a86230a070018b7b2e3c6b9d1a"`);
        await queryRunner.query(`ALTER TABLE "unmatched_systems" DROP CONSTRAINT "FK_1351a01780cd5ccc748e6327bc1"`);
        await queryRunner.query(`ALTER TABLE "unmatched_systems" DROP CONSTRAINT "FK_2541fa617622ed9ebc7d7299325"`);
        await queryRunner.query(`ALTER TABLE "expense_rules" DROP CONSTRAINT "FK_71ad1d0937eca5bb83c9f506119"`);
        await queryRunner.query(`DROP TABLE "reconciliation_runs"`);
        await queryRunner.query(`DROP TYPE "public"."reconciliation_runs_status_enum"`);
        await queryRunner.query(`DROP TABLE "recon_issues"`);
        await queryRunner.query(`DROP TABLE "recon_issue_comments"`);
        await queryRunner.query(`DROP TABLE "recon_messages"`);
        await queryRunner.query(`DROP TABLE "run_members"`);
        await queryRunner.query(`DROP TYPE "public"."run_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "cheques"`);
        await queryRunner.query(`DROP TYPE "public"."cheques_status_enum"`);
        await queryRunner.query(`DROP TABLE "extract_lines"`);
        await queryRunner.query(`DROP TABLE "unmatched_extracts"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "system_lines"`);
        await queryRunner.query(`DROP TABLE "pending_items"`);
        await queryRunner.query(`DROP TYPE "public"."pending_items_status_enum"`);
        await queryRunner.query(`DROP TABLE "unmatched_systems"`);
        await queryRunner.query(`DROP TYPE "public"."unmatched_systems_status_enum"`);
        await queryRunner.query(`DROP TABLE "expense_categories"`);
        await queryRunner.query(`DROP TABLE "expense_rules"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_globalrole_enum"`);
        await queryRunner.query(`DROP TABLE "areas"`);
    }

}
