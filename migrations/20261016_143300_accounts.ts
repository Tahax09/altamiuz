import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('editor', 'publisher', 'administrator', 'owner');
  CREATE TYPE "public"."enum_users_status" AS ENUM('invited', 'active', 'suspended');
  CREATE TYPE "public"."enum_invitations_role" AS ENUM('editor', 'publisher', 'administrator', 'owner');
  ALTER TYPE "public"."enum_audit_events_action" ADD VALUE 'auth.password_change' BEFORE 'mfa.enrol';
  ALTER TYPE "public"."enum_audit_events_action" ADD VALUE 'mfa.recovery_codes_regenerate' BEFORE 'session.revoke';
  CREATE TABLE "invitations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"role" "enum_invitations_role" NOT NULL,
  	"token_hash" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"used_at" timestamp(3) with time zone,
  	"invited_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "security_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"idle_minutes" numeric DEFAULT 30 NOT NULL,
  	"absolute_hours" numeric DEFAULT 12 NOT NULL,
  	"lockout_threshold" numeric DEFAULT 5 NOT NULL,
  	"lockout_minutes" numeric DEFAULT 15 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;
  ALTER TABLE "users" ADD COLUMN "status" "enum_users_status" DEFAULT 'invited' NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "invitations_id" integer;
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "invitations_token_hash_idx" ON "invitations" USING btree ("token_hash");
  CREATE INDEX "invitations_invited_by_idx" ON "invitations" USING btree ("invited_by_id");
  CREATE INDEX "invitations_updated_at_idx" ON "invitations" USING btree ("updated_at");
  CREATE INDEX "invitations_created_at_idx" ON "invitations" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_invitations_fk" FOREIGN KEY ("invitations_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_invitations_id_idx" ON "payload_locked_documents_rels" USING btree ("invitations_id");
  ALTER TABLE "users" DROP COLUMN "login_attempts";
  ALTER TABLE "users" DROP COLUMN "lock_until";`)
}

// Down (hand-corrected from the Drizzle output: the CASCADE above already drops the FK/index, so
// those drops are IF EXISTS). Limitation (constitution X): Postgres cannot remove enum values;
// the audit enum is rebuilt, which fails if any audit row already uses an action added here.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "security_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "invitations" CASCADE;
  DROP TABLE "security_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_invitations_fk";
  
  ALTER TABLE "audit_events" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_action";
  CREATE TYPE "public"."enum_audit_events_action" AS ENUM('auth.login.success', 'auth.login.failure', 'auth.logout', 'auth.lockout', 'auth.recovery.request', 'auth.recovery.complete', 'mfa.enrol', 'mfa.reset', 'mfa.remove', 'mfa.recovery_code_used', 'session.revoke', 'user.invite', 'user.create', 'user.suspend', 'user.delete', 'user.role_change', 'content.publish', 'content.unpublish', 'content.restore', 'content.delete', 'media.delete', 'redirect.change', 'navigation.change', 'settings.change', 'enquiry.view', 'enquiry.export', 'enquiry.delete', 'enquiry.retention_delete', 'access.denied', 'audit.retention_purge');
  ALTER TABLE "audit_events" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_events_action" USING "action"::"public"."enum_audit_events_action";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_invitations_id_idx";
  ALTER TABLE "users" ADD COLUMN "login_attempts" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "lock_until" timestamp(3) with time zone;
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "users" DROP COLUMN "status";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "invitations_id";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_invitations_role";`)
}
