// Shared between the server (which localizes) and the client form (which only displays).
import type { MessageKey } from '@/modules/i18n'

/** Every string the form can show, already localized by the server (keeps the i18n
 * dictionaries out of the client bundle). */
export const ENQUIRY_MESSAGE_KEYS = [
  'enquiryName',
  'enquiryEmail',
  'enquiryPhone',
  'enquiryOrganization',
  'enquiryTopic',
  'enquiryMessage',
  'enquiryConsent',
  'enquirySensitive',
  'enquiryRequired',
  'enquirySubmit',
  'enquirySent',
  'enquiryErrorsSummary',
  'enquiryErrRequired',
  'enquiryErrTooLong',
  'enquiryErrInvalid',
  'enquiryErrConsent',
  'enquiryErrEmail',
  'enquiryErrPhone',
  'enquiryErrTopic',
  'enquiryRejected',
  'enquiryRateLimited',
  'enquiryUnavailable',
  'enquiryNotConfigured',
  'enquiryBotCheck',
] as const satisfies readonly MessageKey[]
export type EnquiryMessages = Record<(typeof ENQUIRY_MESSAGE_KEYS)[number], string>
