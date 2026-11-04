import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "pages_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_pages_v_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_pages_v_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "services_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "services_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_services_v_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_services_v_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "courses_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "courses_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "courses" ADD COLUMN "accreditation_evidence_claim_digest" varchar;
  ALTER TABLE "_courses_v_blocks_stats" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_courses_v_blocks_credentials" ADD COLUMN "evidence_claim_digest" varchar;
  ALTER TABLE "_courses_v" ADD COLUMN "version_accreditation_evidence_claim_digest" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_name_evidence_claim_digest" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "address_evidence_claim_digest" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_company_name_evidence_claim_digest" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_address_evidence_claim_digest" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "pages_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_pages_v_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_pages_v_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "services_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "services_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_services_v_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_services_v_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "courses_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "courses_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "courses" DROP COLUMN "accreditation_evidence_claim_digest";
  ALTER TABLE "_courses_v_blocks_stats" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_courses_v_blocks_credentials" DROP COLUMN "evidence_claim_digest";
  ALTER TABLE "_courses_v" DROP COLUMN "version_accreditation_evidence_claim_digest";
  ALTER TABLE "site_settings" DROP COLUMN "company_name_evidence_claim_digest";
  ALTER TABLE "site_settings" DROP COLUMN "address_evidence_claim_digest";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_company_name_evidence_claim_digest";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_address_evidence_claim_digest";`)
}
