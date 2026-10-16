import { livenessResponse } from '@/modules/platform'

export const dynamic = 'force-dynamic'

export function GET(): Response {
  return livenessResponse()
}
