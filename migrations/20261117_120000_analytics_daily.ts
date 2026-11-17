// T127 (ADR-007): aggregate-only analytics counters. One row per UTC day, language and event;
// nothing about a visitor is stored. Not a Payload collection: never exposed via the API.
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE analytics_daily (
      day date NOT NULL,
      locale text NOT NULL CHECK (locale IN ('ar', 'en')),
      event text NOT NULL CHECK (event IN ('page_view', 'enquiry_conversion')),
      count integer NOT NULL CHECK (count > 0),
      PRIMARY KEY (day, locale, event)
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS analytics_daily;`)
}
