import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum_pages_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TYPE "public"."enum__pages_v_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum__pages_v_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TYPE "public"."enum_services_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum_services_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TYPE "public"."enum__services_v_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum__services_v_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TYPE "public"."enum_courses_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum_courses_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TYPE "public"."enum__courses_v_blocks_text_media_media_position" AS ENUM('end', 'start');
  CREATE TYPE "public"."enum__courses_v_blocks_text_media_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_resource_list_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_resource_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_service_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_course_list_more_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_credentials_display" AS ENUM('cards', 'logos');
  CREATE TABLE "pages_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_pages_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum_pages_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "pages_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_pages_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "pages_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum_pages_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__pages_v_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum__pages_v_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__pages_v_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum__pages_v_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_services_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum_services_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "services_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "services_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_services_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "services_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum_services_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__services_v_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum__services_v_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__services_v_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum__services_v_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum_courses_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum_courses_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "courses_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_courses_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "courses_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum_courses_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_text_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"media_position" "enum__courses_v_blocks_text_media_media_position" DEFAULT 'end',
  	"link_link_type" "enum__courses_v_blocks_text_media_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_text_media_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" jsonb,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_process_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_process_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_process" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_process_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_standards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_standards_items_locales" (
  	"name" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_standards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_standards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__courses_v_blocks_resource_list_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_resource_list_items_locales" (
  	"kind" varchar,
  	"title" varchar,
  	"summary" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"more_link_link_type" "enum__courses_v_blocks_resource_list_more_link_link_type" DEFAULT 'internal',
  	"more_link_url" varchar,
  	"more_link_email" varchar,
  	"more_link_tel" varchar,
  	"more_link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_resource_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"more_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_stats_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_credentials_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "pages_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_service_list" ADD COLUMN "more_link_link_type" "enum_pages_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "pages_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "pages_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "pages_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "pages_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "pages_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "more_link_link_type" "enum_pages_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "pages_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "pages_blocks_credentials" ADD COLUMN "display" "enum_pages_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "pages_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_service_list" ADD COLUMN "more_link_link_type" "enum__pages_v_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_pages_v_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_pages_v_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_pages_v_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_pages_v_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_pages_v_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "more_link_link_type" "enum__pages_v_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_pages_v_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_pages_v_blocks_credentials" ADD COLUMN "display" "enum__pages_v_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "services_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "services_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "services_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "services_blocks_service_list" ADD COLUMN "more_link_link_type" "enum_services_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "services_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "services_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "services_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "services_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "services_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "services_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "services_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "services_blocks_course_list" ADD COLUMN "more_link_link_type" "enum_services_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "services_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "services_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "services_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "services_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "services_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "services_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "services_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "services_blocks_credentials" ADD COLUMN "display" "enum_services_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "services_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "services_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_services_v_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_services_v_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_services_v_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_services_v_blocks_service_list" ADD COLUMN "more_link_link_type" "enum__services_v_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_services_v_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_services_v_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_services_v_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_services_v_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_services_v_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_services_v_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_services_v_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_services_v_blocks_course_list" ADD COLUMN "more_link_link_type" "enum__services_v_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_services_v_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_services_v_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_services_v_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_services_v_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_services_v_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_services_v_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_services_v_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_services_v_blocks_credentials" ADD COLUMN "display" "enum__services_v_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "_services_v_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_services_v_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "courses_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "courses_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "courses_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "courses_blocks_service_list" ADD COLUMN "more_link_link_type" "enum_courses_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "courses_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "courses_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "courses_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "courses_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "courses_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "courses_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "courses_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "courses_blocks_course_list" ADD COLUMN "more_link_link_type" "enum_courses_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "courses_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "courses_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "courses_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "courses_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "courses_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "courses_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "courses_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "courses_blocks_credentials" ADD COLUMN "display" "enum_courses_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "courses_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "courses_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_courses_v_blocks_hero_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_courses_v_blocks_service_list" ADD COLUMN "more_link_link_type" "enum__courses_v_blocks_service_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_courses_v_blocks_service_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_courses_v_blocks_service_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_courses_v_blocks_service_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_courses_v_blocks_service_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_courses_v_blocks_service_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_courses_v_blocks_service_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_courses_v_blocks_service_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_courses_v_blocks_course_list" ADD COLUMN "more_link_link_type" "enum__courses_v_blocks_course_list_more_link_link_type" DEFAULT 'internal';
  ALTER TABLE "_courses_v_blocks_course_list" ADD COLUMN "more_link_url" varchar;
  ALTER TABLE "_courses_v_blocks_course_list" ADD COLUMN "more_link_email" varchar;
  ALTER TABLE "_courses_v_blocks_course_list" ADD COLUMN "more_link_tel" varchar;
  ALTER TABLE "_courses_v_blocks_course_list" ADD COLUMN "more_link_new_tab" boolean;
  ALTER TABLE "_courses_v_blocks_course_list_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_courses_v_blocks_course_list_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "_courses_v_blocks_course_list_locales" ADD COLUMN "more_link_label" varchar;
  ALTER TABLE "_courses_v_blocks_credentials" ADD COLUMN "display" "enum__courses_v_blocks_credentials_display" DEFAULT 'cards';
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_text_media" ADD CONSTRAINT "pages_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_media" ADD CONSTRAINT "pages_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_text_media_locales" ADD CONSTRAINT "pages_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_steps" ADD CONSTRAINT "pages_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_steps_locales" ADD CONSTRAINT "pages_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process" ADD CONSTRAINT "pages_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_process_locales" ADD CONSTRAINT "pages_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_standards_items" ADD CONSTRAINT "pages_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_standards_items" ADD CONSTRAINT "pages_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_standards_items_locales" ADD CONSTRAINT "pages_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_standards" ADD CONSTRAINT "pages_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_standards_locales" ADD CONSTRAINT "pages_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list_items" ADD CONSTRAINT "pages_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list_items_locales" ADD CONSTRAINT "pages_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list" ADD CONSTRAINT "pages_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list_locales" ADD CONSTRAINT "pages_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_locales" ADD CONSTRAINT "pages_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials_locales" ADD CONSTRAINT "pages_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_media" ADD CONSTRAINT "_pages_v_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_media" ADD CONSTRAINT "_pages_v_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_text_media_locales" ADD CONSTRAINT "_pages_v_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_steps" ADD CONSTRAINT "_pages_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_steps_locales" ADD CONSTRAINT "_pages_v_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process" ADD CONSTRAINT "_pages_v_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_process_locales" ADD CONSTRAINT "_pages_v_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_standards_items" ADD CONSTRAINT "_pages_v_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_standards_items" ADD CONSTRAINT "_pages_v_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_standards_items_locales" ADD CONSTRAINT "_pages_v_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_standards" ADD CONSTRAINT "_pages_v_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_standards_locales" ADD CONSTRAINT "_pages_v_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items_locales" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list" ADD CONSTRAINT "_pages_v_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_locales" ADD CONSTRAINT "_pages_v_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_locales" ADD CONSTRAINT "_pages_v_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials_locales" ADD CONSTRAINT "_pages_v_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_text_media" ADD CONSTRAINT "services_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_text_media" ADD CONSTRAINT "services_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_text_media_locales" ADD CONSTRAINT "services_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process_steps" ADD CONSTRAINT "services_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process_steps_locales" ADD CONSTRAINT "services_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process" ADD CONSTRAINT "services_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_process_locales" ADD CONSTRAINT "services_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_standards_items" ADD CONSTRAINT "services_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_standards_items" ADD CONSTRAINT "services_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_standards_items_locales" ADD CONSTRAINT "services_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_standards" ADD CONSTRAINT "services_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_standards_locales" ADD CONSTRAINT "services_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_resource_list_items" ADD CONSTRAINT "services_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_resource_list_items_locales" ADD CONSTRAINT "services_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_resource_list" ADD CONSTRAINT "services_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_resource_list_locales" ADD CONSTRAINT "services_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats_locales" ADD CONSTRAINT "services_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials_locales" ADD CONSTRAINT "services_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_text_media" ADD CONSTRAINT "_services_v_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_text_media" ADD CONSTRAINT "_services_v_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_text_media_locales" ADD CONSTRAINT "_services_v_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process_steps" ADD CONSTRAINT "_services_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process_steps_locales" ADD CONSTRAINT "_services_v_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process" ADD CONSTRAINT "_services_v_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_process_locales" ADD CONSTRAINT "_services_v_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_standards_items" ADD CONSTRAINT "_services_v_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_standards_items" ADD CONSTRAINT "_services_v_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_standards_items_locales" ADD CONSTRAINT "_services_v_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_standards" ADD CONSTRAINT "_services_v_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_standards_locales" ADD CONSTRAINT "_services_v_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_resource_list_items" ADD CONSTRAINT "_services_v_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_resource_list_items_locales" ADD CONSTRAINT "_services_v_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_resource_list" ADD CONSTRAINT "_services_v_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_resource_list_locales" ADD CONSTRAINT "_services_v_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats_locales" ADD CONSTRAINT "_services_v_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials_locales" ADD CONSTRAINT "_services_v_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_text_media" ADD CONSTRAINT "courses_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_text_media" ADD CONSTRAINT "courses_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_text_media_locales" ADD CONSTRAINT "courses_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_process_steps" ADD CONSTRAINT "courses_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_process_steps_locales" ADD CONSTRAINT "courses_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_process" ADD CONSTRAINT "courses_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_process_locales" ADD CONSTRAINT "courses_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_standards_items" ADD CONSTRAINT "courses_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_standards_items" ADD CONSTRAINT "courses_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_standards_items_locales" ADD CONSTRAINT "courses_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_standards" ADD CONSTRAINT "courses_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_standards_locales" ADD CONSTRAINT "courses_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_resource_list_items" ADD CONSTRAINT "courses_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_resource_list_items_locales" ADD CONSTRAINT "courses_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_resource_list" ADD CONSTRAINT "courses_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_resource_list_locales" ADD CONSTRAINT "courses_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_stats_locales" ADD CONSTRAINT "courses_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials_locales" ADD CONSTRAINT "courses_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_text_media" ADD CONSTRAINT "_courses_v_blocks_text_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_text_media" ADD CONSTRAINT "_courses_v_blocks_text_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_text_media_locales" ADD CONSTRAINT "_courses_v_blocks_text_media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_text_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_process_steps" ADD CONSTRAINT "_courses_v_blocks_process_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_process_steps_locales" ADD CONSTRAINT "_courses_v_blocks_process_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_process_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_process" ADD CONSTRAINT "_courses_v_blocks_process_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_process_locales" ADD CONSTRAINT "_courses_v_blocks_process_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_process"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_standards_items" ADD CONSTRAINT "_courses_v_blocks_standards_items_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_standards_items" ADD CONSTRAINT "_courses_v_blocks_standards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_standards_items_locales" ADD CONSTRAINT "_courses_v_blocks_standards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_standards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_standards" ADD CONSTRAINT "_courses_v_blocks_standards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_standards_locales" ADD CONSTRAINT "_courses_v_blocks_standards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_resource_list_items" ADD CONSTRAINT "_courses_v_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_resource_list_items_locales" ADD CONSTRAINT "_courses_v_blocks_resource_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_resource_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_resource_list" ADD CONSTRAINT "_courses_v_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_resource_list_locales" ADD CONSTRAINT "_courses_v_blocks_resource_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_stats_locales" ADD CONSTRAINT "_courses_v_blocks_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials_locales" ADD CONSTRAINT "_courses_v_blocks_credentials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_text_media_order_idx" ON "pages_blocks_text_media" USING btree ("_order");
  CREATE INDEX "pages_blocks_text_media_parent_id_idx" ON "pages_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_text_media_path_idx" ON "pages_blocks_text_media" USING btree ("_path");
  CREATE INDEX "pages_blocks_text_media_media_idx" ON "pages_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "pages_blocks_text_media_locales_locale_parent_id_unique" ON "pages_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_text_media_locales_parent_id_idx" ON "pages_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_steps_order_idx" ON "pages_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_steps_parent_id_idx" ON "pages_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_process_steps_locales_locale_parent_id_unique" ON "pages_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_process_steps_locales_parent_id_idx" ON "pages_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_order_idx" ON "pages_blocks_process" USING btree ("_order");
  CREATE INDEX "pages_blocks_process_parent_id_idx" ON "pages_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_process_path_idx" ON "pages_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_process_locales_locale_parent_id_unique" ON "pages_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_process_locales_parent_id_idx" ON "pages_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_standards_items_order_idx" ON "pages_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_standards_items_parent_id_idx" ON "pages_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_standards_items_logo_idx" ON "pages_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "pages_blocks_standards_items_locales_locale_parent_id_unique" ON "pages_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_standards_items_locales_parent_id_idx" ON "pages_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_standards_order_idx" ON "pages_blocks_standards" USING btree ("_order");
  CREATE INDEX "pages_blocks_standards_parent_id_idx" ON "pages_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_standards_path_idx" ON "pages_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_standards_locales_locale_parent_id_unique" ON "pages_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_standards_locales_parent_id_idx" ON "pages_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_list_items_order_idx" ON "pages_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_list_items_parent_id_idx" ON "pages_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_resource_list_items_locales_locale_parent_id_un" ON "pages_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_resource_list_items_locales_parent_id_idx" ON "pages_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_list_order_idx" ON "pages_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_list_parent_id_idx" ON "pages_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_list_path_idx" ON "pages_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_resource_list_locales_locale_parent_id_unique" ON "pages_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_resource_list_locales_parent_id_idx" ON "pages_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_locales_locale_parent_id_unique" ON "pages_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_locales_parent_id_idx" ON "pages_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_credentials_locales_locale_parent_id_unique" ON "pages_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_credentials_locales_parent_id_idx" ON "pages_blocks_credentials_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_media_order_idx" ON "_pages_v_blocks_text_media" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_text_media_parent_id_idx" ON "_pages_v_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_text_media_path_idx" ON "_pages_v_blocks_text_media" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_text_media_media_idx" ON "_pages_v_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_text_media_locales_locale_parent_id_unique" ON "_pages_v_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_text_media_locales_parent_id_idx" ON "_pages_v_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_steps_order_idx" ON "_pages_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_steps_parent_id_idx" ON "_pages_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_process_steps_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_process_steps_locales_parent_id_idx" ON "_pages_v_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_order_idx" ON "_pages_v_blocks_process" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_process_parent_id_idx" ON "_pages_v_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_process_path_idx" ON "_pages_v_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_process_locales_locale_parent_id_unique" ON "_pages_v_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_process_locales_parent_id_idx" ON "_pages_v_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_items_order_idx" ON "_pages_v_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_standards_items_parent_id_idx" ON "_pages_v_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_items_logo_idx" ON "_pages_v_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_standards_items_locales_locale_parent_id_uni" ON "_pages_v_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_items_locales_parent_id_idx" ON "_pages_v_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_order_idx" ON "_pages_v_blocks_standards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_standards_parent_id_idx" ON "_pages_v_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_path_idx" ON "_pages_v_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_standards_locales_locale_parent_id_unique" ON "_pages_v_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_standards_locales_parent_id_idx" ON "_pages_v_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_items_order_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_list_items_parent_id_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_resource_list_items_locales_locale_parent_id" ON "_pages_v_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_items_locales_parent_id_idx" ON "_pages_v_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_order_idx" ON "_pages_v_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_list_parent_id_idx" ON "_pages_v_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_path_idx" ON "_pages_v_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_resource_list_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_locales_parent_id_idx" ON "_pages_v_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_locales_parent_id_idx" ON "_pages_v_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_credentials_locales_locale_parent_id_unique" ON "_pages_v_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_credentials_locales_parent_id_idx" ON "_pages_v_blocks_credentials_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_text_media_order_idx" ON "services_blocks_text_media" USING btree ("_order");
  CREATE INDEX "services_blocks_text_media_parent_id_idx" ON "services_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_text_media_path_idx" ON "services_blocks_text_media" USING btree ("_path");
  CREATE INDEX "services_blocks_text_media_media_idx" ON "services_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "services_blocks_text_media_locales_locale_parent_id_unique" ON "services_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_text_media_locales_parent_id_idx" ON "services_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_process_steps_order_idx" ON "services_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "services_blocks_process_steps_parent_id_idx" ON "services_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_process_steps_locales_locale_parent_id_uniqu" ON "services_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_process_steps_locales_parent_id_idx" ON "services_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_process_order_idx" ON "services_blocks_process" USING btree ("_order");
  CREATE INDEX "services_blocks_process_parent_id_idx" ON "services_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_process_path_idx" ON "services_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_process_locales_locale_parent_id_unique" ON "services_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_process_locales_parent_id_idx" ON "services_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_standards_items_order_idx" ON "services_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "services_blocks_standards_items_parent_id_idx" ON "services_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_standards_items_logo_idx" ON "services_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "services_blocks_standards_items_locales_locale_parent_id_uni" ON "services_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_standards_items_locales_parent_id_idx" ON "services_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_standards_order_idx" ON "services_blocks_standards" USING btree ("_order");
  CREATE INDEX "services_blocks_standards_parent_id_idx" ON "services_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_standards_path_idx" ON "services_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_standards_locales_locale_parent_id_unique" ON "services_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_standards_locales_parent_id_idx" ON "services_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_resource_list_items_order_idx" ON "services_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "services_blocks_resource_list_items_parent_id_idx" ON "services_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_resource_list_items_locales_locale_parent_id" ON "services_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_resource_list_items_locales_parent_id_idx" ON "services_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_resource_list_order_idx" ON "services_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "services_blocks_resource_list_parent_id_idx" ON "services_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_resource_list_path_idx" ON "services_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_resource_list_locales_locale_parent_id_uniqu" ON "services_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_resource_list_locales_parent_id_idx" ON "services_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_stats_locales_locale_parent_id_unique" ON "services_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_stats_locales_parent_id_idx" ON "services_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_credentials_locales_locale_parent_id_unique" ON "services_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_credentials_locales_parent_id_idx" ON "services_blocks_credentials_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_text_media_order_idx" ON "_services_v_blocks_text_media" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_text_media_parent_id_idx" ON "_services_v_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_text_media_path_idx" ON "_services_v_blocks_text_media" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_text_media_media_idx" ON "_services_v_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "_services_v_blocks_text_media_locales_locale_parent_id_uniqu" ON "_services_v_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_text_media_locales_parent_id_idx" ON "_services_v_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_process_steps_order_idx" ON "_services_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_process_steps_parent_id_idx" ON "_services_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_process_steps_locales_locale_parent_id_un" ON "_services_v_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_process_steps_locales_parent_id_idx" ON "_services_v_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_process_order_idx" ON "_services_v_blocks_process" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_process_parent_id_idx" ON "_services_v_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_process_path_idx" ON "_services_v_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_process_locales_locale_parent_id_unique" ON "_services_v_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_process_locales_parent_id_idx" ON "_services_v_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_standards_items_order_idx" ON "_services_v_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_standards_items_parent_id_idx" ON "_services_v_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_standards_items_logo_idx" ON "_services_v_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_services_v_blocks_standards_items_locales_locale_parent_id_" ON "_services_v_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_standards_items_locales_parent_id_idx" ON "_services_v_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_standards_order_idx" ON "_services_v_blocks_standards" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_standards_parent_id_idx" ON "_services_v_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_standards_path_idx" ON "_services_v_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_standards_locales_locale_parent_id_unique" ON "_services_v_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_standards_locales_parent_id_idx" ON "_services_v_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_resource_list_items_order_idx" ON "_services_v_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_resource_list_items_parent_id_idx" ON "_services_v_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_resource_list_items_locales_locale_parent" ON "_services_v_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_resource_list_items_locales_parent_id_idx" ON "_services_v_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_resource_list_order_idx" ON "_services_v_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_resource_list_parent_id_idx" ON "_services_v_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_resource_list_path_idx" ON "_services_v_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_resource_list_locales_locale_parent_id_un" ON "_services_v_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_resource_list_locales_parent_id_idx" ON "_services_v_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_stats_locales_locale_parent_id_unique" ON "_services_v_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_stats_locales_parent_id_idx" ON "_services_v_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_credentials_locales_locale_parent_id_uniq" ON "_services_v_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_credentials_locales_parent_id_idx" ON "_services_v_blocks_credentials_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_text_media_order_idx" ON "courses_blocks_text_media" USING btree ("_order");
  CREATE INDEX "courses_blocks_text_media_parent_id_idx" ON "courses_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_text_media_path_idx" ON "courses_blocks_text_media" USING btree ("_path");
  CREATE INDEX "courses_blocks_text_media_media_idx" ON "courses_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "courses_blocks_text_media_locales_locale_parent_id_unique" ON "courses_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_text_media_locales_parent_id_idx" ON "courses_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_process_steps_order_idx" ON "courses_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "courses_blocks_process_steps_parent_id_idx" ON "courses_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_process_steps_locales_locale_parent_id_unique" ON "courses_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_process_steps_locales_parent_id_idx" ON "courses_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_process_order_idx" ON "courses_blocks_process" USING btree ("_order");
  CREATE INDEX "courses_blocks_process_parent_id_idx" ON "courses_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_process_path_idx" ON "courses_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_process_locales_locale_parent_id_unique" ON "courses_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_process_locales_parent_id_idx" ON "courses_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_standards_items_order_idx" ON "courses_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_standards_items_parent_id_idx" ON "courses_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_standards_items_logo_idx" ON "courses_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "courses_blocks_standards_items_locales_locale_parent_id_uniq" ON "courses_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_standards_items_locales_parent_id_idx" ON "courses_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_standards_order_idx" ON "courses_blocks_standards" USING btree ("_order");
  CREATE INDEX "courses_blocks_standards_parent_id_idx" ON "courses_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_standards_path_idx" ON "courses_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_standards_locales_locale_parent_id_unique" ON "courses_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_standards_locales_parent_id_idx" ON "courses_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_resource_list_items_order_idx" ON "courses_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_resource_list_items_parent_id_idx" ON "courses_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_resource_list_items_locales_locale_parent_id_" ON "courses_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_resource_list_items_locales_parent_id_idx" ON "courses_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_resource_list_order_idx" ON "courses_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "courses_blocks_resource_list_parent_id_idx" ON "courses_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_resource_list_path_idx" ON "courses_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_resource_list_locales_locale_parent_id_unique" ON "courses_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_resource_list_locales_parent_id_idx" ON "courses_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_stats_locales_locale_parent_id_unique" ON "courses_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_stats_locales_parent_id_idx" ON "courses_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_credentials_locales_locale_parent_id_unique" ON "courses_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_credentials_locales_parent_id_idx" ON "courses_blocks_credentials_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_text_media_order_idx" ON "_courses_v_blocks_text_media" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_text_media_parent_id_idx" ON "_courses_v_blocks_text_media" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_text_media_path_idx" ON "_courses_v_blocks_text_media" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_text_media_media_idx" ON "_courses_v_blocks_text_media" USING btree ("media_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_text_media_locales_locale_parent_id_unique" ON "_courses_v_blocks_text_media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_text_media_locales_parent_id_idx" ON "_courses_v_blocks_text_media_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_process_steps_order_idx" ON "_courses_v_blocks_process_steps" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_process_steps_parent_id_idx" ON "_courses_v_blocks_process_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_process_steps_locales_locale_parent_id_uni" ON "_courses_v_blocks_process_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_process_steps_locales_parent_id_idx" ON "_courses_v_blocks_process_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_process_order_idx" ON "_courses_v_blocks_process" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_process_parent_id_idx" ON "_courses_v_blocks_process" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_process_path_idx" ON "_courses_v_blocks_process" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_process_locales_locale_parent_id_unique" ON "_courses_v_blocks_process_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_process_locales_parent_id_idx" ON "_courses_v_blocks_process_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_items_order_idx" ON "_courses_v_blocks_standards_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_standards_items_parent_id_idx" ON "_courses_v_blocks_standards_items" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_items_logo_idx" ON "_courses_v_blocks_standards_items" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_standards_items_locales_locale_parent_id_u" ON "_courses_v_blocks_standards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_items_locales_parent_id_idx" ON "_courses_v_blocks_standards_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_order_idx" ON "_courses_v_blocks_standards" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_standards_parent_id_idx" ON "_courses_v_blocks_standards" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_path_idx" ON "_courses_v_blocks_standards" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_standards_locales_locale_parent_id_unique" ON "_courses_v_blocks_standards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_standards_locales_parent_id_idx" ON "_courses_v_blocks_standards_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_resource_list_items_order_idx" ON "_courses_v_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_resource_list_items_parent_id_idx" ON "_courses_v_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_resource_list_items_locales_locale_parent_" ON "_courses_v_blocks_resource_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_resource_list_items_locales_parent_id_idx" ON "_courses_v_blocks_resource_list_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_resource_list_order_idx" ON "_courses_v_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_resource_list_parent_id_idx" ON "_courses_v_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_resource_list_path_idx" ON "_courses_v_blocks_resource_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_resource_list_locales_locale_parent_id_uni" ON "_courses_v_blocks_resource_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_resource_list_locales_parent_id_idx" ON "_courses_v_blocks_resource_list_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_stats_locales_locale_parent_id_unique" ON "_courses_v_blocks_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_stats_locales_parent_id_idx" ON "_courses_v_blocks_stats_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_credentials_locales_locale_parent_id_uniqu" ON "_courses_v_blocks_credentials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_credentials_locales_parent_id_idx" ON "_courses_v_blocks_credentials_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_text_media" CASCADE;
  DROP TABLE "pages_blocks_text_media_locales" CASCADE;
  DROP TABLE "pages_blocks_process_steps" CASCADE;
  DROP TABLE "pages_blocks_process_steps_locales" CASCADE;
  DROP TABLE "pages_blocks_process" CASCADE;
  DROP TABLE "pages_blocks_process_locales" CASCADE;
  DROP TABLE "pages_blocks_standards_items" CASCADE;
  DROP TABLE "pages_blocks_standards_items_locales" CASCADE;
  DROP TABLE "pages_blocks_standards" CASCADE;
  DROP TABLE "pages_blocks_standards_locales" CASCADE;
  DROP TABLE "pages_blocks_resource_list_items" CASCADE;
  DROP TABLE "pages_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "pages_blocks_resource_list" CASCADE;
  DROP TABLE "pages_blocks_resource_list_locales" CASCADE;
  DROP TABLE "pages_blocks_stats_locales" CASCADE;
  DROP TABLE "pages_blocks_credentials_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_text_media" CASCADE;
  DROP TABLE "_pages_v_blocks_text_media_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_process_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_process_steps_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_process" CASCADE;
  DROP TABLE "_pages_v_blocks_process_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_standards_items" CASCADE;
  DROP TABLE "_pages_v_blocks_standards_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_standards" CASCADE;
  DROP TABLE "_pages_v_blocks_standards_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list_items" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_credentials_locales" CASCADE;
  DROP TABLE "services_blocks_text_media" CASCADE;
  DROP TABLE "services_blocks_text_media_locales" CASCADE;
  DROP TABLE "services_blocks_process_steps" CASCADE;
  DROP TABLE "services_blocks_process_steps_locales" CASCADE;
  DROP TABLE "services_blocks_process" CASCADE;
  DROP TABLE "services_blocks_process_locales" CASCADE;
  DROP TABLE "services_blocks_standards_items" CASCADE;
  DROP TABLE "services_blocks_standards_items_locales" CASCADE;
  DROP TABLE "services_blocks_standards" CASCADE;
  DROP TABLE "services_blocks_standards_locales" CASCADE;
  DROP TABLE "services_blocks_resource_list_items" CASCADE;
  DROP TABLE "services_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "services_blocks_resource_list" CASCADE;
  DROP TABLE "services_blocks_resource_list_locales" CASCADE;
  DROP TABLE "services_blocks_stats_locales" CASCADE;
  DROP TABLE "services_blocks_credentials_locales" CASCADE;
  DROP TABLE "_services_v_blocks_text_media" CASCADE;
  DROP TABLE "_services_v_blocks_text_media_locales" CASCADE;
  DROP TABLE "_services_v_blocks_process_steps" CASCADE;
  DROP TABLE "_services_v_blocks_process_steps_locales" CASCADE;
  DROP TABLE "_services_v_blocks_process" CASCADE;
  DROP TABLE "_services_v_blocks_process_locales" CASCADE;
  DROP TABLE "_services_v_blocks_standards_items" CASCADE;
  DROP TABLE "_services_v_blocks_standards_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_standards" CASCADE;
  DROP TABLE "_services_v_blocks_standards_locales" CASCADE;
  DROP TABLE "_services_v_blocks_resource_list_items" CASCADE;
  DROP TABLE "_services_v_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_resource_list" CASCADE;
  DROP TABLE "_services_v_blocks_resource_list_locales" CASCADE;
  DROP TABLE "_services_v_blocks_stats_locales" CASCADE;
  DROP TABLE "_services_v_blocks_credentials_locales" CASCADE;
  DROP TABLE "courses_blocks_text_media" CASCADE;
  DROP TABLE "courses_blocks_text_media_locales" CASCADE;
  DROP TABLE "courses_blocks_process_steps" CASCADE;
  DROP TABLE "courses_blocks_process_steps_locales" CASCADE;
  DROP TABLE "courses_blocks_process" CASCADE;
  DROP TABLE "courses_blocks_process_locales" CASCADE;
  DROP TABLE "courses_blocks_standards_items" CASCADE;
  DROP TABLE "courses_blocks_standards_items_locales" CASCADE;
  DROP TABLE "courses_blocks_standards" CASCADE;
  DROP TABLE "courses_blocks_standards_locales" CASCADE;
  DROP TABLE "courses_blocks_resource_list_items" CASCADE;
  DROP TABLE "courses_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "courses_blocks_resource_list" CASCADE;
  DROP TABLE "courses_blocks_resource_list_locales" CASCADE;
  DROP TABLE "courses_blocks_stats_locales" CASCADE;
  DROP TABLE "courses_blocks_credentials_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_text_media" CASCADE;
  DROP TABLE "_courses_v_blocks_text_media_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_process_steps" CASCADE;
  DROP TABLE "_courses_v_blocks_process_steps_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_process" CASCADE;
  DROP TABLE "_courses_v_blocks_process_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_standards_items" CASCADE;
  DROP TABLE "_courses_v_blocks_standards_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_standards" CASCADE;
  DROP TABLE "_courses_v_blocks_standards_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_resource_list_items" CASCADE;
  DROP TABLE "_courses_v_blocks_resource_list_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_resource_list" CASCADE;
  DROP TABLE "_courses_v_blocks_resource_list_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_stats_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_credentials_locales" CASCADE;
  ALTER TABLE "pages_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "pages_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "pages_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "pages_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "pages_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "pages_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "pages_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "pages_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "pages_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_media_gallery_locales" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_pages_v_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_pages_v_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_pages_v_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_pages_v_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_pages_v_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_pages_v_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_pages_v_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_media_gallery_locales" DROP COLUMN "intro";
  ALTER TABLE "services_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "services_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "services_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "services_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "services_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "services_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "services_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "services_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "services_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "services_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "services_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "services_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "services_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "services_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "services_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "services_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "services_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "services_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "services_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "services_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "services_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "services_blocks_media_gallery_locales" DROP COLUMN "intro";
  ALTER TABLE "_services_v_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_services_v_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_services_v_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "_services_v_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_services_v_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_services_v_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_services_v_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_services_v_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_services_v_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_services_v_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_services_v_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_services_v_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_services_v_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_services_v_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_services_v_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_services_v_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_services_v_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_services_v_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_services_v_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_services_v_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "_services_v_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_services_v_blocks_media_gallery_locales" DROP COLUMN "intro";
  ALTER TABLE "courses_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "courses_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "courses_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "courses_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "courses_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "courses_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "courses_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "courses_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "courses_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "courses_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "courses_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "courses_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "courses_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "courses_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "courses_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "courses_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "courses_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "courses_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "courses_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "courses_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "courses_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "courses_blocks_media_gallery_locales" DROP COLUMN "intro";
  ALTER TABLE "_courses_v_blocks_hero_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" DROP COLUMN "intro";
  ALTER TABLE "_courses_v_blocks_service_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_courses_v_blocks_service_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_courses_v_blocks_service_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_courses_v_blocks_service_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_courses_v_blocks_service_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_courses_v_blocks_service_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_courses_v_blocks_service_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_courses_v_blocks_service_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_courses_v_blocks_course_list" DROP COLUMN "more_link_link_type";
  ALTER TABLE "_courses_v_blocks_course_list" DROP COLUMN "more_link_url";
  ALTER TABLE "_courses_v_blocks_course_list" DROP COLUMN "more_link_email";
  ALTER TABLE "_courses_v_blocks_course_list" DROP COLUMN "more_link_tel";
  ALTER TABLE "_courses_v_blocks_course_list" DROP COLUMN "more_link_new_tab";
  ALTER TABLE "_courses_v_blocks_course_list_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_courses_v_blocks_course_list_locales" DROP COLUMN "intro";
  ALTER TABLE "_courses_v_blocks_course_list_locales" DROP COLUMN "more_link_label";
  ALTER TABLE "_courses_v_blocks_credentials" DROP COLUMN "display";
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" DROP COLUMN "eyebrow";
  ALTER TABLE "_courses_v_blocks_media_gallery_locales" DROP COLUMN "intro";
  DROP TYPE "public"."enum_pages_blocks_text_media_media_position";
  DROP TYPE "public"."enum_pages_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_credentials_display";
  DROP TYPE "public"."enum__pages_v_blocks_text_media_media_position";
  DROP TYPE "public"."enum__pages_v_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_credentials_display";
  DROP TYPE "public"."enum_services_blocks_text_media_media_position";
  DROP TYPE "public"."enum_services_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum_services_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum_services_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum_services_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum_services_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum_services_blocks_credentials_display";
  DROP TYPE "public"."enum__services_v_blocks_text_media_media_position";
  DROP TYPE "public"."enum__services_v_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_credentials_display";
  DROP TYPE "public"."enum_courses_blocks_text_media_media_position";
  DROP TYPE "public"."enum_courses_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_credentials_display";
  DROP TYPE "public"."enum__courses_v_blocks_text_media_media_position";
  DROP TYPE "public"."enum__courses_v_blocks_text_media_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_resource_list_items_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_resource_list_more_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_service_list_more_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_course_list_more_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_credentials_display";`)
}
