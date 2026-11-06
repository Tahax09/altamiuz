import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "pages_locales" ADD COLUMN "seo_canonical_override" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_og_image_id" integer;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_seo_canonical_override" varchar;
  ALTER TABLE "services" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "services_locales" ADD COLUMN "seo_canonical_override" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_seo_og_image_id" integer;
  ALTER TABLE "_services_v_locales" ADD COLUMN "version_seo_canonical_override" varchar;
  ALTER TABLE "courses" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "courses_locales" ADD COLUMN "seo_canonical_override" varchar;
  ALTER TABLE "_courses_v" ADD COLUMN "version_seo_og_image_id" integer;
  ALTER TABLE "_courses_v_locales" ADD COLUMN "version_seo_canonical_override" varchar;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "services_seo_seo_og_image_idx" ON "services" USING btree ("seo_og_image_id");
  CREATE INDEX "_services_v_version_seo_version_seo_og_image_idx" ON "_services_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "courses_seo_seo_og_image_idx" ON "courses" USING btree ("seo_og_image_id");
  CREATE INDEX "_courses_v_version_seo_version_seo_og_image_idx" ON "_courses_v" USING btree ("version_seo_og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP CONSTRAINT "pages_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "services" DROP CONSTRAINT "services_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "_services_v" DROP CONSTRAINT "_services_v_version_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "courses" DROP CONSTRAINT "courses_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "_courses_v" DROP CONSTRAINT "_courses_v_version_seo_og_image_id_media_id_fk";
  
  DROP INDEX "pages_seo_seo_og_image_idx";
  DROP INDEX "_pages_v_version_seo_version_seo_og_image_idx";
  DROP INDEX "services_seo_seo_og_image_idx";
  DROP INDEX "_services_v_version_seo_version_seo_og_image_idx";
  DROP INDEX "courses_seo_seo_og_image_idx";
  DROP INDEX "_courses_v_version_seo_version_seo_og_image_idx";
  ALTER TABLE "pages" DROP COLUMN "seo_og_image_id";
  ALTER TABLE "pages_locales" DROP COLUMN "seo_canonical_override";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_og_image_id";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_seo_canonical_override";
  ALTER TABLE "services" DROP COLUMN "seo_og_image_id";
  ALTER TABLE "services_locales" DROP COLUMN "seo_canonical_override";
  ALTER TABLE "_services_v" DROP COLUMN "version_seo_og_image_id";
  ALTER TABLE "_services_v_locales" DROP COLUMN "version_seo_canonical_override";
  ALTER TABLE "courses" DROP COLUMN "seo_og_image_id";
  ALTER TABLE "courses_locales" DROP COLUMN "seo_canonical_override";
  ALTER TABLE "_courses_v" DROP COLUMN "version_seo_og_image_id";
  ALTER TABLE "_courses_v_locales" DROP COLUMN "version_seo_canonical_override";`)
}
