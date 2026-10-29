import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_social_links_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_site_settings_legal_links_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_site_settings_company_name_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_site_settings_address_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum_site_settings_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__site_settings_v_version_social_links_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__site_settings_v_version_legal_links_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__site_settings_v_version_company_name_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__site_settings_v_version_address_evidence_status" AS ENUM('unverified', 'verified');
  CREATE TYPE "public"."enum__site_settings_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__site_settings_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_header_nav_items_children_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_header_nav_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_header_nav_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__header_nav_v_version_items_children_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__header_nav_v_version_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__header_nav_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__header_nav_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_footer_nav_items_children_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_footer_nav_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_footer_nav_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footer_nav_v_version_items_children_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__footer_nav_v_version_items_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__footer_nav_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__footer_nav_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_banner_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum_banner_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__banner_v_version_link_link_type" AS ENUM('internal', 'external', 'email', 'tel');
  CREATE TYPE "public"."enum__banner_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum__banner_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_site_settings_social_links_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "site_settings_social_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_site_settings_legal_links_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "site_settings_legal_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiry_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE "site_settings_enquiry_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiry_topics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_name_evidence_status" "enum_site_settings_company_name_evidence_status" DEFAULT 'unverified',
  	"company_name_evidence_reference" varchar,
  	"company_name_evidence_verified_by_id" integer,
  	"company_name_evidence_verified_at" timestamp(3) with time zone,
  	"address_evidence_status" "enum_site_settings_address_evidence_status" DEFAULT 'unverified',
  	"address_evidence_reference" varchar,
  	"address_evidence_verified_by_id" integer,
  	"address_evidence_verified_at" timestamp(3) with time zone,
  	"phone" varchar,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"company_name" varchar,
  	"address" varchar,
  	"hours" varchar,
  	"default_seo_title" varchar,
  	"default_seo_description" varchar,
  	"_status" "enum_site_settings_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_site_settings_v_version_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__site_settings_v_version_social_links_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_social_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__site_settings_v_version_legal_links_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_legal_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_version_enquiry_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_enquiry_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_enquiry_topics_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_company_name_evidence_status" "enum__site_settings_v_version_company_name_evidence_status" DEFAULT 'unverified',
  	"version_company_name_evidence_reference" varchar,
  	"version_company_name_evidence_verified_by_id" integer,
  	"version_company_name_evidence_verified_at" timestamp(3) with time zone,
  	"version_address_evidence_status" "enum__site_settings_v_version_address_evidence_status" DEFAULT 'unverified',
  	"version_address_evidence_reference" varchar,
  	"version_address_evidence_verified_by_id" integer,
  	"version_address_evidence_verified_at" timestamp(3) with time zone,
  	"version_phone" varchar,
  	"version_email" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__site_settings_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_site_settings_v_locales" (
  	"version_company_name" varchar,
  	"version_address" varchar,
  	"version_hours" varchar,
  	"version_default_seo_title" varchar,
  	"version_default_seo_description" varchar,
  	"version__status" "enum__site_settings_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_site_settings_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "header_nav_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_header_nav_items_children_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false
  );
  
  CREATE TABLE "header_nav_items_children_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_header_nav_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false
  );
  
  CREATE TABLE "header_nav_items_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header_nav" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "header_nav_locales" (
  	"_status" "enum_header_nav_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "header_nav_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_header_nav_v_version_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__header_nav_v_version_items_children_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_header_nav_v_version_items_children_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_header_nav_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__header_nav_v_version_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_header_nav_v_version_items_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_header_nav_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__header_nav_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_header_nav_v_locales" (
  	"version__status" "enum__header_nav_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_header_nav_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "footer_nav_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_footer_nav_items_children_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false
  );
  
  CREATE TABLE "footer_nav_items_children_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_link_type" "enum_footer_nav_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false
  );
  
  CREATE TABLE "footer_nav_items_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_nav" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_nav_locales" (
  	"_status" "enum_footer_nav_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_nav_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_footer_nav_v_version_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__footer_nav_v_version_items_children_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_items_children_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_footer_nav_v_version_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_link_type" "enum__footer_nav_v_version_items_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"target_unpublished" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_footer_nav_v_version_items_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_footer_nav_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__footer_nav_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_footer_nav_v_locales" (
  	"version__status" "enum__footer_nav_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_footer_nav_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "banner" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"link_link_type" "enum_banner_link_link_type" DEFAULT 'internal',
  	"link_url" varchar,
  	"link_email" varchar,
  	"link_tel" varchar,
  	"link_new_tab" boolean,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "banner_locales" (
  	"message" varchar,
  	"link_label" varchar,
  	"dismiss_key" varchar,
  	"_status" "enum_banner_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "banner_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_banner_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_enabled" boolean DEFAULT false,
  	"version_link_link_type" "enum__banner_v_version_link_link_type" DEFAULT 'internal',
  	"version_link_url" varchar,
  	"version_link_email" varchar,
  	"version_link_tel" varchar,
  	"version_link_new_tab" boolean,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__banner_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_banner_v_locales" (
  	"version_message" varchar,
  	"version_link_label" varchar,
  	"version_dismiss_key" varchar,
  	"version__status" "enum__banner_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_banner_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"services_id" integer,
  	"courses_id" integer
  );
  
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links_locales" ADD CONSTRAINT "site_settings_social_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_social_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_legal_links" ADD CONSTRAINT "site_settings_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_legal_links_locales" ADD CONSTRAINT "site_settings_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_recipients" ADD CONSTRAINT "site_settings_enquiry_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_topics" ADD CONSTRAINT "site_settings_enquiry_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_topics_locales" ADD CONSTRAINT "site_settings_enquiry_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_enquiry_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_company_name_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("company_name_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_address_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("address_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_rels" ADD CONSTRAINT "site_settings_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_social_links" ADD CONSTRAINT "_site_settings_v_version_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_social_links_locales" ADD CONSTRAINT "_site_settings_v_version_social_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_social_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_legal_links" ADD CONSTRAINT "_site_settings_v_version_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_legal_links_locales" ADD CONSTRAINT "_site_settings_v_version_legal_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_legal_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_enquiry_recipients" ADD CONSTRAINT "_site_settings_v_version_enquiry_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_enquiry_topics" ADD CONSTRAINT "_site_settings_v_version_enquiry_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_enquiry_topics_locales" ADD CONSTRAINT "_site_settings_v_version_enquiry_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v_version_enquiry_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_company_name_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("version_company_name_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v" ADD CONSTRAINT "_site_settings_v_version_address_evidence_verified_by_id_users_id_fk" FOREIGN KEY ("version_address_evidence_verified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_site_settings_v_locales" ADD CONSTRAINT "_site_settings_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_rels" ADD CONSTRAINT "_site_settings_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_children" ADD CONSTRAINT "header_nav_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_children_locales" ADD CONSTRAINT "header_nav_items_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items_locales" ADD CONSTRAINT "header_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_locales" ADD CONSTRAINT "header_nav_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_rels" ADD CONSTRAINT "header_nav_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."header_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_rels" ADD CONSTRAINT "header_nav_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_rels" ADD CONSTRAINT "header_nav_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_rels" ADD CONSTRAINT "header_nav_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_version_items_children" ADD CONSTRAINT "_header_nav_v_version_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_nav_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_version_items_children_locales" ADD CONSTRAINT "_header_nav_v_version_items_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_nav_v_version_items_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_version_items" ADD CONSTRAINT "_header_nav_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_version_items_locales" ADD CONSTRAINT "_header_nav_v_version_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_nav_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_locales" ADD CONSTRAINT "_header_nav_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_rels" ADD CONSTRAINT "_header_nav_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_header_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_rels" ADD CONSTRAINT "_header_nav_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_rels" ADD CONSTRAINT "_header_nav_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_nav_v_rels" ADD CONSTRAINT "_header_nav_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items_children" ADD CONSTRAINT "footer_nav_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items_children_locales" ADD CONSTRAINT "footer_nav_items_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav_items_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items_locales" ADD CONSTRAINT "footer_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_locales" ADD CONSTRAINT "footer_nav_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_rels" ADD CONSTRAINT "footer_nav_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footer_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_rels" ADD CONSTRAINT "footer_nav_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_rels" ADD CONSTRAINT "footer_nav_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_rels" ADD CONSTRAINT "footer_nav_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_items_children" ADD CONSTRAINT "_footer_nav_v_version_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_items_children_locales" ADD CONSTRAINT "_footer_nav_v_version_items_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v_version_items_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_items" ADD CONSTRAINT "_footer_nav_v_version_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_version_items_locales" ADD CONSTRAINT "_footer_nav_v_version_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v_version_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_locales" ADD CONSTRAINT "_footer_nav_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_rels" ADD CONSTRAINT "_footer_nav_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_footer_nav_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_rels" ADD CONSTRAINT "_footer_nav_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_rels" ADD CONSTRAINT "_footer_nav_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_nav_v_rels" ADD CONSTRAINT "_footer_nav_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_locales" ADD CONSTRAINT "banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_rels" ADD CONSTRAINT "banner_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_rels" ADD CONSTRAINT "banner_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_rels" ADD CONSTRAINT "banner_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banner_rels" ADD CONSTRAINT "banner_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banner_v_locales" ADD CONSTRAINT "_banner_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_banner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banner_v_rels" ADD CONSTRAINT "_banner_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_banner_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banner_v_rels" ADD CONSTRAINT "_banner_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banner_v_rels" ADD CONSTRAINT "_banner_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banner_v_rels" ADD CONSTRAINT "_banner_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_social_links_locales_locale_parent_id_unique" ON "site_settings_social_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_social_links_locales_parent_id_idx" ON "site_settings_social_links_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_legal_links_order_idx" ON "site_settings_legal_links" USING btree ("_order");
  CREATE INDEX "site_settings_legal_links_parent_id_idx" ON "site_settings_legal_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_legal_links_locales_locale_parent_id_unique" ON "site_settings_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_legal_links_locales_parent_id_idx" ON "site_settings_legal_links_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_recipients_order_idx" ON "site_settings_enquiry_recipients" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_recipients_parent_id_idx" ON "site_settings_enquiry_recipients" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_topics_order_idx" ON "site_settings_enquiry_topics" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_topics_parent_id_idx" ON "site_settings_enquiry_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_enquiry_topics_locales_locale_parent_id_unique" ON "site_settings_enquiry_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_enquiry_topics_locales_parent_id_idx" ON "site_settings_enquiry_topics_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_company_name_evidence_company_name_evidenc_idx" ON "site_settings" USING btree ("company_name_evidence_verified_by_id");
  CREATE INDEX "site_settings_address_evidence_address_evidence_verified_idx" ON "site_settings" USING btree ("address_evidence_verified_by_id");
  CREATE INDEX "site_settings__status_idx" ON "site_settings_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_pages_id_idx" ON "site_settings_rels" USING btree ("pages_id");
  CREATE INDEX "site_settings_rels_services_id_idx" ON "site_settings_rels" USING btree ("services_id");
  CREATE INDEX "site_settings_rels_courses_id_idx" ON "site_settings_rels" USING btree ("courses_id");
  CREATE INDEX "_site_settings_v_version_social_links_order_idx" ON "_site_settings_v_version_social_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_social_links_parent_id_idx" ON "_site_settings_v_version_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_social_links_locales_locale_parent_" ON "_site_settings_v_version_social_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_social_links_locales_parent_id_idx" ON "_site_settings_v_version_social_links_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_legal_links_order_idx" ON "_site_settings_v_version_legal_links" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_legal_links_parent_id_idx" ON "_site_settings_v_version_legal_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_legal_links_locales_locale_parent_i" ON "_site_settings_v_version_legal_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_legal_links_locales_parent_id_idx" ON "_site_settings_v_version_legal_links_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_enquiry_recipients_order_idx" ON "_site_settings_v_version_enquiry_recipients" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_enquiry_recipients_parent_id_idx" ON "_site_settings_v_version_enquiry_recipients" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_enquiry_topics_order_idx" ON "_site_settings_v_version_enquiry_topics" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_enquiry_topics_parent_id_idx" ON "_site_settings_v_version_enquiry_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_site_settings_v_version_enquiry_topics_locales_locale_paren" ON "_site_settings_v_version_enquiry_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_version_enquiry_topics_locales_parent_i_idx" ON "_site_settings_v_version_enquiry_topics_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_company_name_evidence_version_c_idx" ON "_site_settings_v" USING btree ("version_company_name_evidence_verified_by_id");
  CREATE INDEX "_site_settings_v_version_address_evidence_version_addres_idx" ON "_site_settings_v" USING btree ("version_address_evidence_verified_by_id");
  CREATE INDEX "_site_settings_v_created_at_idx" ON "_site_settings_v" USING btree ("created_at");
  CREATE INDEX "_site_settings_v_updated_at_idx" ON "_site_settings_v" USING btree ("updated_at");
  CREATE INDEX "_site_settings_v_snapshot_idx" ON "_site_settings_v" USING btree ("snapshot");
  CREATE INDEX "_site_settings_v_published_locale_idx" ON "_site_settings_v" USING btree ("published_locale");
  CREATE INDEX "_site_settings_v_latest_idx" ON "_site_settings_v" USING btree ("latest");
  CREATE INDEX "_site_settings_v_version_version__status_idx" ON "_site_settings_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_site_settings_v_locales_locale_parent_id_unique" ON "_site_settings_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_site_settings_v_locales_parent_id_idx" ON "_site_settings_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_rels_order_idx" ON "_site_settings_v_rels" USING btree ("order");
  CREATE INDEX "_site_settings_v_rels_parent_idx" ON "_site_settings_v_rels" USING btree ("parent_id");
  CREATE INDEX "_site_settings_v_rels_path_idx" ON "_site_settings_v_rels" USING btree ("path");
  CREATE INDEX "_site_settings_v_rels_pages_id_idx" ON "_site_settings_v_rels" USING btree ("pages_id");
  CREATE INDEX "_site_settings_v_rels_services_id_idx" ON "_site_settings_v_rels" USING btree ("services_id");
  CREATE INDEX "_site_settings_v_rels_courses_id_idx" ON "_site_settings_v_rels" USING btree ("courses_id");
  CREATE INDEX "header_nav_items_children_order_idx" ON "header_nav_items_children" USING btree ("_order");
  CREATE INDEX "header_nav_items_children_parent_id_idx" ON "header_nav_items_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "header_nav_items_children_locales_locale_parent_id_unique" ON "header_nav_items_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_nav_items_children_locales_parent_id_idx" ON "header_nav_items_children_locales" USING btree ("_parent_id");
  CREATE INDEX "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "header_nav_items_locales_locale_parent_id_unique" ON "header_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_nav_items_locales_parent_id_idx" ON "header_nav_items_locales" USING btree ("_parent_id");
  CREATE INDEX "header_nav__status_idx" ON "header_nav_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "header_nav_locales_locale_parent_id_unique" ON "header_nav_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_nav_locales_parent_id_idx" ON "header_nav_locales" USING btree ("_parent_id");
  CREATE INDEX "header_nav_rels_order_idx" ON "header_nav_rels" USING btree ("order");
  CREATE INDEX "header_nav_rels_parent_idx" ON "header_nav_rels" USING btree ("parent_id");
  CREATE INDEX "header_nav_rels_path_idx" ON "header_nav_rels" USING btree ("path");
  CREATE INDEX "header_nav_rels_pages_id_idx" ON "header_nav_rels" USING btree ("pages_id");
  CREATE INDEX "header_nav_rels_services_id_idx" ON "header_nav_rels" USING btree ("services_id");
  CREATE INDEX "header_nav_rels_courses_id_idx" ON "header_nav_rels" USING btree ("courses_id");
  CREATE INDEX "_header_nav_v_version_items_children_order_idx" ON "_header_nav_v_version_items_children" USING btree ("_order");
  CREATE INDEX "_header_nav_v_version_items_children_parent_id_idx" ON "_header_nav_v_version_items_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_header_nav_v_version_items_children_locales_locale_parent_i" ON "_header_nav_v_version_items_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_header_nav_v_version_items_children_locales_parent_id_idx" ON "_header_nav_v_version_items_children_locales" USING btree ("_parent_id");
  CREATE INDEX "_header_nav_v_version_items_order_idx" ON "_header_nav_v_version_items" USING btree ("_order");
  CREATE INDEX "_header_nav_v_version_items_parent_id_idx" ON "_header_nav_v_version_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_header_nav_v_version_items_locales_locale_parent_id_unique" ON "_header_nav_v_version_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_header_nav_v_version_items_locales_parent_id_idx" ON "_header_nav_v_version_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_header_nav_v_created_at_idx" ON "_header_nav_v" USING btree ("created_at");
  CREATE INDEX "_header_nav_v_updated_at_idx" ON "_header_nav_v" USING btree ("updated_at");
  CREATE INDEX "_header_nav_v_snapshot_idx" ON "_header_nav_v" USING btree ("snapshot");
  CREATE INDEX "_header_nav_v_published_locale_idx" ON "_header_nav_v" USING btree ("published_locale");
  CREATE INDEX "_header_nav_v_latest_idx" ON "_header_nav_v" USING btree ("latest");
  CREATE INDEX "_header_nav_v_version_version__status_idx" ON "_header_nav_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_header_nav_v_locales_locale_parent_id_unique" ON "_header_nav_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_header_nav_v_locales_parent_id_idx" ON "_header_nav_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_header_nav_v_rels_order_idx" ON "_header_nav_v_rels" USING btree ("order");
  CREATE INDEX "_header_nav_v_rels_parent_idx" ON "_header_nav_v_rels" USING btree ("parent_id");
  CREATE INDEX "_header_nav_v_rels_path_idx" ON "_header_nav_v_rels" USING btree ("path");
  CREATE INDEX "_header_nav_v_rels_pages_id_idx" ON "_header_nav_v_rels" USING btree ("pages_id");
  CREATE INDEX "_header_nav_v_rels_services_id_idx" ON "_header_nav_v_rels" USING btree ("services_id");
  CREATE INDEX "_header_nav_v_rels_courses_id_idx" ON "_header_nav_v_rels" USING btree ("courses_id");
  CREATE INDEX "footer_nav_items_children_order_idx" ON "footer_nav_items_children" USING btree ("_order");
  CREATE INDEX "footer_nav_items_children_parent_id_idx" ON "footer_nav_items_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_nav_items_children_locales_locale_parent_id_unique" ON "footer_nav_items_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_nav_items_children_locales_parent_id_idx" ON "footer_nav_items_children_locales" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
  CREATE INDEX "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_nav_items_locales_locale_parent_id_unique" ON "footer_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_nav_items_locales_parent_id_idx" ON "footer_nav_items_locales" USING btree ("_parent_id");
  CREATE INDEX "footer_nav__status_idx" ON "footer_nav_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "footer_nav_locales_locale_parent_id_unique" ON "footer_nav_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_nav_locales_parent_id_idx" ON "footer_nav_locales" USING btree ("_parent_id");
  CREATE INDEX "footer_nav_rels_order_idx" ON "footer_nav_rels" USING btree ("order");
  CREATE INDEX "footer_nav_rels_parent_idx" ON "footer_nav_rels" USING btree ("parent_id");
  CREATE INDEX "footer_nav_rels_path_idx" ON "footer_nav_rels" USING btree ("path");
  CREATE INDEX "footer_nav_rels_pages_id_idx" ON "footer_nav_rels" USING btree ("pages_id");
  CREATE INDEX "footer_nav_rels_services_id_idx" ON "footer_nav_rels" USING btree ("services_id");
  CREATE INDEX "footer_nav_rels_courses_id_idx" ON "footer_nav_rels" USING btree ("courses_id");
  CREATE INDEX "_footer_nav_v_version_items_children_order_idx" ON "_footer_nav_v_version_items_children" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_items_children_parent_id_idx" ON "_footer_nav_v_version_items_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footer_nav_v_version_items_children_locales_locale_parent_i" ON "_footer_nav_v_version_items_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_nav_v_version_items_children_locales_parent_id_idx" ON "_footer_nav_v_version_items_children_locales" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_version_items_order_idx" ON "_footer_nav_v_version_items" USING btree ("_order");
  CREATE INDEX "_footer_nav_v_version_items_parent_id_idx" ON "_footer_nav_v_version_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footer_nav_v_version_items_locales_locale_parent_id_unique" ON "_footer_nav_v_version_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_nav_v_version_items_locales_parent_id_idx" ON "_footer_nav_v_version_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_created_at_idx" ON "_footer_nav_v" USING btree ("created_at");
  CREATE INDEX "_footer_nav_v_updated_at_idx" ON "_footer_nav_v" USING btree ("updated_at");
  CREATE INDEX "_footer_nav_v_snapshot_idx" ON "_footer_nav_v" USING btree ("snapshot");
  CREATE INDEX "_footer_nav_v_published_locale_idx" ON "_footer_nav_v" USING btree ("published_locale");
  CREATE INDEX "_footer_nav_v_latest_idx" ON "_footer_nav_v" USING btree ("latest");
  CREATE INDEX "_footer_nav_v_version_version__status_idx" ON "_footer_nav_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_footer_nav_v_locales_locale_parent_id_unique" ON "_footer_nav_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footer_nav_v_locales_parent_id_idx" ON "_footer_nav_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_footer_nav_v_rels_order_idx" ON "_footer_nav_v_rels" USING btree ("order");
  CREATE INDEX "_footer_nav_v_rels_parent_idx" ON "_footer_nav_v_rels" USING btree ("parent_id");
  CREATE INDEX "_footer_nav_v_rels_path_idx" ON "_footer_nav_v_rels" USING btree ("path");
  CREATE INDEX "_footer_nav_v_rels_pages_id_idx" ON "_footer_nav_v_rels" USING btree ("pages_id");
  CREATE INDEX "_footer_nav_v_rels_services_id_idx" ON "_footer_nav_v_rels" USING btree ("services_id");
  CREATE INDEX "_footer_nav_v_rels_courses_id_idx" ON "_footer_nav_v_rels" USING btree ("courses_id");
  CREATE INDEX "banner__status_idx" ON "banner_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "banner_locales_locale_parent_id_unique" ON "banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "banner_locales_parent_id_idx" ON "banner_locales" USING btree ("_parent_id");
  CREATE INDEX "banner_rels_order_idx" ON "banner_rels" USING btree ("order");
  CREATE INDEX "banner_rels_parent_idx" ON "banner_rels" USING btree ("parent_id");
  CREATE INDEX "banner_rels_path_idx" ON "banner_rels" USING btree ("path");
  CREATE INDEX "banner_rels_pages_id_idx" ON "banner_rels" USING btree ("pages_id");
  CREATE INDEX "banner_rels_services_id_idx" ON "banner_rels" USING btree ("services_id");
  CREATE INDEX "banner_rels_courses_id_idx" ON "banner_rels" USING btree ("courses_id");
  CREATE INDEX "_banner_v_created_at_idx" ON "_banner_v" USING btree ("created_at");
  CREATE INDEX "_banner_v_updated_at_idx" ON "_banner_v" USING btree ("updated_at");
  CREATE INDEX "_banner_v_snapshot_idx" ON "_banner_v" USING btree ("snapshot");
  CREATE INDEX "_banner_v_published_locale_idx" ON "_banner_v" USING btree ("published_locale");
  CREATE INDEX "_banner_v_latest_idx" ON "_banner_v" USING btree ("latest");
  CREATE INDEX "_banner_v_version_version__status_idx" ON "_banner_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_banner_v_locales_locale_parent_id_unique" ON "_banner_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_banner_v_locales_parent_id_idx" ON "_banner_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_banner_v_rels_order_idx" ON "_banner_v_rels" USING btree ("order");
  CREATE INDEX "_banner_v_rels_parent_idx" ON "_banner_v_rels" USING btree ("parent_id");
  CREATE INDEX "_banner_v_rels_path_idx" ON "_banner_v_rels" USING btree ("path");
  CREATE INDEX "_banner_v_rels_pages_id_idx" ON "_banner_v_rels" USING btree ("pages_id");
  CREATE INDEX "_banner_v_rels_services_id_idx" ON "_banner_v_rels" USING btree ("services_id");
  CREATE INDEX "_banner_v_rels_courses_id_idx" ON "_banner_v_rels" USING btree ("courses_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings_social_links_locales" CASCADE;
  DROP TABLE "site_settings_legal_links" CASCADE;
  DROP TABLE "site_settings_legal_links_locales" CASCADE;
  DROP TABLE "site_settings_enquiry_recipients" CASCADE;
  DROP TABLE "site_settings_enquiry_topics" CASCADE;
  DROP TABLE "site_settings_enquiry_topics_locales" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "site_settings_rels" CASCADE;
  DROP TABLE "_site_settings_v_version_social_links" CASCADE;
  DROP TABLE "_site_settings_v_version_social_links_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_legal_links" CASCADE;
  DROP TABLE "_site_settings_v_version_legal_links_locales" CASCADE;
  DROP TABLE "_site_settings_v_version_enquiry_recipients" CASCADE;
  DROP TABLE "_site_settings_v_version_enquiry_topics" CASCADE;
  DROP TABLE "_site_settings_v_version_enquiry_topics_locales" CASCADE;
  DROP TABLE "_site_settings_v" CASCADE;
  DROP TABLE "_site_settings_v_locales" CASCADE;
  DROP TABLE "_site_settings_v_rels" CASCADE;
  DROP TABLE "header_nav_items_children" CASCADE;
  DROP TABLE "header_nav_items_children_locales" CASCADE;
  DROP TABLE "header_nav_items" CASCADE;
  DROP TABLE "header_nav_items_locales" CASCADE;
  DROP TABLE "header_nav" CASCADE;
  DROP TABLE "header_nav_locales" CASCADE;
  DROP TABLE "header_nav_rels" CASCADE;
  DROP TABLE "_header_nav_v_version_items_children" CASCADE;
  DROP TABLE "_header_nav_v_version_items_children_locales" CASCADE;
  DROP TABLE "_header_nav_v_version_items" CASCADE;
  DROP TABLE "_header_nav_v_version_items_locales" CASCADE;
  DROP TABLE "_header_nav_v" CASCADE;
  DROP TABLE "_header_nav_v_locales" CASCADE;
  DROP TABLE "_header_nav_v_rels" CASCADE;
  DROP TABLE "footer_nav_items_children" CASCADE;
  DROP TABLE "footer_nav_items_children_locales" CASCADE;
  DROP TABLE "footer_nav_items" CASCADE;
  DROP TABLE "footer_nav_items_locales" CASCADE;
  DROP TABLE "footer_nav" CASCADE;
  DROP TABLE "footer_nav_locales" CASCADE;
  DROP TABLE "footer_nav_rels" CASCADE;
  DROP TABLE "_footer_nav_v_version_items_children" CASCADE;
  DROP TABLE "_footer_nav_v_version_items_children_locales" CASCADE;
  DROP TABLE "_footer_nav_v_version_items" CASCADE;
  DROP TABLE "_footer_nav_v_version_items_locales" CASCADE;
  DROP TABLE "_footer_nav_v" CASCADE;
  DROP TABLE "_footer_nav_v_locales" CASCADE;
  DROP TABLE "_footer_nav_v_rels" CASCADE;
  DROP TABLE "banner" CASCADE;
  DROP TABLE "banner_locales" CASCADE;
  DROP TABLE "banner_rels" CASCADE;
  DROP TABLE "_banner_v" CASCADE;
  DROP TABLE "_banner_v_locales" CASCADE;
  DROP TABLE "_banner_v_rels" CASCADE;
  DROP TYPE "public"."enum_site_settings_social_links_link_link_type";
  DROP TYPE "public"."enum_site_settings_legal_links_link_link_type";
  DROP TYPE "public"."enum_site_settings_company_name_evidence_status";
  DROP TYPE "public"."enum_site_settings_address_evidence_status";
  DROP TYPE "public"."enum_site_settings_status";
  DROP TYPE "public"."enum__site_settings_v_version_social_links_link_link_type";
  DROP TYPE "public"."enum__site_settings_v_version_legal_links_link_link_type";
  DROP TYPE "public"."enum__site_settings_v_version_company_name_evidence_status";
  DROP TYPE "public"."enum__site_settings_v_version_address_evidence_status";
  DROP TYPE "public"."enum__site_settings_v_published_locale";
  DROP TYPE "public"."enum__site_settings_v_version_status";
  DROP TYPE "public"."enum_header_nav_items_children_link_link_type";
  DROP TYPE "public"."enum_header_nav_items_link_link_type";
  DROP TYPE "public"."enum_header_nav_status";
  DROP TYPE "public"."enum__header_nav_v_version_items_children_link_link_type";
  DROP TYPE "public"."enum__header_nav_v_version_items_link_link_type";
  DROP TYPE "public"."enum__header_nav_v_published_locale";
  DROP TYPE "public"."enum__header_nav_v_version_status";
  DROP TYPE "public"."enum_footer_nav_items_children_link_link_type";
  DROP TYPE "public"."enum_footer_nav_items_link_link_type";
  DROP TYPE "public"."enum_footer_nav_status";
  DROP TYPE "public"."enum__footer_nav_v_version_items_children_link_link_type";
  DROP TYPE "public"."enum__footer_nav_v_version_items_link_link_type";
  DROP TYPE "public"."enum__footer_nav_v_published_locale";
  DROP TYPE "public"."enum__footer_nav_v_version_status";
  DROP TYPE "public"."enum_banner_link_link_type";
  DROP TYPE "public"."enum_banner_status";
  DROP TYPE "public"."enum__banner_v_version_link_link_type";
  DROP TYPE "public"."enum__banner_v_published_locale";
  DROP TYPE "public"."enum__banner_v_version_status";`)
}
