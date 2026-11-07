import { enquiryDeliveryCheck } from '@/modules/enquiries'
import {
  createEmailAdapter,
  emailAdapterCheck,
  getConfig,
  readinessResponse,
  storageCheck,
} from '@/modules/platform'

export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<Response> {
  const cfg = getConfig()
  return readinessResponse(request, {
    token: cfg.secrets.healthReadyToken,
    databaseUrl: cfg.database.url,
    checks: {
      storage: storageCheck(cfg.storage),
      email: emailAdapterCheck(() =>
        createEmailAdapter({
          driver: cfg.email.driver,
          from: cfg.email.from,
          smtpUrl: cfg.email.smtpUrl ?? '',
        } as never),
      ),
      enquiryDelivery: enquiryDeliveryCheck,
    },
  })
}
