// User-facing API errors (WS10 finding). In the production bundle an APIError thrown here can
// reach Payload's route handler as a different class copy with an empty `name`, and Payload's
// formatErrors then replaces the message with "An unknown error occurred." An explicit name and
// data keep the message on every path. Never put internal details in these messages.
import { APIError } from 'payload'

export function publicError(
  message: string,
  status: number,
  data: Record<string, unknown> = { reason: 'policy' },
): APIError {
  const err = new APIError(message, status, data, true)
  err.name = 'APIError'
  return err
}
