// CD-13 publication gate (T095/T098): fails while the Arabic static route vocabulary is still a
// placeholder. Same check as the runtime config gate and the production build (next.config.ts).
import { assertRouteVocabularyApproved } from '../src/modules/i18n'

try {
  assertRouteVocabularyApproved()
  console.log('CD-13: route vocabulary approved.')
} catch (e) {
  console.error((e as Error).message)
  process.exit(1)
}
