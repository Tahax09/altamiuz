import * as migration_20261016_094408_baseline from './20261016_094408_baseline'
import * as migration_20261016_135313_audit_events from './20261016_135313_audit_events'
import * as migration_20261016_135400_audit_append_only from './20261016_135400_audit_append_only'
import * as migration_20261016_140000_rate_limit_buckets from './20261016_140000_rate_limit_buckets'
import * as migration_20261016_143300_accounts from './20261016_143300_accounts'
import * as migration_20261016_143400_auth_tables from './20261016_143400_auth_tables'
import * as migration_20261016_150837_audit_export from './20261016_150837_audit_export'
import * as migration_20261016_201017_content from './20261016_201017_content'
import * as migration_20261017_113440_globals from './20261017_113440_globals'
import * as migration_20261104_143748_evidence_claim_digest from './20261104_143748_evidence_claim_digest'
import * as migration_20261105_171113_audit_cache_expire from './20261105_171113_audit_cache_expire'
import * as migration_20261106_100933_media from './20261106_100933_media'
import * as migration_20261106_171836_enquiries from './20261106_171836_enquiries'

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
  {
    up: migration_20261016_143300_accounts.up,
    down: migration_20261016_143300_accounts.down,
    name: '20261016_143300_accounts',
  },
  {
    up: migration_20261016_143400_auth_tables.up,
    down: migration_20261016_143400_auth_tables.down,
    name: '20261016_143400_auth_tables',
  },
  {
    up: migration_20261016_150837_audit_export.up,
    down: migration_20261016_150837_audit_export.down,
    name: '20261016_150837_audit_export',
  },
  {
    up: migration_20261016_201017_content.up,
    down: migration_20261016_201017_content.down,
    name: '20261016_201017_content',
  },
  {
    up: migration_20261017_113440_globals.up,
    down: migration_20261017_113440_globals.down,
    name: '20261017_113440_globals',
  },
  {
    up: migration_20261104_143748_evidence_claim_digest.up,
    down: migration_20261104_143748_evidence_claim_digest.down,
    name: '20261104_143748_evidence_claim_digest',
  },
  {
    up: migration_20261105_171113_audit_cache_expire.up,
    down: migration_20261105_171113_audit_cache_expire.down,
    name: '20261105_171113_audit_cache_expire',
  },
  {
    up: migration_20261106_100933_media.up,
    down: migration_20261106_100933_media.down,
    name: '20261106_100933_media',
  },
  {
    up: migration_20261106_171836_enquiries.up,
    down: migration_20261106_171836_enquiries.down,
    name: '20261106_171836_enquiries',
  },
]
