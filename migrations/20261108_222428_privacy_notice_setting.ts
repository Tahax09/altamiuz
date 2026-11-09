import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "privacy_notice_id" integer;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_privacy_notice_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_privacy_notice_id_pages_id_fk" FOREIGN KEY ("privacy_notice_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_privacy_notice_id_pages_id_fk" FOREIGN KEY ("version_privacy_notice_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_privacy_notice_idx" ON "site_settings" USING btree ("privacy_notice_id");
  CREATE INDEX "_site_settings_v_version_version_privacy_notice_idx" ON "_site_settings_v" USING btree ("version_privacy_notice_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_privacy_notice_id_pages_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_privacy_notice_id_pages_id_fk";
  
  DROP INDEX "site_settings_privacy_notice_idx";
  DROP INDEX "_site_settings_v_version_version_privacy_notice_idx";
  ALTER TABLE "site_settings" DROP COLUMN "privacy_notice_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_privacy_notice_id";`)
}
