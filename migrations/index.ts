import * as migration_20261016_094408_baseline from './20261016_094408_baseline'
import * as migration_20261016_135313_audit_events from './20261016_135313_audit_events'
import * as migration_20261016_135400_audit_append_only from './20261016_135400_audit_append_only'
import * as migration_20261016_140000_rate_limit_buckets from './20261016_140000_rate_limit_buckets'

export const migrations = [
  {
    up: migration_20261016_094408_baseline.up,
    down: migration_20261016_094408_baseline.down,
    name: '20261016_094408_baseline',
  },
  {
    up: migration_20261016_135313_audit_events.up,
    down: migration_20261016_135313_audit_events.down,
    name: '20261016_135313_audit_events',
  },
  {
    up: migration_20261016_135400_audit_append_only.up,
    down: migration_20261016_135400_audit_append_only.down,
    name: '20261016_135400_audit_append_only',
  },
  {
    up: migration_20261016_140000_rate_limit_buckets.up,
    down: migration_20261016_140000_rate_limit_buckets.down,
    name: '20261016_140000_rate_limit_buckets',
  },
]
