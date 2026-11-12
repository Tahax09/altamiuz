import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "default_seo_og_image_id" integer;
  ALTER TABLE "site_settings_locales" ADD COLUMN "brand_logo_id" integer;
  ALTER TABLE "site_settings_locales" ADD COLUMN "brand_logo_inverse_id" integer;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_default_seo_og_image_id" integer;
  ALTER TABLE "_site_settings_v_locales" ADD COLUMN "version_brand_logo_id" integer;
  ALTER TABLE "_site_settings_v_locales" ADD COLUMN "version_brand_logo_inverse_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_seo_og_image_id_media_id_fk" FOREIGN KEY ("default_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_brand_logo_id_media_id_fk" FOREIGN KEY ("brand_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_brand_logo_inverse_id_media_id_fk" FOREIGN KEY ("brand_logo_inverse_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_default_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_default_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_version_brand_logo_id_media_id_fk" FOREIGN KEY ("version_brand_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_version_brand_logo_inverse_id_media_id_fk" FOREIGN KEY ("version_brand_logo_inverse_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_default_seo_default_seo_og_image_idx" ON "site_settings" USING btree ("default_seo_og_image_id");
  CREATE INDEX "site_settings_brand_brand_logo_idx" ON "site_settings_locales" USING btree ("brand_logo_id","_locale");
  CREATE INDEX "site_settings_brand_brand_logo_inverse_idx" ON "site_settings_locales" USING btree ("brand_logo_inverse_id","_locale");
  CREATE INDEX "_site_settings_v_version_default_seo_version_default_seo_idx" ON "_site_settings_v" USING btree ("version_default_seo_og_image_id");
  CREATE INDEX "_site_settings_v_version_brand_version_brand_logo_idx" ON "_site_settings_v_locales" USING btree ("version_brand_logo_id","_locale");
  CREATE INDEX "_site_settings_v_version_brand_version_brand_logo_invers_idx" ON "_site_settings_v_locales" USING btree ("version_brand_logo_inverse_id","_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_default_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "site_settings_locales" DROP CONSTRAINT "site_settings_locales_brand_logo_id_media_id_fk";
  
  ALTER TABLE "site_settings_locales" DROP CONSTRAINT "site_settings_locales_brand_logo_inverse_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v" DROP CONSTRAINT "_site_settings_v_version_default_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v_locales" DROP CONSTRAINT "_site_settings_v_locales_version_brand_logo_id_media_id_fk";
  
  ALTER TABLE "_site_settings_v_locales" DROP CONSTRAINT "_site_settings_v_locales_version_brand_logo_inverse_id_media_id_fk";
  
  DROP INDEX "site_settings_default_seo_default_seo_og_image_idx";
  DROP INDEX "site_settings_brand_brand_logo_idx";
  DROP INDEX "site_settings_brand_brand_logo_inverse_idx";
  DROP INDEX "_site_settings_v_version_default_seo_version_default_seo_idx";
  DROP INDEX "_site_settings_v_version_brand_version_brand_logo_idx";
  DROP INDEX "_site_settings_v_version_brand_version_brand_logo_invers_idx";
  ALTER TABLE "site_settings" DROP COLUMN "default_seo_og_image_id";
  ALTER TABLE "site_settings_locales" DROP COLUMN "brand_logo_id";
  ALTER TABLE "site_settings_locales" DROP COLUMN "brand_logo_inverse_id";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_default_seo_og_image_id";
  ALTER TABLE "_site_settings_v_locales" DROP COLUMN "version_brand_logo_id";
  ALTER TABLE "_site_settings_v_locales" DROP COLUMN "version_brand_logo_inverse_id";`)
}
