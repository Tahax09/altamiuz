import { getConfig, readinessResponse } from '@/modules/platform'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const cfg = getConfig()
  return readinessResponse(request, {
    token: cfg.secrets.healthReadyToken,
    databaseUrl: cfg.database.url,
  })
}
