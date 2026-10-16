import * as migration_20261016_094408_baseline from './20261016_094408_baseline'

export const migrations = [
  {
    up: migration_20261016_094408_baseline.up,
    down: migration_20261016_094408_baseline.down,
    name: '20261016_094408_baseline',
  },
]
