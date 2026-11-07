// `pnpm docs:api`: rewrites the generated inventory block in docs/api.md (T140, FR-096).
import fs from 'node:fs'
import config from '../src/payload.config'
import { DOC, renderInventory, withInventory } from './api-docs'

fs.writeFileSync(DOC, withInventory(fs.readFileSync(DOC, 'utf8'), renderInventory(await config)))
console.log(`${DOC} updated`)
process.exit(0)
