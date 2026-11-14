// The MFA enrolment QR code: a square module grid for the otpauth link, drawn by the account page.
import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import { qrMatrix } from '../../../src/modules/auth/mfa'

describe('MFA enrolment QR code', () => {
  it('encodes the otpauth link as a square grid of dark and light modules', () => {
    const uri =
      'otpauth://totp/Altamiuz:owner%40example.org?secret=JBSWY3DPEHPK3PXP&issuer=Altamiuz'
    const qr = qrMatrix(uri)
    expect(qr.size).toBeGreaterThanOrEqual(21)
    expect(qr.modules).toMatch(/^[01]+$/)
    expect(qr.modules.length).toBe(qr.size * qr.size)
    // Same grid as the library's own encoder at the same error-correction level.
    const ref = QRCode.create(uri, { errorCorrectionLevel: 'M' }).modules
    expect(qr.modules).toBe(Array.from(ref.data, (b) => (b ? '1' : '0')).join(''))
    // Finder pattern in the top-left corner: a 7-module dark border.
    expect(qr.modules.slice(0, 7)).toBe('1111111')
  })
})
