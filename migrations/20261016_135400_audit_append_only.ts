// D-9 / FR-047: database-level append-only enforcement for audit_events.
// - UPDATE and TRUNCATE are always rejected.
// - DELETE is rejected unless issued by audit_events_purge_expired() for rows older than
//   24 months (A-9). Setting the retention flag by hand still cannot delete recent rows.
// Limitation: the table owner (or a superuser) can disable or drop these triggers. Production
// must run the application as a non-owner role (docs/security/audit-log.md).
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION audit_events_guard() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'DELETE'
         AND current_setting('altamiuz.audit_retention', true) = 'on'
         AND OLD.at < now() - interval '24 months' THEN
        RETURN OLD;
      END IF;
      RAISE EXCEPTION 'audit_events is append-only (% rejected)', TG_OP USING ERRCODE = '42501';
    END $$;

    CREATE OR REPLACE FUNCTION audit_events_reject_truncate() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'audit_events is append-only (TRUNCATE rejected)' USING ERRCODE = '42501';
    END $$;

    CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION audit_events_guard();
    CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION audit_events_guard();
    CREATE TRIGGER audit_events_no_truncate BEFORE TRUNCATE ON audit_events
      FOR EACH STATEMENT EXECUTE FUNCTION audit_events_reject_truncate();

    CREATE OR REPLACE FUNCTION audit_events_purge_expired() RETURNS integer LANGUAGE plpgsql AS $$
    DECLARE n integer;
    BEGIN
      PERFORM set_config('altamiuz.audit_retention', 'on', true);
      DELETE FROM audit_events WHERE at < now() - interval '24 months';
      GET DIAGNOSTICS n = ROW_COUNT;
      PERFORM set_config('altamiuz.audit_retention', 'off', true);
      RETURN n;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS audit_events_no_truncate ON audit_events;
    DROP TRIGGER IF EXISTS audit_events_no_delete ON audit_events;
    DROP TRIGGER IF EXISTS audit_events_no_update ON audit_events;
    DROP FUNCTION IF EXISTS audit_events_purge_expired();
    DROP FUNCTION IF EXISTS audit_events_reject_truncate();
    DROP FUNCTION IF EXISTS audit_events_guard();
  `)
}
