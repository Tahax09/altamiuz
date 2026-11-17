// Server-side counting for the public site (ADR-007, FR-084–FR-087). No script, beacon, cookie or
// storage reaches the browser, enabled or not. Disabled, these return before reading the request.
// The count is written after the response has been sent (`after`), and a failure is only logged:
// a page or an enquiry never waits for, or fails because of, analytics.
import config from '@payload-config'
import { after } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import {
  analyticsEnabled,
  countsAsPageView,
  getAnalytics,
  type AnalyticsEvent,
} from '@/modules/platform'
import type { Locale } from '@/modules/i18n'

function count(event: AnalyticsEvent, locale: Locale) {
  after(async () => {
    try {
      await getAnalytics(await getPayload({ config })).track(event, { locale })
    } catch {
      // track() never throws; this covers Payload being unavailable. Nothing to report upward.
    }
  })
}

/** One view of a published public page in `locale`. */
export async function countPageView(locale: Locale): Promise<void> {
  if (!analyticsEnabled()) return
  if (countsAsPageView(await headers())) count('page_view', locale)
}

/** One accepted contact-form submission. Receives the language only, never the enquiry. */
export function countEnquiryConversion(locale: unknown): void {
  if (!analyticsEnabled() || (locale !== 'ar' && locale !== 'en')) return
  count('enquiry_conversion', locale)
}
