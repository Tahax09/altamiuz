// V-2 components (additive): service/course card `image` and `icon`, insight item `date` and
// `image`, and the evidence-gated `team` block (CD-03) on pages, services and courses.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__pages_v_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_services_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_services_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum__services_v_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__services_v_version_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum_courses_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_courses_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum__courses_v_blocks_team_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__courses_v_version_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TABLE "pages_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer
  );
  
  CREATE TABLE "pages_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_pages_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__pages_v_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer
  );
  
  CREATE TABLE "services_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_services_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__services_v_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer
  );
  
  CREATE TABLE "courses_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_courses_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_team_members_locales" (
  	"name" varchar,
  	"role" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__courses_v_blocks_team_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"evidence_claim_digest" varchar,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_team_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "pages_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "services_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "services_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "services" ADD COLUMN "image_id" integer;
  ALTER TABLE "services" ADD COLUMN "icon" "enum_services_icon";
  ALTER TABLE "_services_v_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "_services_v_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_icon" "enum__services_v_version_icon";
  ALTER TABLE "courses_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "courses_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "courses" ADD COLUMN "image_id" integer;
  ALTER TABLE "courses" ADD COLUMN "icon" "enum_courses_icon";
  ALTER TABLE "_courses_v_blocks_resource_list_items" ADD COLUMN "date" timestamp(3) with time zone;
  ALTER TABLE "_courses_v_blocks_resource_list_items" ADD COLUMN "image_id" integer;
  ALTER TABLE "_courses_v" ADD COLUMN "version_image_id" integer;
  ALTER TABLE "_courses_v" ADD COLUMN "version_icon" "enum__courses_v_version_icon";
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_members" ADD CONSTRAINT "pages_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_members_locales" ADD CONSTRAINT "pages_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_team" ADD CONSTRAINT "pages_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_team_locales" ADD CONSTRAINT "pages_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members" ADD CONSTRAINT "_pages_v_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_members_locales" ADD CONSTRAINT "_pages_v_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team" ADD CONSTRAINT "_pages_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_team_locales" ADD CONSTRAINT "_pages_v_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_team_members" ADD CONSTRAINT "services_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_team_members" ADD CONSTRAINT "services_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_team_members_locales" ADD CONSTRAINT "services_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_team" ADD CONSTRAINT "services_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_team" ADD CONSTRAINT "services_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_team_locales" ADD CONSTRAINT "services_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team_members" ADD CONSTRAINT "_services_v_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team_members" ADD CONSTRAINT "_services_v_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team_members_locales" ADD CONSTRAINT "_services_v_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team" ADD CONSTRAINT "_services_v_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team" ADD CONSTRAINT "_services_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_team_locales" ADD CONSTRAINT "_services_v_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_team_members" ADD CONSTRAINT "courses_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_team_members" ADD CONSTRAINT "courses_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_team_members_locales" ADD CONSTRAINT "courses_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_team" ADD CONSTRAINT "courses_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_team" ADD CONSTRAINT "courses_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_team_locales" ADD CONSTRAINT "courses_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team_members" ADD CONSTRAINT "_courses_v_blocks_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team_members" ADD CONSTRAINT "_courses_v_blocks_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team_members_locales" ADD CONSTRAINT "_courses_v_blocks_team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team" ADD CONSTRAINT "_courses_v_blocks_team_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team" ADD CONSTRAINT "_courses_v_blocks_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_team_locales" ADD CONSTRAINT "_courses_v_blocks_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_team"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_team_members_order_idx" ON "pages_blocks_team_members" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_members_parent_id_idx" ON "pages_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_members_photo_idx" ON "pages_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "pages_blocks_team_members_locales_locale_parent_id_unique" ON "pages_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_team_members_locales_parent_id_idx" ON "pages_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_order_idx" ON "pages_blocks_team" USING btree ("_order");
  CREATE INDEX "pages_blocks_team_parent_id_idx" ON "pages_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_team_path_idx" ON "pages_blocks_team" USING btree ("_path");
  CREATE INDEX "pages_blocks_team_evidence_evidence_verified_by_idx" ON "pages_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "pages_blocks_team_locales_locale_parent_id_unique" ON "pages_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_team_locales_parent_id_idx" ON "pages_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_members_order_idx" ON "_pages_v_blocks_team_members" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_members_parent_id_idx" ON "_pages_v_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_members_photo_idx" ON "_pages_v_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_team_members_locales_locale_parent_id_unique" ON "_pages_v_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_team_members_locales_parent_id_idx" ON "_pages_v_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_order_idx" ON "_pages_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_team_parent_id_idx" ON "_pages_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_team_path_idx" ON "_pages_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_team_evidence_evidence_verified_by_idx" ON "_pages_v_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_team_locales_locale_parent_id_unique" ON "_pages_v_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_team_locales_parent_id_idx" ON "_pages_v_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_team_members_order_idx" ON "services_blocks_team_members" USING btree ("_order");
  CREATE INDEX "services_blocks_team_members_parent_id_idx" ON "services_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_team_members_photo_idx" ON "services_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "services_blocks_team_members_locales_locale_parent_id_unique" ON "services_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_team_members_locales_parent_id_idx" ON "services_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_team_order_idx" ON "services_blocks_team" USING btree ("_order");
  CREATE INDEX "services_blocks_team_parent_id_idx" ON "services_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_team_path_idx" ON "services_blocks_team" USING btree ("_path");
  CREATE INDEX "services_blocks_team_evidence_evidence_verified_by_idx" ON "services_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "services_blocks_team_locales_locale_parent_id_unique" ON "services_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_team_locales_parent_id_idx" ON "services_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_team_members_order_idx" ON "_services_v_blocks_team_members" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_team_members_parent_id_idx" ON "_services_v_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_team_members_photo_idx" ON "_services_v_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_services_v_blocks_team_members_locales_locale_parent_id_uni" ON "_services_v_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_team_members_locales_parent_id_idx" ON "_services_v_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_team_order_idx" ON "_services_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_team_parent_id_idx" ON "_services_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_team_path_idx" ON "_services_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_team_evidence_evidence_verified_by_idx" ON "_services_v_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "_services_v_blocks_team_locales_locale_parent_id_unique" ON "_services_v_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_team_locales_parent_id_idx" ON "_services_v_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_team_members_order_idx" ON "courses_blocks_team_members" USING btree ("_order");
  CREATE INDEX "courses_blocks_team_members_parent_id_idx" ON "courses_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_team_members_photo_idx" ON "courses_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "courses_blocks_team_members_locales_locale_parent_id_unique" ON "courses_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_team_members_locales_parent_id_idx" ON "courses_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_team_order_idx" ON "courses_blocks_team" USING btree ("_order");
  CREATE INDEX "courses_blocks_team_parent_id_idx" ON "courses_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_team_path_idx" ON "courses_blocks_team" USING btree ("_path");
  CREATE INDEX "courses_blocks_team_evidence_evidence_verified_by_idx" ON "courses_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "courses_blocks_team_locales_locale_parent_id_unique" ON "courses_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_team_locales_parent_id_idx" ON "courses_blocks_team_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_team_members_order_idx" ON "_courses_v_blocks_team_members" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_team_members_parent_id_idx" ON "_courses_v_blocks_team_members" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_team_members_photo_idx" ON "_courses_v_blocks_team_members" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_team_members_locales_locale_parent_id_uniq" ON "_courses_v_blocks_team_members_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_team_members_locales_parent_id_idx" ON "_courses_v_blocks_team_members_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_team_order_idx" ON "_courses_v_blocks_team" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_team_parent_id_idx" ON "_courses_v_blocks_team" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_team_path_idx" ON "_courses_v_blocks_team" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_team_evidence_evidence_verified_by_idx" ON "_courses_v_blocks_team" USING btree ("evidence_verified_by_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_team_locales_locale_parent_id_unique" ON "_courses_v_blocks_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_team_locales_parent_id_idx" ON "_courses_v_blocks_team_locales" USING btree ("_parent_id");
  ALTER TABLE "pages_blocks_resource_list_items" ADD CONSTRAINT "pages_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_resource_list_items" ADD CONSTRAINT "services_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_resource_list_items" ADD CONSTRAINT "_services_v_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_resource_list_items" ADD CONSTRAINT "courses_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_resource_list_items" ADD CONSTRAINT "_courses_v_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_resource_list_items_image_idx" ON "pages_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_resource_list_items_image_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "services_blocks_resource_list_items_image_idx" ON "services_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "services_image_idx" ON "services" USING btree ("image_id");
  CREATE INDEX "_services_v_blocks_resource_list_items_image_idx" ON "_services_v_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "_services_v_version_version_image_idx" ON "_services_v" USING btree ("version_image_id");
  CREATE INDEX "courses_blocks_resource_list_items_image_idx" ON "courses_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "courses_image_idx" ON "courses" USING btree ("image_id");
  CREATE INDEX "_courses_v_blocks_resource_list_items_image_idx" ON "_courses_v_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "_courses_v_version_version_image_idx" ON "_courses_v" USING btree ("version_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_team_members_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_team_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_team_members" CASCADE;
  DROP TABLE "pages_blocks_team_members_locales" CASCADE;
  DROP TABLE "pages_blocks_team" CASCADE;
  DROP TABLE "pages_blocks_team_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_team_members" CASCADE;
  DROP TABLE "_pages_v_blocks_team_members_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_team" CASCADE;
  DROP TABLE "_pages_v_blocks_team_locales" CASCADE;
  DROP TABLE "services_blocks_team_members" CASCADE;
  DROP TABLE "services_blocks_team_members_locales" CASCADE;
  DROP TABLE "services_blocks_team" CASCADE;
  DROP TABLE "services_blocks_team_locales" CASCADE;
  DROP TABLE "_services_v_blocks_team_members" CASCADE;
  DROP TABLE "_services_v_blocks_team_members_locales" CASCADE;
  DROP TABLE "_services_v_blocks_team" CASCADE;
  DROP TABLE "_services_v_blocks_team_locales" CASCADE;
  DROP TABLE "courses_blocks_team_members" CASCADE;
  DROP TABLE "courses_blocks_team_members_locales" CASCADE;
  DROP TABLE "courses_blocks_team" CASCADE;
  DROP TABLE "courses_blocks_team_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_team_members" CASCADE;
  DROP TABLE "_courses_v_blocks_team_members_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_team" CASCADE;
  DROP TABLE "_courses_v_blocks_team_locales" CASCADE;
  ALTER TABLE "pages_blocks_resource_list_items" DROP CONSTRAINT "pages_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_resource_list_items" DROP CONSTRAINT "_pages_v_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "services_blocks_resource_list_items" DROP CONSTRAINT "services_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "services" DROP CONSTRAINT "services_image_id_media_id_fk";
  
  ALTER TABLE "_services_v_blocks_resource_list_items" DROP CONSTRAINT "_services_v_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "_services_v" DROP CONSTRAINT "_services_v_version_image_id_media_id_fk";
  
  ALTER TABLE "courses_blocks_resource_list_items" DROP CONSTRAINT "courses_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "courses" DROP CONSTRAINT "courses_image_id_media_id_fk";
  
  ALTER TABLE "_courses_v_blocks_resource_list_items" DROP CONSTRAINT "_courses_v_blocks_resource_list_items_image_id_media_id_fk";
  
  ALTER TABLE "_courses_v" DROP CONSTRAINT "_courses_v_version_image_id_media_id_fk";
  
  DROP INDEX "pages_blocks_resource_list_items_image_idx";
  DROP INDEX "_pages_v_blocks_resource_list_items_image_idx";
  DROP INDEX "services_blocks_resource_list_items_image_idx";
  DROP INDEX "services_image_idx";
  DROP INDEX "_services_v_blocks_resource_list_items_image_idx";
  DROP INDEX "_services_v_version_version_image_idx";
  DROP INDEX "courses_blocks_resource_list_items_image_idx";
  DROP INDEX "courses_image_idx";
  DROP INDEX "_courses_v_blocks_resource_list_items_image_idx";
  DROP INDEX "_courses_v_version_version_image_idx";
  ALTER TABLE "pages_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "pages_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "_pages_v_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "_pages_v_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "services_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "services_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "services" DROP COLUMN "image_id";
  ALTER TABLE "services" DROP COLUMN "icon";
  ALTER TABLE "_services_v_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "_services_v_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_icon";
  ALTER TABLE "courses_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "courses_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "courses" DROP COLUMN "image_id";
  ALTER TABLE "courses" DROP COLUMN "icon";
  ALTER TABLE "_courses_v_blocks_resource_list_items" DROP COLUMN "date";
  ALTER TABLE "_courses_v_blocks_resource_list_items" DROP COLUMN "image_id";
  ALTER TABLE "_courses_v" DROP COLUMN "version_image_id";
  ALTER TABLE "_courses_v" DROP COLUMN "version_icon";
  DROP TYPE "public"."enum_pages_blocks_team_evidence_status";
  DROP TYPE "public"."enum__pages_v_blocks_team_evidence_status";
  DROP TYPE "public"."enum_services_blocks_team_evidence_status";
  DROP TYPE "public"."enum_services_icon";
  DROP TYPE "public"."enum__services_v_blocks_team_evidence_status";
  DROP TYPE "public"."enum__services_v_version_icon";
  DROP TYPE "public"."enum_courses_blocks_team_evidence_status";
  DROP TYPE "public"."enum_courses_icon";
  DROP TYPE "public"."enum__courses_v_blocks_team_evidence_status";
  DROP TYPE "public"."enum__courses_v_version_icon";`)
}
