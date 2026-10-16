// T039: storage for the Postgres rate limiter. Not a Payload collection: never exposed via API.
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE rate_limit_buckets (
      key bytea NOT NULL,
      window_start timestamptz NOT NULL,
      count integer NOT NULL CHECK (count > 0),
      expires_at timestamptz NOT NULL,
      PRIMARY KEY (key, window_start)
    );
    CREATE INDEX rate_limit_buckets_expires_at_idx ON rate_limit_buckets (expires_at);
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS rate_limit_buckets;`)
}
