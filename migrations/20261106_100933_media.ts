import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "pages_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "services_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "courses_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_media_gallery_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_media_gallery_items_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_media_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_media_gallery_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"decorative" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_w480_avif_url" varchar,
  	"sizes_w480_avif_width" numeric,
  	"sizes_w480_avif_height" numeric,
  	"sizes_w480_avif_mime_type" varchar,
  	"sizes_w480_avif_filesize" numeric,
  	"sizes_w480_avif_filename" varchar,
  	"sizes_w480_webp_url" varchar,
  	"sizes_w480_webp_width" numeric,
  	"sizes_w480_webp_height" numeric,
  	"sizes_w480_webp_mime_type" varchar,
  	"sizes_w480_webp_filesize" numeric,
  	"sizes_w480_webp_filename" varchar,
  	"sizes_w480_jpeg_url" varchar,
  	"sizes_w480_jpeg_width" numeric,
  	"sizes_w480_jpeg_height" numeric,
  	"sizes_w480_jpeg_mime_type" varchar,
  	"sizes_w480_jpeg_filesize" numeric,
  	"sizes_w480_jpeg_filename" varchar,
  	"sizes_w768_avif_url" varchar,
  	"sizes_w768_avif_width" numeric,
  	"sizes_w768_avif_height" numeric,
  	"sizes_w768_avif_mime_type" varchar,
  	"sizes_w768_avif_filesize" numeric,
  	"sizes_w768_avif_filename" varchar,
  	"sizes_w768_webp_url" varchar,
  	"sizes_w768_webp_width" numeric,
  	"sizes_w768_webp_height" numeric,
  	"sizes_w768_webp_mime_type" varchar,
  	"sizes_w768_webp_filesize" numeric,
  	"sizes_w768_webp_filename" varchar,
  	"sizes_w768_jpeg_url" varchar,
  	"sizes_w768_jpeg_width" numeric,
  	"sizes_w768_jpeg_height" numeric,
  	"sizes_w768_jpeg_mime_type" varchar,
  	"sizes_w768_jpeg_filesize" numeric,
  	"sizes_w768_jpeg_filename" varchar,
  	"sizes_w1024_avif_url" varchar,
  	"sizes_w1024_avif_width" numeric,
  	"sizes_w1024_avif_height" numeric,
  	"sizes_w1024_avif_mime_type" varchar,
  	"sizes_w1024_avif_filesize" numeric,
  	"sizes_w1024_avif_filename" varchar,
  	"sizes_w1024_webp_url" varchar,
  	"sizes_w1024_webp_width" numeric,
  	"sizes_w1024_webp_height" numeric,
  	"sizes_w1024_webp_mime_type" varchar,
  	"sizes_w1024_webp_filesize" numeric,
  	"sizes_w1024_webp_filename" varchar,
  	"sizes_w1024_jpeg_url" varchar,
  	"sizes_w1024_jpeg_width" numeric,
  	"sizes_w1024_jpeg_height" numeric,
  	"sizes_w1024_jpeg_mime_type" varchar,
  	"sizes_w1024_jpeg_filesize" numeric,
  	"sizes_w1024_jpeg_filename" varchar,
  	"sizes_w1440_avif_url" varchar,
  	"sizes_w1440_avif_width" numeric,
  	"sizes_w1440_avif_height" numeric,
  	"sizes_w1440_avif_mime_type" varchar,
  	"sizes_w1440_avif_filesize" numeric,
  	"sizes_w1440_avif_filename" varchar,
  	"sizes_w1440_webp_url" varchar,
  	"sizes_w1440_webp_width" numeric,
  	"sizes_w1440_webp_height" numeric,
  	"sizes_w1440_webp_mime_type" varchar,
  	"sizes_w1440_webp_filesize" numeric,
  	"sizes_w1440_webp_filename" varchar,
  	"sizes_w1440_jpeg_url" varchar,
  	"sizes_w1440_jpeg_width" numeric,
  	"sizes_w1440_jpeg_height" numeric,
  	"sizes_w1440_jpeg_mime_type" varchar,
  	"sizes_w1440_jpeg_filesize" numeric,
  	"sizes_w1440_jpeg_filename" varchar,
  	"sizes_w1920_avif_url" varchar,
  	"sizes_w1920_avif_width" numeric,
  	"sizes_w1920_avif_height" numeric,
  	"sizes_w1920_avif_mime_type" varchar,
  	"sizes_w1920_avif_filesize" numeric,
  	"sizes_w1920_avif_filename" varchar,
  	"sizes_w1920_webp_url" varchar,
  	"sizes_w1920_webp_width" numeric,
  	"sizes_w1920_webp_height" numeric,
  	"sizes_w1920_webp_mime_type" varchar,
  	"sizes_w1920_webp_filesize" numeric,
  	"sizes_w1920_webp_filename" varchar,
  	"sizes_w1920_jpeg_url" varchar,
  	"sizes_w1920_jpeg_width" numeric,
  	"sizes_w1920_jpeg_height" numeric,
  	"sizes_w1920_jpeg_mime_type" varchar,
  	"sizes_w1920_jpeg_filesize" numeric,
  	"sizes_w1920_jpeg_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "services_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "services_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_services_v_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "_services_v_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "courses_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "courses_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "_courses_v_blocks_hero" ADD COLUMN "media_id" integer;
  ALTER TABLE "_courses_v_blocks_credentials_items" ADD COLUMN "logo_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "pages_blocks_media_gallery_items" ADD CONSTRAINT "pages_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_gallery_items" ADD CONSTRAINT "pages_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_gallery_items_locales" ADD CONSTRAINT "pages_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_gallery" ADD CONSTRAINT "pages_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_gallery_locales" ADD CONSTRAINT "pages_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_gallery_items" ADD CONSTRAINT "_pages_v_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_gallery_items" ADD CONSTRAINT "_pages_v_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_gallery_items_locales" ADD CONSTRAINT "_pages_v_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_gallery" ADD CONSTRAINT "_pages_v_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" ADD CONSTRAINT "_pages_v_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_media_gallery_items" ADD CONSTRAINT "services_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_media_gallery_items" ADD CONSTRAINT "services_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_media_gallery_items_locales" ADD CONSTRAINT "services_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_media_gallery" ADD CONSTRAINT "services_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_media_gallery_locales" ADD CONSTRAINT "services_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_gallery_items" ADD CONSTRAINT "_services_v_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_gallery_items" ADD CONSTRAINT "_services_v_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_gallery_items_locales" ADD CONSTRAINT "_services_v_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_gallery" ADD CONSTRAINT "_services_v_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_media_gallery_locales" ADD CONSTRAINT "_services_v_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_media_gallery_items" ADD CONSTRAINT "courses_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_media_gallery_items" ADD CONSTRAINT "courses_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_media_gallery_items_locales" ADD CONSTRAINT "courses_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_media_gallery" ADD CONSTRAINT "courses_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_media_gallery_locales" ADD CONSTRAINT "courses_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_media_gallery_items" ADD CONSTRAINT "_courses_v_blocks_media_gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_media_gallery_items" ADD CONSTRAINT "_courses_v_blocks_media_gallery_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_media_gallery_items_locales" ADD CONSTRAINT "_courses_v_blocks_media_gallery_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_media_gallery_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_media_gallery" ADD CONSTRAINT "_courses_v_blocks_media_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" ADD CONSTRAINT "_courses_v_blocks_media_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_media_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_media_gallery_items_order_idx" ON "pages_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_gallery_items_parent_id_idx" ON "pages_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_gallery_items_media_idx" ON "pages_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "pages_blocks_media_gallery_items_locales_locale_parent_id_un" ON "pages_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_media_gallery_items_locales_parent_id_idx" ON "pages_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_gallery_order_idx" ON "pages_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_gallery_parent_id_idx" ON "pages_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_gallery_path_idx" ON "pages_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_media_gallery_locales_locale_parent_id_unique" ON "pages_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_media_gallery_locales_parent_id_idx" ON "pages_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_items_order_idx" ON "_pages_v_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_gallery_items_parent_id_idx" ON "_pages_v_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_items_media_idx" ON "_pages_v_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_media_gallery_items_locales_locale_parent_id" ON "_pages_v_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_items_locales_parent_id_idx" ON "_pages_v_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_order_idx" ON "_pages_v_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_gallery_parent_id_idx" ON "_pages_v_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_path_idx" ON "_pages_v_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_media_gallery_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_media_gallery_locales_parent_id_idx" ON "_pages_v_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_media_gallery_items_order_idx" ON "services_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "services_blocks_media_gallery_items_parent_id_idx" ON "services_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_media_gallery_items_media_idx" ON "services_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "services_blocks_media_gallery_items_locales_locale_parent_id" ON "services_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_media_gallery_items_locales_parent_id_idx" ON "services_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_media_gallery_order_idx" ON "services_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "services_blocks_media_gallery_parent_id_idx" ON "services_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_media_gallery_path_idx" ON "services_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_media_gallery_locales_locale_parent_id_uniqu" ON "services_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_media_gallery_locales_parent_id_idx" ON "services_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_items_order_idx" ON "_services_v_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_media_gallery_items_parent_id_idx" ON "_services_v_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_items_media_idx" ON "_services_v_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "_services_v_blocks_media_gallery_items_locales_locale_parent" ON "_services_v_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_items_locales_parent_id_idx" ON "_services_v_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_order_idx" ON "_services_v_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_media_gallery_parent_id_idx" ON "_services_v_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_path_idx" ON "_services_v_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_media_gallery_locales_locale_parent_id_un" ON "_services_v_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_media_gallery_locales_parent_id_idx" ON "_services_v_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_items_order_idx" ON "courses_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_media_gallery_items_parent_id_idx" ON "courses_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_items_media_idx" ON "courses_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "courses_blocks_media_gallery_items_locales_locale_parent_id_" ON "courses_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_items_locales_parent_id_idx" ON "courses_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_order_idx" ON "courses_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "courses_blocks_media_gallery_parent_id_idx" ON "courses_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_path_idx" ON "courses_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_media_gallery_locales_locale_parent_id_unique" ON "courses_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_media_gallery_locales_parent_id_idx" ON "courses_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_items_order_idx" ON "_courses_v_blocks_media_gallery_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_media_gallery_items_parent_id_idx" ON "_courses_v_blocks_media_gallery_items" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_items_media_idx" ON "_courses_v_blocks_media_gallery_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_media_gallery_items_locales_locale_parent_" ON "_courses_v_blocks_media_gallery_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_items_locales_parent_id_idx" ON "_courses_v_blocks_media_gallery_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_order_idx" ON "_courses_v_blocks_media_gallery" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_media_gallery_parent_id_idx" ON "_courses_v_blocks_media_gallery" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_path_idx" ON "_courses_v_blocks_media_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_media_gallery_locales_locale_parent_id_uni" ON "_courses_v_blocks_media_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_media_gallery_locales_parent_id_idx" ON "_courses_v_blocks_media_gallery_locales" USING btree ("_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_w480_avif_sizes_w480_avif_filename_idx" ON "media" USING btree ("sizes_w480_avif_filename");
  CREATE INDEX "media_sizes_w480_webp_sizes_w480_webp_filename_idx" ON "media" USING btree ("sizes_w480_webp_filename");
  CREATE INDEX "media_sizes_w480_jpeg_sizes_w480_jpeg_filename_idx" ON "media" USING btree ("sizes_w480_jpeg_filename");
  CREATE INDEX "media_sizes_w768_avif_sizes_w768_avif_filename_idx" ON "media" USING btree ("sizes_w768_avif_filename");
  CREATE INDEX "media_sizes_w768_webp_sizes_w768_webp_filename_idx" ON "media" USING btree ("sizes_w768_webp_filename");
  CREATE INDEX "media_sizes_w768_jpeg_sizes_w768_jpeg_filename_idx" ON "media" USING btree ("sizes_w768_jpeg_filename");
  CREATE INDEX "media_sizes_w1024_avif_sizes_w1024_avif_filename_idx" ON "media" USING btree ("sizes_w1024_avif_filename");
  CREATE INDEX "media_sizes_w1024_webp_sizes_w1024_webp_filename_idx" ON "media" USING btree ("sizes_w1024_webp_filename");
  CREATE INDEX "media_sizes_w1024_jpeg_sizes_w1024_jpeg_filename_idx" ON "media" USING btree ("sizes_w1024_jpeg_filename");
  CREATE INDEX "media_sizes_w1440_avif_sizes_w1440_avif_filename_idx" ON "media" USING btree ("sizes_w1440_avif_filename");
  CREATE INDEX "media_sizes_w1440_webp_sizes_w1440_webp_filename_idx" ON "media" USING btree ("sizes_w1440_webp_filename");
  CREATE INDEX "media_sizes_w1440_jpeg_sizes_w1440_jpeg_filename_idx" ON "media" USING btree ("sizes_w1440_jpeg_filename");
  CREATE INDEX "media_sizes_w1920_avif_sizes_w1920_avif_filename_idx" ON "media" USING btree ("sizes_w1920_avif_filename");
  CREATE INDEX "media_sizes_w1920_webp_sizes_w1920_webp_filename_idx" ON "media" USING btree ("sizes_w1920_webp_filename");
  CREATE INDEX "media_sizes_w1920_jpeg_sizes_w1920_jpeg_filename_idx" ON "media" USING btree ("sizes_w1920_jpeg_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials_items" ADD CONSTRAINT "pages_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials_items" ADD CONSTRAINT "_pages_v_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials_items" ADD CONSTRAINT "services_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials_items" ADD CONSTRAINT "_services_v_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_hero" ADD CONSTRAINT "courses_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials_items" ADD CONSTRAINT "courses_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_hero" ADD CONSTRAINT "_courses_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials_items" ADD CONSTRAINT "_courses_v_blocks_credentials_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_media_idx" ON "pages_blocks_hero" USING btree ("media_id");
  CREATE INDEX "pages_blocks_credentials_items_logo_idx" ON "pages_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "_pages_v_blocks_hero_media_idx" ON "_pages_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_credentials_items_logo_idx" ON "_pages_v_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "services_blocks_hero_media_idx" ON "services_blocks_hero" USING btree ("media_id");
  CREATE INDEX "services_blocks_credentials_items_logo_idx" ON "services_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "_services_v_blocks_hero_media_idx" ON "_services_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_services_v_blocks_credentials_items_logo_idx" ON "_services_v_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "courses_blocks_hero_media_idx" ON "courses_blocks_hero" USING btree ("media_id");
  CREATE INDEX "courses_blocks_credentials_items_logo_idx" ON "courses_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "_courses_v_blocks_hero_media_idx" ON "_courses_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_courses_v_blocks_credentials_items_logo_idx" ON "_courses_v_blocks_credentials_items" USING btree ("logo_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");`)
}

