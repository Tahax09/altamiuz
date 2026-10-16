import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audit_events_action" AS ENUM('auth.login.success', 'auth.login.failure', 'auth.logout', 'auth.lockout', 'auth.recovery.request', 'auth.recovery.complete', 'mfa.enrol', 'mfa.reset', 'mfa.remove', 'mfa.recovery_code_used', 'session.revoke', 'user.invite', 'user.create', 'user.suspend', 'user.delete', 'user.role_change', 'content.publish', 'content.unpublish', 'content.restore', 'content.delete', 'media.delete', 'redirect.change', 'navigation.change', 'settings.change', 'enquiry.view', 'enquiry.export', 'enquiry.delete', 'enquiry.retention_delete', 'access.denied', 'audit.retention_purge');
  CREATE TYPE "public"."enum_audit_events_outcome" AS ENUM('success', 'denied', 'failure');
  CREATE TABLE "audit_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"actor" varchar NOT NULL,
  	"action" "enum_audit_events_action" NOT NULL,
  	"target_type" varchar,
  	"target_id" varchar,
  	"outcome" "enum_audit_events_outcome" NOT NULL,
  	"ip" varchar,
  	"user_agent" varchar,
  	"meta" jsonb
  );
  
  CREATE INDEX "audit_events_at_idx" ON "audit_events" USING btree ("at");
  CREATE INDEX "actor_at_idx" ON "audit_events" USING btree ("actor","at");
  CREATE INDEX "action_at_idx" ON "audit_events" USING btree ("action","at");
  CREATE INDEX "targetType_targetId_idx" ON "audit_events" USING btree ("target_type","target_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "audit_events" CASCADE;
  DROP TYPE "public"."enum_audit_events_action";
  DROP TYPE "public"."enum_audit_events_outcome";`)
}
