import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "services_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "_services_v_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "courses_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "_courses_v_blocks_process" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_blocks_process" ADD CONSTRAINT "pages_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process" ADD CONSTRAINT "_pages_v_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_process" ADD CONSTRAINT "services_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process" ADD CONSTRAINT "_services_v_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_process" ADD CONSTRAINT "courses_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_process" ADD CONSTRAINT "_courses_v_blocks_process_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_process_media_idx" ON "pages_blocks_process" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_process_media_idx" ON "_pages_v_blocks_process" USING btree ("media_id");
  CREATE INDEX "services_blocks_process_media_idx" ON "services_blocks_process" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_process_media_idx" ON "_services_v_blocks_process" USING btree ("media_id");
  CREATE INDEX "courses_blocks_process_media_idx" ON "courses_blocks_process" USING btree ("media_id");
  CREATE INDEX "_courses_v_blocks_process_media_idx" ON "_courses_v_blocks_process" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_process" DROP CONSTRAINT "pages_blocks_process_media_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_process" DROP CONSTRAINT "_pages_v_blocks_process_media_id_media_id_fk";
  
  ALTER TABLE "services_blocks_process" DROP CONSTRAINT "services_blocks_process_media_id_media_id_fk";
  
  ALTER TABLE "_services_v_blocks_process" DROP CONSTRAINT "_services_v_blocks_process_media_id_media_id_fk";
  
  ALTER TABLE "courses_blocks_process" DROP CONSTRAINT "courses_blocks_process_media_id_media_id_fk";
  
  ALTER TABLE "_courses_v_blocks_process" DROP CONSTRAINT "_courses_v_blocks_process_media_id_media_id_fk";
  
  DROP INDEX "pages_blocks_process_media_idx";
  DROP INDEX "_pages_v_blocks_process_media_idx";
  DROP INDEX "services_blocks_process_media_idx";
  DROP INDEX "_services_v_blocks_process_media_idx";
  DROP INDEX "courses_blocks_process_media_idx";
  DROP INDEX "_courses_v_blocks_process_media_idx";
  ALTER TABLE "pages_blocks_process" DROP COLUMN "media_id";
  ALTER TABLE "_pages_v_blocks_process" DROP COLUMN "media_id";
  ALTER TABLE "services_blocks_process" DROP COLUMN "media_id";
  ALTER TABLE "_services_v_blocks_process" DROP COLUMN "media_id";
  ALTER TABLE "courses_blocks_process" DROP COLUMN "media_id";
  ALTER TABLE "_courses_v_blocks_process" DROP COLUMN "media_id";`)
}
