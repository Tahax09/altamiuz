// US3 auth state (ADR-005, D-6, D-8). Kept outside Payload collections so no Payload API, query or
// select can return MFA secrets, recovery codes or session state. Also: the last active owner can
// never be demoted, suspended or deleted (database guard behind the application rule).
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE auth_sessions (
      session_id varchar PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now(),
      mfa_verified_at timestamptz,
      reauth_at timestamptz
    );
    CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);

    CREATE TABLE user_mfa (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      secret_enc text,
      enabled_at timestamptz,
      last_used_step bigint,
      pending_secret_enc text,
      pending_created_at timestamptz,
      recovery_salt bytea
    );

    CREATE TABLE mfa_recovery_codes (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code_hash bytea NOT NULL,
      used_at timestamptz,
      UNIQUE (user_id, code_hash)
    );

    CREATE TABLE auth_recovery_tokens (
      token_hash bytea PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      used_at timestamptz
    );

    CREATE OR REPLACE FUNCTION users_last_owner_guard() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF OLD.role::text = 'owner' AND OLD.status::text = 'active'
         AND (TG_OP = 'DELETE' OR NEW.role::text <> 'owner' OR NEW.status::text <> 'active')
         AND NOT EXISTS (
           SELECT 1 FROM users WHERE id <> OLD.id AND role::text = 'owner' AND status::text = 'active'
         ) THEN
        RAISE EXCEPTION 'the last active owner cannot be removed, demoted or suspended' USING ERRCODE = '42501';
      END IF;
      IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER users_last_owner_guard_upd BEFORE UPDATE OF role, status ON users
      FOR EACH ROW EXECUTE FUNCTION users_last_owner_guard();
    CREATE TRIGGER users_last_owner_guard_del BEFORE DELETE ON users
      FOR EACH ROW EXECUTE FUNCTION users_last_owner_guard();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS users_last_owner_guard_del ON users;
    DROP TRIGGER IF EXISTS users_last_owner_guard_upd ON users;
    DROP FUNCTION IF EXISTS users_last_owner_guard();
    DROP TABLE IF EXISTS auth_recovery_tokens;
    DROP TABLE IF EXISTS mfa_recovery_codes;
    DROP TABLE IF EXISTS user_mfa;
    DROP TABLE IF EXISTS auth_sessions;
  `)
}
