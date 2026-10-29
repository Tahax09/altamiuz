// Runs a command against the Neon dev branch (WS10). Reads .env.neon (pulled by `neon init`, git-
// ignored) and overrides DATABASE_URL for the child process only; every other setting still comes
// from .env.local. Neon guidance: pooled URL for the running app, direct (unpooled) URL for schema
// migrations. Local development and tests keep using the local Docker Postgres.
//   node scripts/with-neon.mjs [--direct] -- <command> [args...]
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

const args = process.argv.slice(2)
const direct = args[0] === '--direct'
const sep = args.indexOf('--')
const command = sep === -1 ? [] : args.slice(sep + 1)
if (!command.length) {
  console.error('usage: node scripts/with-neon.mjs [--direct] -- <command> [args...]')
  process.exit(2)
}
if (!existsSync('.env.neon')) {
  console.error('.env.neon not found: run `neon env pull` for the dev branch first')
  process.exit(2)
}
const neon = parseEnv(readFileSync('.env.neon', 'utf8'))
const url = direct ? neon.DATABASE_URL_UNPOOLED : neon.DATABASE_URL
if (!url || !/^postgres(ql)?:\/\//.test(url) || !/\.neon\.tech[:/]/.test(url)) {
  console.error(
    `.env.neon: ${direct ? 'DATABASE_URL_UNPOOLED' : 'DATABASE_URL'} missing or not a Neon URL`,
  )
  process.exit(2)
}
if (!direct && !/-pooler\./.test(url))
  console.warn('warning: DATABASE_URL is not the pooled endpoint')
if (direct && /-pooler\./.test(url)) {
  console.error('migrations need the direct (non -pooler) endpoint')
  process.exit(2)
}
const child = spawn(command[0], command.slice(1), {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url, NEON_BRANCH: neon.NEON_BRANCH ?? '' },
})
child.on('exit', (code) => process.exit(code ?? 1))
