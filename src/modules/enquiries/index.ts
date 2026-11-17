// US5 enquiries module (T120–T126, D-15).
export {
  deleteAfterFor,
  DELIVERY_STATUSES,
  enquiries,
  ENQUIRIES,
  RETENTION_MONTHS,
} from './collection'
export {
  deliverEnquiry,
  enquiryEmailText,
  enquiryRecipients,
  MAX_ATTEMPTS,
  SEND_ENQUIRY_TASK,
  sendEnquiryTask,
  setEnquiryMailerForTests,
  SUBJECT,
} from './delivery'
export { analyticsCutoff, jobsAuthorised, jobsRunEndpoints, runJobs } from './jobs'
export { purgeExpiredEnquiries } from './retention'
export { FIELDS, LIMITS, validateEnquiry, type EnquiryField, type ErrorCode } from './schema'
export {
  CAPTCHA_ACTION,
  ENQUIRY_LIMIT,
  enquiryTopics,
  privacyNoticeFor,
  setCaptchaForTests,
  submitEnquiry,
  type SubmitResult,
} from './submit'
export { enquiryDeliveryCheck } from './health'
