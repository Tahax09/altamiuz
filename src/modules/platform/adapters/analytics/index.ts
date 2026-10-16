// Analytics port (FR-084–FR-087). Disabled by default; provider chosen in R-F (T127).
export type AnalyticsEvent = 'page_view' | 'enquiry_conversion'

export interface Analytics {
  track(event: AnalyticsEvent, props: { locale: 'ar' | 'en' }): Promise<void>
}

export const noAnalytics: Analytics = { track: async () => undefined }
