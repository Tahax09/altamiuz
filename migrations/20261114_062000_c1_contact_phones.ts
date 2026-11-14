import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_additional_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_additional_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "map_link" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_map_link" varchar;
  ALTER TABLE "site_settings_additional_phones" ADD CONSTRAINT "site_settings_additional_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_additional_phones" ADD CONSTRAINT "_site_settings_v_version_additional_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_additional_phones_order_idx" ON "site_settings_additional_phones" USING btree ("_order");
  CREATE INDEX "site_settings_additional_phones_parent_id_idx" ON "site_settings_additional_phones" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_additional_phones_order_idx" ON "_site_settings_v_version_additional_phones" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_additional_phones_parent_id_idx" ON "_site_settings_v_version_additional_phones" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_additional_phones" CASCADE;
  DROP TABLE "_site_settings_v_version_additional_phones" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "map_link";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_map_link";`)
}