// Down: dropping "media" CASCADE already removes the foreign keys that reference it, so the
// explicit constraint drops below are IF EXISTS (generated without it; failed in updownup).
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_media_gallery_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_media_gallery_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_media_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_media_gallery_items" CASCADE;
  DROP TABLE "pages_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "pages_blocks_media_gallery" CASCADE;
  DROP TABLE "pages_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_media_gallery_items" CASCADE;
  DROP TABLE "_pages_v_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_media_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "services_blocks_media_gallery_items" CASCADE;
  DROP TABLE "services_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "services_blocks_media_gallery" CASCADE;
  DROP TABLE "services_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "_services_v_blocks_media_gallery_items" CASCADE;
  DROP TABLE "_services_v_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_media_gallery" CASCADE;
  DROP TABLE "_services_v_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "courses_blocks_media_gallery_items" CASCADE;
  DROP TABLE "courses_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "courses_blocks_media_gallery" CASCADE;
  DROP TABLE "courses_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_media_gallery_items" CASCADE;
  DROP TABLE "_courses_v_blocks_media_gallery_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_media_gallery" CASCADE;
  DROP TABLE "_courses_v_blocks_media_gallery_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  ALTER TABLE "pages_blocks_hero" DROP CONSTRAINT IF EXISTS "pages_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "pages_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "pages_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_hero" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "_pages_v_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "services_blocks_hero" DROP CONSTRAINT IF EXISTS "services_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "services_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "services_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "_services_v_blocks_hero" DROP CONSTRAINT IF EXISTS "_services_v_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "_services_v_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "_services_v_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "courses_blocks_hero" DROP CONSTRAINT IF EXISTS "courses_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "courses_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "courses_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "_courses_v_blocks_hero" DROP CONSTRAINT IF EXISTS "_courses_v_blocks_hero_media_id_media_id_fk";
  
  ALTER TABLE "_courses_v_blocks_credentials_items" DROP CONSTRAINT IF EXISTS "_courses_v_blocks_credentials_items_logo_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_fk";
  
  DROP INDEX "pages_blocks_hero_media_idx";
  DROP INDEX "pages_blocks_credentials_items_logo_idx";
  DROP INDEX "_pages_v_blocks_hero_media_idx";
  DROP INDEX "_pages_v_blocks_credentials_items_logo_idx";
  DROP INDEX "services_blocks_hero_media_idx";
  DROP INDEX "services_blocks_credentials_items_logo_idx";
  DROP INDEX "_services_v_blocks_hero_media_idx";
  DROP INDEX "_services_v_blocks_credentials_items_logo_idx";
  DROP INDEX "courses_blocks_hero_media_idx";
  DROP INDEX "courses_blocks_credentials_items_logo_idx";
  DROP INDEX "_courses_v_blocks_hero_media_idx";
  DROP INDEX "_courses_v_blocks_credentials_items_logo_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "pages_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "_pages_v_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "services_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "services_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "_services_v_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "_services_v_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "courses_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "courses_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "_courses_v_blocks_hero" DROP COLUMN "media_id";
  ALTER TABLE "_courses_v_blocks_credentials_items" DROP COLUMN "logo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";`)
}
