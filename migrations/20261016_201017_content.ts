import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum_pages_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_pages_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_pages_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_pages_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_pages_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_pages_template" AS ENUM('default', 'home', 'legal');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum__pages_v_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__pages_v_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__pages_v_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__pages_v_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__pages_v_version_template" AS ENUM('default', 'home', 'legal');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_services_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum_services_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_services_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_services_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_services_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_services_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_v_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum__services_v_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__services_v_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__services_v_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__services_v_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__services_v_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__services_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_courses_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum_courses_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_courses_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum_courses_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_courses_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_courses_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_courses_duration_unit" AS ENUM('hours', 'days', 'weeks');
  CREATE TYPE "public"."enum_courses_delivery_format" AS ENUM('in-person', 'online', 'hybrid');
  CREATE TYPE "public"."enum_courses_accreditation_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_blocks_hero_primary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_hero_secondary_cta_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_feature_grid_items_icon" AS ENUM('shield', 'audit', 'policy', 'training', 'risk', 'response');
  CREATE TYPE "public"."enum__courses_v_blocks_service_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__courses_v_blocks_course_list_mode" AS ENUM('all', 'selected');
  CREATE TYPE "public"."enum__courses_v_blocks_cta_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__courses_v_blocks_stats_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__courses_v_blocks_credentials_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__courses_v_version_duration_unit" AS ENUM('hours', 'days', 'weeks');
  CREATE TYPE "public"."enum__courses_v_version_delivery_format" AS ENUM('in-person', 'online', 'hybrid');
  CREATE TYPE "public"."enum__courses_v_version_accreditation_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__courses_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('301', '302');
  CREATE TYPE "public"."enum_redirects_source" AS ENUM('manual', 'slug-change', 'legacy');
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum_pages_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum_pages_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_pages_blocks_feature_grid_items_icon"
  );
  
  CREATE TABLE "pages_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_pages_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_pages_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_pages_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_pages_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "pages_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_pages_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"template" "enum_pages_template" DEFAULT 'default',
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"_status" "enum_pages_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum__pages_v_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum__pages_v_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__pages_v_blocks_feature_grid_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__pages_v_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__pages_v_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__pages_v_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__pages_v_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__pages_v_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_template" "enum__pages_v_version_template" DEFAULT 'default',
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "services_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum_services_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum_services_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_services_blocks_feature_grid_items_icon"
  );
  
  CREATE TABLE "services_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_services_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_services_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_services_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "services_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "services_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_services_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "services_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_services_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"hidden" boolean DEFAULT false,
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"_status" "enum_services_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_services_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum__services_v_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum__services_v_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__services_v_blocks_feature_grid_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__services_v_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__services_v_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__services_v_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__services_v_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__services_v_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_hidden" boolean DEFAULT false,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__services_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_services_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version__status" "enum__services_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "courses_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum_courses_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum_courses_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_courses_blocks_feature_grid_items_icon"
  );
  
  CREATE TABLE "courses_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_courses_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mode" "enum_courses_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_courses_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "courses_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_courses_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "courses_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"evidence_status" "enum_courses_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "courses_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" numeric DEFAULT 0,
  	"hidden" boolean DEFAULT false,
  	"duration_value" numeric,
  	"duration_unit" "enum_courses_duration_unit",
  	"delivery_format" "enum_courses_delivery_format",
  	"accreditation_evidence_status" "enum_courses_accreditation_evidence_status" DEFAULT 'unverified',
  	"accreditation_evidence_reference" varchar,
  	"accreditation_evidence_verified_by_id" integer,
  	"accreditation_evidence_verified_at" timestamp(3) with time zone,
  	"seo_noindex" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"audience" varchar,
  	"provider" varchar,
  	"accreditation_statement" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"_status" "enum_courses_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_courses_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"primary_cta_link_type" "enum__courses_v_blocks_hero_primary_cta_link_type" DEFAULT 'internal',
  	"primary_cta_url" varchar,
  	"primary_cta_email" varchar,
  	"primary_cta_tel" varchar,
  	"primary_cta_new_tab" boolean,
  	"secondary_cta_link_type" "enum__courses_v_blocks_hero_secondary_cta_link_type" DEFAULT 'internal',
  	"secondary_cta_url" varchar,
  	"secondary_cta_email" varchar,
  	"secondary_cta_tel" varchar,
  	"secondary_cta_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_hero_locales" (
  	"heading" varchar,
  	"subheading" varchar,
  	"primary_cta_label" varchar,
  	"secondary_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_rich_text_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_feature_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__courses_v_blocks_feature_grid_items_icon",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_feature_grid_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_feature_grid_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_service_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__courses_v_blocks_service_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_service_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_course_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum__courses_v_blocks_course_list_mode" DEFAULT 'all',
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_course_list_locales" (
  	"heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__courses_v_blocks_cta_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_cta_locales" (
  	"heading" varchar,
  	"text" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__courses_v_blocks_stats_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_credentials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"valid_until" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_credentials_items_locales" (
  	"name" varchar,
  	"issuer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_blocks_credentials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_status" "enum__courses_v_blocks_credentials_evidence_status" DEFAULT 'unverified',
  	"evidence_reference" varchar,
  	"evidence_verified_by_id" integer,
  	"evidence_verified_at" timestamp(3) with time zone,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_contact_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"hidden" boolean DEFAULT false,
  	"anchor_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_courses_v_blocks_contact_block_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_hidden" boolean DEFAULT false,
  	"version_duration_value" numeric,
  	"version_duration_unit" "enum__courses_v_version_duration_unit",
  	"version_delivery_format" "enum__courses_v_version_delivery_format",
  	"version_accreditation_evidence_status" "enum__courses_v_version_accreditation_evidence_status" DEFAULT 'unverified',
  	"version_accreditation_evidence_reference" varchar,
  	"version_accreditation_evidence_verified_by_id" integer,
  	"version_accreditation_evidence_verified_at" timestamp(3) with time zone,
  	"version_seo_noindex" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__courses_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_courses_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_audience" varchar,
  	"version_provider" varchar,
  	"version_accreditation_statement" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version__status" "enum__courses_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"type" "enum_redirects_type" DEFAULT '301' NOT NULL,
  	"source" "enum_redirects_source" DEFAULT 'manual' NOT NULL,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text" ADD CONSTRAINT "pages_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_rich_text_locales" ADD CONSTRAINT "pages_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_items" ADD CONSTRAINT "pages_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_items_locales" ADD CONSTRAINT "pages_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid" ADD CONSTRAINT "pages_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_feature_grid_locales" ADD CONSTRAINT "pages_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_service_list" ADD CONSTRAINT "pages_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_service_list_locales" ADD CONSTRAINT "pages_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_list" ADD CONSTRAINT "pages_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_course_list_locales" ADD CONSTRAINT "pages_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_locales" ADD CONSTRAINT "pages_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items_locales" ADD CONSTRAINT "pages_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials_items" ADD CONSTRAINT "pages_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials_items_locales" ADD CONSTRAINT "pages_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials" ADD CONSTRAINT "pages_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_credentials" ADD CONSTRAINT "pages_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_block" ADD CONSTRAINT "pages_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact_block_locales" ADD CONSTRAINT "pages_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text" ADD CONSTRAINT "_pages_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" ADD CONSTRAINT "_pages_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_items" ADD CONSTRAINT "_pages_v_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_items_locales" ADD CONSTRAINT "_pages_v_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid" ADD CONSTRAINT "_pages_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" ADD CONSTRAINT "_pages_v_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_list" ADD CONSTRAINT "_pages_v_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_service_list_locales" ADD CONSTRAINT "_pages_v_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_list" ADD CONSTRAINT "_pages_v_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_course_list_locales" ADD CONSTRAINT "_pages_v_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_locales" ADD CONSTRAINT "_pages_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items" ADD CONSTRAINT "_pages_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats_items_locales" ADD CONSTRAINT "_pages_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_stats" ADD CONSTRAINT "_pages_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials_items" ADD CONSTRAINT "_pages_v_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials_items_locales" ADD CONSTRAINT "_pages_v_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials" ADD CONSTRAINT "_pages_v_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_credentials" ADD CONSTRAINT "_pages_v_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_block" ADD CONSTRAINT "_pages_v_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_contact_block_locales" ADD CONSTRAINT "_pages_v_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hero" ADD CONSTRAINT "services_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_hero_locales" ADD CONSTRAINT "services_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_rich_text" ADD CONSTRAINT "services_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_rich_text_locales" ADD CONSTRAINT "services_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_feature_grid_items" ADD CONSTRAINT "services_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_feature_grid_items_locales" ADD CONSTRAINT "services_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_feature_grid" ADD CONSTRAINT "services_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_feature_grid_locales" ADD CONSTRAINT "services_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_service_list" ADD CONSTRAINT "services_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_service_list_locales" ADD CONSTRAINT "services_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_course_list" ADD CONSTRAINT "services_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_course_list_locales" ADD CONSTRAINT "services_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_cta" ADD CONSTRAINT "services_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_cta_locales" ADD CONSTRAINT "services_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq_items" ADD CONSTRAINT "services_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq_items_locales" ADD CONSTRAINT "services_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_faq" ADD CONSTRAINT "services_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats_items" ADD CONSTRAINT "services_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats_items_locales" ADD CONSTRAINT "services_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_stats" ADD CONSTRAINT "services_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_stats" ADD CONSTRAINT "services_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials_items" ADD CONSTRAINT "services_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials_items_locales" ADD CONSTRAINT "services_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials" ADD CONSTRAINT "services_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_blocks_credentials" ADD CONSTRAINT "services_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_contact_block" ADD CONSTRAINT "services_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_contact_block_locales" ADD CONSTRAINT "services_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero" ADD CONSTRAINT "_services_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_hero_locales" ADD CONSTRAINT "_services_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_rich_text" ADD CONSTRAINT "_services_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_rich_text_locales" ADD CONSTRAINT "_services_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_feature_grid_items" ADD CONSTRAINT "_services_v_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_feature_grid_items_locales" ADD CONSTRAINT "_services_v_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_feature_grid" ADD CONSTRAINT "_services_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_feature_grid_locales" ADD CONSTRAINT "_services_v_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_list" ADD CONSTRAINT "_services_v_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_service_list_locales" ADD CONSTRAINT "_services_v_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_course_list" ADD CONSTRAINT "_services_v_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_course_list_locales" ADD CONSTRAINT "_services_v_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta" ADD CONSTRAINT "_services_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_cta_locales" ADD CONSTRAINT "_services_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq_items" ADD CONSTRAINT "_services_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq_items_locales" ADD CONSTRAINT "_services_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_faq" ADD CONSTRAINT "_services_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats_items" ADD CONSTRAINT "_services_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats_items_locales" ADD CONSTRAINT "_services_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats" ADD CONSTRAINT "_services_v_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_stats" ADD CONSTRAINT "_services_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials_items" ADD CONSTRAINT "_services_v_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials_items_locales" ADD CONSTRAINT "_services_v_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials" ADD CONSTRAINT "_services_v_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_credentials" ADD CONSTRAINT "_services_v_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_contact_block" ADD CONSTRAINT "_services_v_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_contact_block_locales" ADD CONSTRAINT "_services_v_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_parent_id_services_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v_locales" ADD CONSTRAINT "_services_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_rels" ADD CONSTRAINT "_services_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_hero" ADD CONSTRAINT "courses_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_hero_locales" ADD CONSTRAINT "courses_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_rich_text" ADD CONSTRAINT "courses_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_rich_text_locales" ADD CONSTRAINT "courses_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_feature_grid_items" ADD CONSTRAINT "courses_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_feature_grid_items_locales" ADD CONSTRAINT "courses_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_feature_grid" ADD CONSTRAINT "courses_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_feature_grid_locales" ADD CONSTRAINT "courses_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_service_list" ADD CONSTRAINT "courses_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_service_list_locales" ADD CONSTRAINT "courses_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_course_list" ADD CONSTRAINT "courses_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_course_list_locales" ADD CONSTRAINT "courses_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_cta" ADD CONSTRAINT "courses_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_cta_locales" ADD CONSTRAINT "courses_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_faq_items" ADD CONSTRAINT "courses_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_faq_items_locales" ADD CONSTRAINT "courses_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_faq" ADD CONSTRAINT "courses_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_stats_items" ADD CONSTRAINT "courses_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_stats_items_locales" ADD CONSTRAINT "courses_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_stats" ADD CONSTRAINT "courses_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_stats" ADD CONSTRAINT "courses_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials_items" ADD CONSTRAINT "courses_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials_items_locales" ADD CONSTRAINT "courses_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials" ADD CONSTRAINT "courses_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_blocks_credentials" ADD CONSTRAINT "courses_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_contact_block" ADD CONSTRAINT "courses_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_blocks_contact_block_locales" ADD CONSTRAINT "courses_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_accreditation_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("accreditation_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_hero" ADD CONSTRAINT "_courses_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_hero_locales" ADD CONSTRAINT "_courses_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_rich_text" ADD CONSTRAINT "_courses_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_rich_text_locales" ADD CONSTRAINT "_courses_v_blocks_rich_text_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_rich_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_feature_grid_items" ADD CONSTRAINT "_courses_v_blocks_feature_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_feature_grid_items_locales" ADD CONSTRAINT "_courses_v_blocks_feature_grid_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_feature_grid_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_feature_grid" ADD CONSTRAINT "_courses_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" ADD CONSTRAINT "_courses_v_blocks_feature_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_service_list" ADD CONSTRAINT "_courses_v_blocks_service_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_service_list_locales" ADD CONSTRAINT "_courses_v_blocks_service_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_service_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_course_list" ADD CONSTRAINT "_courses_v_blocks_course_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_course_list_locales" ADD CONSTRAINT "_courses_v_blocks_course_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_course_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_cta" ADD CONSTRAINT "_courses_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_cta_locales" ADD CONSTRAINT "_courses_v_blocks_cta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_faq_items" ADD CONSTRAINT "_courses_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_faq_items_locales" ADD CONSTRAINT "_courses_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_faq" ADD CONSTRAINT "_courses_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_stats_items" ADD CONSTRAINT "_courses_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_stats_items_locales" ADD CONSTRAINT "_courses_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_stats" ADD CONSTRAINT "_courses_v_blocks_stats_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_stats" ADD CONSTRAINT "_courses_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials_items" ADD CONSTRAINT "_courses_v_blocks_credentials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_credentials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials_items_locales" ADD CONSTRAINT "_courses_v_blocks_credentials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_credentials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials" ADD CONSTRAINT "_courses_v_blocks_credentials_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_credentials" ADD CONSTRAINT "_courses_v_blocks_credentials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_contact_block" ADD CONSTRAINT "_courses_v_blocks_contact_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_blocks_contact_block_locales" ADD CONSTRAINT "_courses_v_blocks_contact_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_blocks_contact_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_accreditation_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("version_accreditation_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_locales" ADD CONSTRAINT "_courses_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects" ADD CONSTRAINT "redirects_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_locales_parent_id_idx" ON "pages_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_order_idx" ON "pages_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_rich_text_parent_id_idx" ON "pages_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_rich_text_path_idx" ON "pages_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_rich_text_locales_locale_parent_id_unique" ON "pages_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_rich_text_locales_parent_id_idx" ON "pages_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_items_order_idx" ON "pages_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_grid_items_parent_id_idx" ON "pages_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_feature_grid_items_locales_locale_parent_id_uni" ON "pages_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_items_locales_parent_id_idx" ON "pages_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_order_idx" ON "pages_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_grid_parent_id_idx" ON "pages_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_path_idx" ON "pages_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_feature_grid_locales_locale_parent_id_unique" ON "pages_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_grid_locales_parent_id_idx" ON "pages_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_service_list_order_idx" ON "pages_blocks_service_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_service_list_parent_id_idx" ON "pages_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_service_list_path_idx" ON "pages_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_service_list_locales_locale_parent_id_unique" ON "pages_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_service_list_locales_parent_id_idx" ON "pages_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_list_order_idx" ON "pages_blocks_course_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_course_list_parent_id_idx" ON "pages_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_course_list_path_idx" ON "pages_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_course_list_locales_locale_parent_id_unique" ON "pages_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_course_list_locales_parent_id_idx" ON "pages_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_cta_locales_locale_parent_id_unique" ON "pages_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_cta_locales_parent_id_idx" ON "pages_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_faq_items_locales_parent_id_idx" ON "pages_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_stats_items_locales_locale_parent_id_unique" ON "pages_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_stats_items_locales_parent_id_idx" ON "pages_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_evidence_evidence_verified_by_idx" ON "pages_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "pages_blocks_credentials_items_order_idx" ON "pages_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_credentials_items_parent_id_idx" ON "pages_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_credentials_items_locales_locale_parent_id_uniq" ON "pages_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_credentials_items_locales_parent_id_idx" ON "pages_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_credentials_order_idx" ON "pages_blocks_credentials" USING btree ("_order");
  CREATE INDEX "pages_blocks_credentials_parent_id_idx" ON "pages_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_credentials_path_idx" ON "pages_blocks_credentials" USING btree ("_path");
  CREATE INDEX "pages_blocks_credentials_evidence_evidence_verified_by_idx" ON "pages_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "pages_blocks_contact_block_order_idx" ON "pages_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_block_parent_id_idx" ON "pages_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_block_path_idx" ON "pages_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_contact_block_locales_locale_parent_id_unique" ON "pages_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_contact_block_locales_parent_id_idx" ON "pages_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages_slug_idx" ON "pages_locales" USING btree ("slug","_locale");
  CREATE INDEX "pages__status_idx" ON "pages_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_services_id_idx" ON "pages_rels" USING btree ("services_id");
  CREATE INDEX "pages_rels_courses_id_idx" ON "pages_rels" USING btree ("courses_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "_pages_v_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_locales_parent_id_idx" ON "_pages_v_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_order_idx" ON "_pages_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_rich_text_parent_id_idx" ON "_pages_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_path_idx" ON "_pages_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_pages_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_rich_text_locales_parent_id_idx" ON "_pages_v_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_items_order_idx" ON "_pages_v_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_grid_items_parent_id_idx" ON "_pages_v_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_feature_grid_items_locales_locale_parent_id_" ON "_pages_v_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_items_locales_parent_id_idx" ON "_pages_v_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_order_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_grid_parent_id_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_path_idx" ON "_pages_v_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_feature_grid_locales_locale_parent_id_unique" ON "_pages_v_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_grid_locales_parent_id_idx" ON "_pages_v_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_list_order_idx" ON "_pages_v_blocks_service_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_service_list_parent_id_idx" ON "_pages_v_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_service_list_path_idx" ON "_pages_v_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_service_list_locales_locale_parent_id_unique" ON "_pages_v_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_service_list_locales_parent_id_idx" ON "_pages_v_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_list_order_idx" ON "_pages_v_blocks_course_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_course_list_parent_id_idx" ON "_pages_v_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_course_list_path_idx" ON "_pages_v_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_course_list_locales_locale_parent_id_unique" ON "_pages_v_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_course_list_locales_parent_id_idx" ON "_pages_v_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_cta_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_locales_parent_id_idx" ON "_pages_v_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_items_locales_parent_id_idx" ON "_pages_v_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_items_order_idx" ON "_pages_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_items_parent_id_idx" ON "_pages_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_stats_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_items_locales_parent_id_idx" ON "_pages_v_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_order_idx" ON "_pages_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_stats_parent_id_idx" ON "_pages_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_stats_path_idx" ON "_pages_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_stats_evidence_evidence_verified_by_idx" ON "_pages_v_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_pages_v_blocks_credentials_items_order_idx" ON "_pages_v_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_credentials_items_parent_id_idx" ON "_pages_v_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_credentials_items_locales_locale_parent_id_u" ON "_pages_v_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_credentials_items_locales_parent_id_idx" ON "_pages_v_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_credentials_order_idx" ON "_pages_v_blocks_credentials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_credentials_parent_id_idx" ON "_pages_v_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_credentials_path_idx" ON "_pages_v_blocks_credentials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_credentials_evidence_evidence_verified_b_idx" ON "_pages_v_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_pages_v_blocks_contact_block_order_idx" ON "_pages_v_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_contact_block_parent_id_idx" ON "_pages_v_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_block_path_idx" ON "_pages_v_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_contact_block_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_contact_block_locales_parent_id_idx" ON "_pages_v_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_services_id_idx" ON "_pages_v_rels" USING btree ("services_id");
  CREATE INDEX "_pages_v_rels_courses_id_idx" ON "_pages_v_rels" USING btree ("courses_id");
  CREATE INDEX "services_blocks_hero_order_idx" ON "services_blocks_hero" USING btree ("_order");
  CREATE INDEX "services_blocks_hero_parent_id_idx" ON "services_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_hero_path_idx" ON "services_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_hero_locales_locale_parent_id_unique" ON "services_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_hero_locales_parent_id_idx" ON "services_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_rich_text_order_idx" ON "services_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "services_blocks_rich_text_parent_id_idx" ON "services_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_rich_text_path_idx" ON "services_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_rich_text_locales_locale_parent_id_unique" ON "services_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_rich_text_locales_parent_id_idx" ON "services_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_feature_grid_items_order_idx" ON "services_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "services_blocks_feature_grid_items_parent_id_idx" ON "services_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_feature_grid_items_locales_locale_parent_id_" ON "services_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_feature_grid_items_locales_parent_id_idx" ON "services_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_feature_grid_order_idx" ON "services_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "services_blocks_feature_grid_parent_id_idx" ON "services_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_feature_grid_path_idx" ON "services_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_feature_grid_locales_locale_parent_id_unique" ON "services_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_feature_grid_locales_parent_id_idx" ON "services_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_service_list_order_idx" ON "services_blocks_service_list" USING btree ("_order");
  CREATE INDEX "services_blocks_service_list_parent_id_idx" ON "services_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_service_list_path_idx" ON "services_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_service_list_locales_locale_parent_id_unique" ON "services_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_service_list_locales_parent_id_idx" ON "services_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_course_list_order_idx" ON "services_blocks_course_list" USING btree ("_order");
  CREATE INDEX "services_blocks_course_list_parent_id_idx" ON "services_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_course_list_path_idx" ON "services_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_course_list_locales_locale_parent_id_unique" ON "services_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_course_list_locales_parent_id_idx" ON "services_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_cta_order_idx" ON "services_blocks_cta" USING btree ("_order");
  CREATE INDEX "services_blocks_cta_parent_id_idx" ON "services_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_cta_path_idx" ON "services_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_cta_locales_locale_parent_id_unique" ON "services_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_cta_locales_parent_id_idx" ON "services_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_items_order_idx" ON "services_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_items_parent_id_idx" ON "services_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_faq_items_locales_locale_parent_id_unique" ON "services_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_faq_items_locales_parent_id_idx" ON "services_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_order_idx" ON "services_blocks_faq" USING btree ("_order");
  CREATE INDEX "services_blocks_faq_parent_id_idx" ON "services_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_faq_path_idx" ON "services_blocks_faq" USING btree ("_path");
  CREATE INDEX "services_blocks_stats_items_order_idx" ON "services_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "services_blocks_stats_items_parent_id_idx" ON "services_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_stats_items_locales_locale_parent_id_unique" ON "services_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_stats_items_locales_parent_id_idx" ON "services_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_stats_order_idx" ON "services_blocks_stats" USING btree ("_order");
  CREATE INDEX "services_blocks_stats_parent_id_idx" ON "services_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_stats_path_idx" ON "services_blocks_stats" USING btree ("_path");
  CREATE INDEX "services_blocks_stats_evidence_evidence_verified_by_idx" ON "services_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "services_blocks_credentials_items_order_idx" ON "services_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "services_blocks_credentials_items_parent_id_idx" ON "services_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_blocks_credentials_items_locales_locale_parent_id_u" ON "services_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_credentials_items_locales_parent_id_idx" ON "services_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_credentials_order_idx" ON "services_blocks_credentials" USING btree ("_order");
  CREATE INDEX "services_blocks_credentials_parent_id_idx" ON "services_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_credentials_path_idx" ON "services_blocks_credentials" USING btree ("_path");
  CREATE INDEX "services_blocks_credentials_evidence_evidence_verified_b_idx" ON "services_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "services_blocks_contact_block_order_idx" ON "services_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "services_blocks_contact_block_parent_id_idx" ON "services_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_contact_block_path_idx" ON "services_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "services_blocks_contact_block_locales_locale_parent_id_uniqu" ON "services_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_blocks_contact_block_locales_parent_id_idx" ON "services_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE INDEX "services_slug_idx" ON "services_locales" USING btree ("slug","_locale");
  CREATE INDEX "services__status_idx" ON "services_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_locales_parent_id_idx" ON "services_locales" USING btree ("_parent_id");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_pages_id_idx" ON "services_rels" USING btree ("pages_id");
  CREATE INDEX "services_rels_services_id_idx" ON "services_rels" USING btree ("services_id");
  CREATE INDEX "services_rels_courses_id_idx" ON "services_rels" USING btree ("courses_id");
  CREATE INDEX "_services_v_blocks_hero_order_idx" ON "_services_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_hero_parent_id_idx" ON "_services_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_hero_path_idx" ON "_services_v_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_hero_locales_locale_parent_id_unique" ON "_services_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_hero_locales_parent_id_idx" ON "_services_v_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_rich_text_order_idx" ON "_services_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_rich_text_parent_id_idx" ON "_services_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_rich_text_path_idx" ON "_services_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_services_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_rich_text_locales_parent_id_idx" ON "_services_v_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_feature_grid_items_order_idx" ON "_services_v_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_feature_grid_items_parent_id_idx" ON "_services_v_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_feature_grid_items_locales_locale_parent_" ON "_services_v_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_feature_grid_items_locales_parent_id_idx" ON "_services_v_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_feature_grid_order_idx" ON "_services_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_feature_grid_parent_id_idx" ON "_services_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_feature_grid_path_idx" ON "_services_v_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_feature_grid_locales_locale_parent_id_uni" ON "_services_v_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_feature_grid_locales_parent_id_idx" ON "_services_v_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_service_list_order_idx" ON "_services_v_blocks_service_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_service_list_parent_id_idx" ON "_services_v_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_service_list_path_idx" ON "_services_v_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_service_list_locales_locale_parent_id_uni" ON "_services_v_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_service_list_locales_parent_id_idx" ON "_services_v_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_course_list_order_idx" ON "_services_v_blocks_course_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_course_list_parent_id_idx" ON "_services_v_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_course_list_path_idx" ON "_services_v_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_course_list_locales_locale_parent_id_uniq" ON "_services_v_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_course_list_locales_parent_id_idx" ON "_services_v_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_cta_order_idx" ON "_services_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_cta_parent_id_idx" ON "_services_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_cta_path_idx" ON "_services_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_cta_locales_locale_parent_id_unique" ON "_services_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_cta_locales_parent_id_idx" ON "_services_v_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_items_order_idx" ON "_services_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_items_parent_id_idx" ON "_services_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_services_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_faq_items_locales_parent_id_idx" ON "_services_v_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_order_idx" ON "_services_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_faq_parent_id_idx" ON "_services_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_faq_path_idx" ON "_services_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_stats_items_order_idx" ON "_services_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_stats_items_parent_id_idx" ON "_services_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_stats_items_locales_locale_parent_id_uniq" ON "_services_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_stats_items_locales_parent_id_idx" ON "_services_v_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_stats_order_idx" ON "_services_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_stats_parent_id_idx" ON "_services_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_stats_path_idx" ON "_services_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_stats_evidence_evidence_verified_by_idx" ON "_services_v_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_services_v_blocks_credentials_items_order_idx" ON "_services_v_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_credentials_items_parent_id_idx" ON "_services_v_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_services_v_blocks_credentials_items_locales_locale_parent_i" ON "_services_v_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_credentials_items_locales_parent_id_idx" ON "_services_v_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_credentials_order_idx" ON "_services_v_blocks_credentials" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_credentials_parent_id_idx" ON "_services_v_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_credentials_path_idx" ON "_services_v_blocks_credentials" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_credentials_evidence_evidence_verifie_idx" ON "_services_v_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_services_v_blocks_contact_block_order_idx" ON "_services_v_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_contact_block_parent_id_idx" ON "_services_v_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_contact_block_path_idx" ON "_services_v_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_services_v_blocks_contact_block_locales_locale_parent_id_un" ON "_services_v_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_blocks_contact_block_locales_parent_id_idx" ON "_services_v_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_parent_idx" ON "_services_v" USING btree ("parent_id");
  CREATE INDEX "_services_v_version_version_updated_at_idx" ON "_services_v" USING btree ("version_updated_at");
  CREATE INDEX "_services_v_version_version_created_at_idx" ON "_services_v" USING btree ("version_created_at");
  CREATE INDEX "_services_v_created_at_idx" ON "_services_v" USING btree ("created_at");
  CREATE INDEX "_services_v_updated_at_idx" ON "_services_v" USING btree ("updated_at");
  CREATE INDEX "_services_v_snapshot_idx" ON "_services_v" USING btree ("snapshot");
  CREATE INDEX "_services_v_published_locale_idx" ON "_services_v" USING btree ("published_locale");
  CREATE INDEX "_services_v_latest_idx" ON "_services_v" USING btree ("latest");
  CREATE INDEX "_services_v_version_version_slug_idx" ON "_services_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_services_v_version_version__status_idx" ON "_services_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_services_v_locales_locale_parent_id_unique" ON "_services_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_v_locales_parent_id_idx" ON "_services_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_v_rels_order_idx" ON "_services_v_rels" USING btree ("order");
  CREATE INDEX "_services_v_rels_parent_idx" ON "_services_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_v_rels_path_idx" ON "_services_v_rels" USING btree ("path");
  CREATE INDEX "_services_v_rels_pages_id_idx" ON "_services_v_rels" USING btree ("pages_id");
  CREATE INDEX "_services_v_rels_services_id_idx" ON "_services_v_rels" USING btree ("services_id");
  CREATE INDEX "_services_v_rels_courses_id_idx" ON "_services_v_rels" USING btree ("courses_id");
  CREATE INDEX "courses_blocks_hero_order_idx" ON "courses_blocks_hero" USING btree ("_order");
  CREATE INDEX "courses_blocks_hero_parent_id_idx" ON "courses_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_hero_path_idx" ON "courses_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_hero_locales_locale_parent_id_unique" ON "courses_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_hero_locales_parent_id_idx" ON "courses_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_rich_text_order_idx" ON "courses_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "courses_blocks_rich_text_parent_id_idx" ON "courses_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_rich_text_path_idx" ON "courses_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_rich_text_locales_locale_parent_id_unique" ON "courses_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_rich_text_locales_parent_id_idx" ON "courses_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_feature_grid_items_order_idx" ON "courses_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_feature_grid_items_parent_id_idx" ON "courses_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_feature_grid_items_locales_locale_parent_id_u" ON "courses_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_feature_grid_items_locales_parent_id_idx" ON "courses_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_feature_grid_order_idx" ON "courses_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "courses_blocks_feature_grid_parent_id_idx" ON "courses_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_feature_grid_path_idx" ON "courses_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_feature_grid_locales_locale_parent_id_unique" ON "courses_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_feature_grid_locales_parent_id_idx" ON "courses_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_service_list_order_idx" ON "courses_blocks_service_list" USING btree ("_order");
  CREATE INDEX "courses_blocks_service_list_parent_id_idx" ON "courses_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_service_list_path_idx" ON "courses_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_service_list_locales_locale_parent_id_unique" ON "courses_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_service_list_locales_parent_id_idx" ON "courses_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_course_list_order_idx" ON "courses_blocks_course_list" USING btree ("_order");
  CREATE INDEX "courses_blocks_course_list_parent_id_idx" ON "courses_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_course_list_path_idx" ON "courses_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_course_list_locales_locale_parent_id_unique" ON "courses_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_course_list_locales_parent_id_idx" ON "courses_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_cta_order_idx" ON "courses_blocks_cta" USING btree ("_order");
  CREATE INDEX "courses_blocks_cta_parent_id_idx" ON "courses_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_cta_path_idx" ON "courses_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_cta_locales_locale_parent_id_unique" ON "courses_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_cta_locales_parent_id_idx" ON "courses_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_faq_items_order_idx" ON "courses_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_faq_items_parent_id_idx" ON "courses_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_faq_items_locales_locale_parent_id_unique" ON "courses_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_faq_items_locales_parent_id_idx" ON "courses_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_faq_order_idx" ON "courses_blocks_faq" USING btree ("_order");
  CREATE INDEX "courses_blocks_faq_parent_id_idx" ON "courses_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_faq_path_idx" ON "courses_blocks_faq" USING btree ("_path");
  CREATE INDEX "courses_blocks_stats_items_order_idx" ON "courses_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_stats_items_parent_id_idx" ON "courses_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_stats_items_locales_locale_parent_id_unique" ON "courses_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_stats_items_locales_parent_id_idx" ON "courses_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_stats_order_idx" ON "courses_blocks_stats" USING btree ("_order");
  CREATE INDEX "courses_blocks_stats_parent_id_idx" ON "courses_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_stats_path_idx" ON "courses_blocks_stats" USING btree ("_path");
  CREATE INDEX "courses_blocks_stats_evidence_evidence_verified_by_idx" ON "courses_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "courses_blocks_credentials_items_order_idx" ON "courses_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "courses_blocks_credentials_items_parent_id_idx" ON "courses_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_blocks_credentials_items_locales_locale_parent_id_un" ON "courses_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_credentials_items_locales_parent_id_idx" ON "courses_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_credentials_order_idx" ON "courses_blocks_credentials" USING btree ("_order");
  CREATE INDEX "courses_blocks_credentials_parent_id_idx" ON "courses_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_credentials_path_idx" ON "courses_blocks_credentials" USING btree ("_path");
  CREATE INDEX "courses_blocks_credentials_evidence_evidence_verified_by_idx" ON "courses_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "courses_blocks_contact_block_order_idx" ON "courses_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "courses_blocks_contact_block_parent_id_idx" ON "courses_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "courses_blocks_contact_block_path_idx" ON "courses_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "courses_blocks_contact_block_locales_locale_parent_id_unique" ON "courses_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_blocks_contact_block_locales_parent_id_idx" ON "courses_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_accreditation_evidence_accreditation_evidence_ve_idx" ON "courses" USING btree ("accreditation_evidence_verified_by_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses_slug_idx" ON "courses_locales" USING btree ("slug","_locale");
  CREATE INDEX "courses__status_idx" ON "courses_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_locales_parent_id_idx" ON "courses_locales" USING btree ("_parent_id");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_pages_id_idx" ON "courses_rels" USING btree ("pages_id");
  CREATE INDEX "courses_rels_services_id_idx" ON "courses_rels" USING btree ("services_id");
  CREATE INDEX "courses_rels_courses_id_idx" ON "courses_rels" USING btree ("courses_id");
  CREATE INDEX "_courses_v_blocks_hero_order_idx" ON "_courses_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_hero_parent_id_idx" ON "_courses_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_hero_path_idx" ON "_courses_v_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_hero_locales_locale_parent_id_unique" ON "_courses_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_hero_locales_parent_id_idx" ON "_courses_v_blocks_hero_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_rich_text_order_idx" ON "_courses_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_rich_text_parent_id_idx" ON "_courses_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_rich_text_path_idx" ON "_courses_v_blocks_rich_text" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_rich_text_locales_locale_parent_id_unique" ON "_courses_v_blocks_rich_text_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_rich_text_locales_parent_id_idx" ON "_courses_v_blocks_rich_text_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_feature_grid_items_order_idx" ON "_courses_v_blocks_feature_grid_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_feature_grid_items_parent_id_idx" ON "_courses_v_blocks_feature_grid_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_feature_grid_items_locales_locale_parent_i" ON "_courses_v_blocks_feature_grid_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_feature_grid_items_locales_parent_id_idx" ON "_courses_v_blocks_feature_grid_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_feature_grid_order_idx" ON "_courses_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_feature_grid_parent_id_idx" ON "_courses_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_feature_grid_path_idx" ON "_courses_v_blocks_feature_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_feature_grid_locales_locale_parent_id_uniq" ON "_courses_v_blocks_feature_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_feature_grid_locales_parent_id_idx" ON "_courses_v_blocks_feature_grid_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_service_list_order_idx" ON "_courses_v_blocks_service_list" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_service_list_parent_id_idx" ON "_courses_v_blocks_service_list" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_service_list_path_idx" ON "_courses_v_blocks_service_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_service_list_locales_locale_parent_id_uniq" ON "_courses_v_blocks_service_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_service_list_locales_parent_id_idx" ON "_courses_v_blocks_service_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_course_list_order_idx" ON "_courses_v_blocks_course_list" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_course_list_parent_id_idx" ON "_courses_v_blocks_course_list" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_course_list_path_idx" ON "_courses_v_blocks_course_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_course_list_locales_locale_parent_id_uniqu" ON "_courses_v_blocks_course_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_course_list_locales_parent_id_idx" ON "_courses_v_blocks_course_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_cta_order_idx" ON "_courses_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_cta_parent_id_idx" ON "_courses_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_cta_path_idx" ON "_courses_v_blocks_cta" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_cta_locales_locale_parent_id_unique" ON "_courses_v_blocks_cta_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_cta_locales_parent_id_idx" ON "_courses_v_blocks_cta_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_faq_items_order_idx" ON "_courses_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_faq_items_parent_id_idx" ON "_courses_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_courses_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_faq_items_locales_parent_id_idx" ON "_courses_v_blocks_faq_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_faq_order_idx" ON "_courses_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_faq_parent_id_idx" ON "_courses_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_faq_path_idx" ON "_courses_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_stats_items_order_idx" ON "_courses_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_stats_items_parent_id_idx" ON "_courses_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_stats_items_locales_locale_parent_id_uniqu" ON "_courses_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_stats_items_locales_parent_id_idx" ON "_courses_v_blocks_stats_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_stats_order_idx" ON "_courses_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_stats_parent_id_idx" ON "_courses_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_stats_path_idx" ON "_courses_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_stats_evidence_evidence_verified_by_idx" ON "_courses_v_blocks_stats" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_courses_v_blocks_credentials_items_order_idx" ON "_courses_v_blocks_credentials_items" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_credentials_items_parent_id_idx" ON "_courses_v_blocks_credentials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_blocks_credentials_items_locales_locale_parent_id" ON "_courses_v_blocks_credentials_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_credentials_items_locales_parent_id_idx" ON "_courses_v_blocks_credentials_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_credentials_order_idx" ON "_courses_v_blocks_credentials" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_credentials_parent_id_idx" ON "_courses_v_blocks_credentials" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_credentials_path_idx" ON "_courses_v_blocks_credentials" USING btree ("_path");
  CREATE INDEX "_courses_v_blocks_credentials_evidence_evidence_verified_idx" ON "_courses_v_blocks_credentials" USING btree ("evidence_verified_by_id");
  CREATE INDEX "_courses_v_blocks_contact_block_order_idx" ON "_courses_v_blocks_contact_block" USING btree ("_order");
  CREATE INDEX "_courses_v_blocks_contact_block_parent_id_idx" ON "_courses_v_blocks_contact_block" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_blocks_contact_block_path_idx" ON "_courses_v_blocks_contact_block" USING btree ("_path");
  CREATE UNIQUE INDEX "_courses_v_blocks_contact_block_locales_locale_parent_id_uni" ON "_courses_v_blocks_contact_block_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_blocks_contact_block_locales_parent_id_idx" ON "_courses_v_blocks_contact_block_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_accreditation_evidence_version_accred_idx" ON "_courses_v" USING btree ("version_accreditation_evidence_verified_by_id");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_snapshot_idx" ON "_courses_v" USING btree ("snapshot");
  CREATE INDEX "_courses_v_published_locale_idx" ON "_courses_v" USING btree ("published_locale");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_courses_v_locales_locale_parent_id_unique" ON "_courses_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_locales_parent_id_idx" ON "_courses_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_rels_order_idx" ON "_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_pages_id_idx" ON "_courses_v_rels" USING btree ("pages_id");
  CREATE INDEX "_courses_v_rels_services_id_idx" ON "_courses_v_rels" USING btree ("services_id");
  CREATE INDEX "_courses_v_rels_courses_id_idx" ON "_courses_v_rels" USING btree ("courses_id");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_created_by_idx" ON "redirects" USING btree ("created_by_id");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_hero_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_rich_text_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_feature_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_feature_grid_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_feature_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_service_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_service_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_course_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_course_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_cta_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_stats_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_stats_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_credentials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_credentials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_credentials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_contact_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_blocks_contact_block_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_courses_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_hero_locales" CASCADE;
  DROP TABLE "pages_blocks_rich_text" CASCADE;
  DROP TABLE "pages_blocks_rich_text_locales" CASCADE;
  DROP TABLE "pages_blocks_feature_grid_items" CASCADE;
  DROP TABLE "pages_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "pages_blocks_feature_grid" CASCADE;
  DROP TABLE "pages_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "pages_blocks_service_list" CASCADE;
  DROP TABLE "pages_blocks_service_list_locales" CASCADE;
  DROP TABLE "pages_blocks_course_list" CASCADE;
  DROP TABLE "pages_blocks_course_list_locales" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_cta_locales" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_stats_items" CASCADE;
  DROP TABLE "pages_blocks_stats_items_locales" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_credentials_items" CASCADE;
  DROP TABLE "pages_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "pages_blocks_credentials" CASCADE;
  DROP TABLE "pages_blocks_contact_block" CASCADE;
  DROP TABLE "pages_blocks_contact_block_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_blocks_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text" CASCADE;
  DROP TABLE "_pages_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid_items" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_pages_v_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_service_list" CASCADE;
  DROP TABLE "_pages_v_blocks_service_list_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_course_list" CASCADE;
  DROP TABLE "_pages_v_blocks_course_list_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_faq" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items" CASCADE;
  DROP TABLE "_pages_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_stats" CASCADE;
  DROP TABLE "_pages_v_blocks_credentials_items" CASCADE;
  DROP TABLE "_pages_v_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_credentials" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_block" CASCADE;
  DROP TABLE "_pages_v_blocks_contact_block_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "services_blocks_hero" CASCADE;
  DROP TABLE "services_blocks_hero_locales" CASCADE;
  DROP TABLE "services_blocks_rich_text" CASCADE;
  DROP TABLE "services_blocks_rich_text_locales" CASCADE;
  DROP TABLE "services_blocks_feature_grid_items" CASCADE;
  DROP TABLE "services_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "services_blocks_feature_grid" CASCADE;
  DROP TABLE "services_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "services_blocks_service_list" CASCADE;
  DROP TABLE "services_blocks_service_list_locales" CASCADE;
  DROP TABLE "services_blocks_course_list" CASCADE;
  DROP TABLE "services_blocks_course_list_locales" CASCADE;
  DROP TABLE "services_blocks_cta" CASCADE;
  DROP TABLE "services_blocks_cta_locales" CASCADE;
  DROP TABLE "services_blocks_faq_items" CASCADE;
  DROP TABLE "services_blocks_faq_items_locales" CASCADE;
  DROP TABLE "services_blocks_faq" CASCADE;
  DROP TABLE "services_blocks_stats_items" CASCADE;
  DROP TABLE "services_blocks_stats_items_locales" CASCADE;
  DROP TABLE "services_blocks_stats" CASCADE;
  DROP TABLE "services_blocks_credentials_items" CASCADE;
  DROP TABLE "services_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "services_blocks_credentials" CASCADE;
  DROP TABLE "services_blocks_contact_block" CASCADE;
  DROP TABLE "services_blocks_contact_block_locales" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "_services_v_blocks_hero" CASCADE;
  DROP TABLE "_services_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_services_v_blocks_rich_text" CASCADE;
  DROP TABLE "_services_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_services_v_blocks_feature_grid_items" CASCADE;
  DROP TABLE "_services_v_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_services_v_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "_services_v_blocks_service_list" CASCADE;
  DROP TABLE "_services_v_blocks_service_list_locales" CASCADE;
  DROP TABLE "_services_v_blocks_course_list" CASCADE;
  DROP TABLE "_services_v_blocks_course_list_locales" CASCADE;
  DROP TABLE "_services_v_blocks_cta" CASCADE;
  DROP TABLE "_services_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_services_v_blocks_faq_items" CASCADE;
  DROP TABLE "_services_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_faq" CASCADE;
  DROP TABLE "_services_v_blocks_stats_items" CASCADE;
  DROP TABLE "_services_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_stats" CASCADE;
  DROP TABLE "_services_v_blocks_credentials_items" CASCADE;
  DROP TABLE "_services_v_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "_services_v_blocks_credentials" CASCADE;
  DROP TABLE "_services_v_blocks_contact_block" CASCADE;
  DROP TABLE "_services_v_blocks_contact_block_locales" CASCADE;
  DROP TABLE "_services_v" CASCADE;
  DROP TABLE "_services_v_locales" CASCADE;
  DROP TABLE "_services_v_rels" CASCADE;
  DROP TABLE "courses_blocks_hero" CASCADE;
  DROP TABLE "courses_blocks_hero_locales" CASCADE;
  DROP TABLE "courses_blocks_rich_text" CASCADE;
  DROP TABLE "courses_blocks_rich_text_locales" CASCADE;
  DROP TABLE "courses_blocks_feature_grid_items" CASCADE;
  DROP TABLE "courses_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "courses_blocks_feature_grid" CASCADE;
  DROP TABLE "courses_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "courses_blocks_service_list" CASCADE;
  DROP TABLE "courses_blocks_service_list_locales" CASCADE;
  DROP TABLE "courses_blocks_course_list" CASCADE;
  DROP TABLE "courses_blocks_course_list_locales" CASCADE;
  DROP TABLE "courses_blocks_cta" CASCADE;
  DROP TABLE "courses_blocks_cta_locales" CASCADE;
  DROP TABLE "courses_blocks_faq_items" CASCADE;
  DROP TABLE "courses_blocks_faq_items_locales" CASCADE;
  DROP TABLE "courses_blocks_faq" CASCADE;
  DROP TABLE "courses_blocks_stats_items" CASCADE;
  DROP TABLE "courses_blocks_stats_items_locales" CASCADE;
  DROP TABLE "courses_blocks_stats" CASCADE;
  DROP TABLE "courses_blocks_credentials_items" CASCADE;
  DROP TABLE "courses_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "courses_blocks_credentials" CASCADE;
  DROP TABLE "courses_blocks_contact_block" CASCADE;
  DROP TABLE "courses_blocks_contact_block_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "_courses_v_blocks_hero" CASCADE;
  DROP TABLE "_courses_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_rich_text" CASCADE;
  DROP TABLE "_courses_v_blocks_rich_text_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_feature_grid_items" CASCADE;
  DROP TABLE "_courses_v_blocks_feature_grid_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_courses_v_blocks_feature_grid_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_service_list" CASCADE;
  DROP TABLE "_courses_v_blocks_service_list_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_course_list" CASCADE;
  DROP TABLE "_courses_v_blocks_course_list_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_cta" CASCADE;
  DROP TABLE "_courses_v_blocks_cta_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_faq_items" CASCADE;
  DROP TABLE "_courses_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_faq" CASCADE;
  DROP TABLE "_courses_v_blocks_stats_items" CASCADE;
  DROP TABLE "_courses_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_stats" CASCADE;
  DROP TABLE "_courses_v_blocks_credentials_items" CASCADE;
  DROP TABLE "_courses_v_blocks_credentials_items_locales" CASCADE;
  DROP TABLE "_courses_v_blocks_credentials" CASCADE;
  DROP TABLE "_courses_v_blocks_contact_block" CASCADE;
  DROP TABLE "_courses_v_blocks_contact_block_locales" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "_courses_v_locales" CASCADE;
  DROP TABLE "_courses_v_rels" CASCADE;
  DROP TABLE "redirects" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_pages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_courses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirects_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_pages_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_services_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_courses_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_redirects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "pages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "courses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "redirects_id";
  DROP TYPE "public"."enum_pages_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum_pages_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum_pages_blocks_service_list_mode";
  DROP TYPE "public"."enum_pages_blocks_course_list_mode";
  DROP TYPE "public"."enum_pages_blocks_cta_link_link_type";
  DROP TYPE "public"."enum_pages_blocks_stats_evidence_status";
  DROP TYPE "public"."enum_pages_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum_pages_template";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum__pages_v_blocks_service_list_mode";
  DROP TYPE "public"."enum__pages_v_blocks_course_list_mode";
  DROP TYPE "public"."enum__pages_v_blocks_cta_link_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_stats_evidence_status";
  DROP TYPE "public"."enum__pages_v_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum__pages_v_version_template";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_services_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum_services_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum_services_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum_services_blocks_service_list_mode";
  DROP TYPE "public"."enum_services_blocks_course_list_mode";
  DROP TYPE "public"."enum_services_blocks_cta_link_link_type";
  DROP TYPE "public"."enum_services_blocks_stats_evidence_status";
  DROP TYPE "public"."enum_services_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum_services_status";
  DROP TYPE "public"."enum__services_v_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum__services_v_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum__services_v_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum__services_v_blocks_service_list_mode";
  DROP TYPE "public"."enum__services_v_blocks_course_list_mode";
  DROP TYPE "public"."enum__services_v_blocks_cta_link_link_type";
  DROP TYPE "public"."enum__services_v_blocks_stats_evidence_status";
  DROP TYPE "public"."enum__services_v_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum__services_v_published_locale";
  DROP TYPE "public"."enum__services_v_version_status";
  DROP TYPE "public"."enum_courses_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum_courses_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum_courses_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum_courses_blocks_service_list_mode";
  DROP TYPE "public"."enum_courses_blocks_course_list_mode";
  DROP TYPE "public"."enum_courses_blocks_cta_link_link_type";
  DROP TYPE "public"."enum_courses_blocks_stats_evidence_status";
  DROP TYPE "public"."enum_courses_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum_courses_duration_unit";
  DROP TYPE "public"."enum_courses_delivery_format";
  DROP TYPE "public"."enum_courses_accreditation_evidence_status";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_blocks_hero_primary_cta_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_hero_secondary_cta_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_feature_grid_items_icon";
  DROP TYPE "public"."enum__courses_v_blocks_service_list_mode";
  DROP TYPE "public"."enum__courses_v_blocks_course_list_mode";
  DROP TYPE "public"."enum__courses_v_blocks_cta_link_link_type";
  DROP TYPE "public"."enum__courses_v_blocks_stats_evidence_status";
  DROP TYPE "public"."enum__courses_v_blocks_credentials_evidence_status";
  DROP TYPE "public"."enum__courses_v_version_duration_unit";
  DROP TYPE "public"."enum__courses_v_version_delivery_format";
  DROP TYPE "public"."enum__courses_v_version_accreditation_evidence_status";
  DROP TYPE "public"."enum__courses_v_published_locale";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum_redirects_type";
  DROP TYPE "public"."enum_redirects_source";`)
}
