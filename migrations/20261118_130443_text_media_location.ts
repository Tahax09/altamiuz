import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "pages_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "pages_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;
  ALTER TABLE "_pages_v_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "_pages_v_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "_pages_v_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;
  ALTER TABLE "services_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "services_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "services_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;
  ALTER TABLE "_services_v_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "_services_v_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "_services_v_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;
  ALTER TABLE "courses_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "courses_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "courses_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;
  ALTER TABLE "_courses_v_blocks_text_media" ADD COLUMN "location_latitude" numeric;
  ALTER TABLE "_courses_v_blocks_text_media" ADD COLUMN "location_longitude" numeric;
  ALTER TABLE "_courses_v_blocks_text_media" ADD COLUMN "location_zoom" numeric DEFAULT 15;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "pages_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "pages_blocks_text_media" DROP COLUMN "location_zoom";
  ALTER TABLE "_pages_v_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "_pages_v_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "_pages_v_blocks_text_media" DROP COLUMN "location_zoom";
  ALTER TABLE "services_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "services_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "services_blocks_text_media" DROP COLUMN "location_zoom";
  ALTER TABLE "_services_v_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "_services_v_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "_services_v_blocks_text_media" DROP COLUMN "location_zoom";
  ALTER TABLE "courses_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "courses_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "courses_blocks_text_media" DROP COLUMN "location_zoom";
  ALTER TABLE "_courses_v_blocks_text_media" DROP COLUMN "location_latitude";
  ALTER TABLE "_courses_v_blocks_text_media" DROP COLUMN "location_longitude";
  ALTER TABLE "_courses_v_blocks_text_media" DROP COLUMN "location_zoom";`)
}
