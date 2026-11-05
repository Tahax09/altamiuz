# Audit Log: Protection Model and Maintenance Path (D-9, FR-045–FR-048)

## Layers (all tested in `tests/integration/audit/append-only.test.ts`)

1. **API**: `audit-events` grants no create/update/delete to any role (`denyAll`). Read is
   administrator/owner only, and requires a completed second factor (`allow('audit-events','read')`).
2. **Single write path**: `recordAudit()` (`src/modules/audit/record.ts`) inserts through the
   Local API. Actions are limited to the FR-045 enum. Meta keys are allow-listed per action;
   secret-like keys, nested values and over-long strings are rejected.
3. **Database** (migration `20261016_135400_audit_append_only`):
   - `UPDATE` and `TRUNCATE` are always rejected by triggers. This also blocks the Payload ORM with
     `overrideAccess: true`.
   - `DELETE` is rejected unless it runs inside `audit_events_purge_expired()` **and** the row is
     older than 24 months (A-9). Setting the retention flag by hand still cannot delete recent rows.

## Retention

`purgeExpiredAuditEvents(payload)` calls `audit_events_purge_expired()` and records an
`audit.retention_purge` event carrying the count. It is scheduled as a daily job once the jobs
runner exists. Backups keep purged rows until the backups themselves expire (A-10).

## Privileged maintenance path (documented limitation)

The **table owner or a superuser** can disable or drop the triggers (`ALTER TABLE … DISABLE
TRIGGER`). In local development the application connects as the owner, so this protection is
against application code paths, not against a database administrator.

**Production requirement** (to be implemented with the hosting decision, T132/T135):

- The application connects as a **non-owner role** with `SELECT, INSERT, UPDATE, DELETE` on
  application tables. Migrations run as a separate migration/owner role.
- With that split, the application role **cannot** disable or drop triggers or truncate the table.
  The test "production role split" proves this with a temporary non-owner role.
- Any genuine correction to an audit record needs a DBA, a written change record, and a new audit
  event describing the correction. Records are never edited in place.

## Operations events

`cache.expire` (meta `scope`): an Administrator or Owner expired the public data cache after an
out-of-band write (`docs/runbooks/cache.md`, L-3).
