import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_events_action" ADD VALUE 'cache.expire' BEFORE 'enquiry.view';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_events" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_events_action";
  CREATE TYPE "public"."enum_audit_events_action" AS ENUM('auth.login.success', 'auth.login.failure', 'auth.logout', 'auth.lockout', 'auth.recovery.request', 'auth.recovery.complete', 'auth.password_change', 'mfa.enrol', 'mfa.reset', 'mfa.remove', 'mfa.recovery_code_used', 'mfa.recovery_codes_regenerate', 'session.revoke', 'user.invite', 'user.create', 'user.suspend', 'user.delete', 'user.role_change', 'content.publish', 'content.unpublish', 'content.restore', 'content.delete', 'media.delete', 'redirect.change', 'navigation.change', 'settings.change', 'enquiry.view', 'enquiry.export', 'enquiry.delete', 'enquiry.retention_delete', 'access.denied', 'audit.retention_purge', 'audit.export');
  ALTER TABLE "audit_events" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_events_action" USING "action"::"public"."enum_audit_events_action";`)
}
