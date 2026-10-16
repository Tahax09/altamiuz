// Cryptographic helpers for the auth module (FR-033a/b, D-6). Node crypto only.
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  pbkdf2,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (value: string) => createHash('sha256').update(value).digest()
/** Purpose-bound key derived from a configured secret (never stored). */
export const deriveKey = (secret: string, label: string) =>
  createHmac('sha256', secret).update(label).digest()

/** AES-256-GCM. Output: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encryptSecret(plain: string, keyHex: string): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', Buffer.from(keyHex, 'hex'), iv)
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [
    'v1',
    iv.toString('base64url'),
    c.getAuthTag().toString('base64url'),
    ct.toString('base64url'),
  ].join('.')
}

export function decryptSecret(enc: string, keyHex: string): string {
  const [v, iv, tag, ct] = enc.split('.')
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('unsupported secret format')
  const d = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(keyHex, 'hex'),
    Buffer.from(iv, 'base64url'),
  )
  d.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8')
}

/** Slow, salted hash for recovery codes (scrypt N=2^14, r=8, p=1). */
export const scryptHash = (value: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(value, salt, 32, { N: 2 ** 14, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) =>
      e ? reject(e) : resolve(k),
    ),
  )

// Mirrors Payload 3.91.0 local-strategy hashing (pbkdf2-sha256-v1: 600,000 × 32; legacy 25,000 × 512).
const CURRENT_PREFIX = 'pbkdf2-sha256-v1:'
const pbkdf2Async = (password: string, salt: string, iterations: number, keyLength: number) =>
  new Promise<Buffer>((resolve, reject) =>
    pbkdf2(password, salt, iterations, keyLength, 'sha256', (e, k) => (e ? reject(e) : resolve(k))),
  )

export async function verifyPayloadPassword(
  doc: { hash?: unknown; salt?: unknown },
  password: string,
): Promise<boolean> {
  if (typeof doc.hash !== 'string' || typeof doc.salt !== 'string') {
    await dummyPasswordWork(password)
    return false
  }
  const current = doc.hash.startsWith(CURRENT_PREFIX)
  const stored = Buffer.from(current ? doc.hash.slice(CURRENT_PREFIX.length) : doc.hash, 'hex')
  const computed = await pbkdf2Async(
    password,
    doc.salt,
    current ? 600_000 : 25_000,
    current ? 32 : 512,
  )
  return computed.length === stored.length && timingSafeEqual(computed, stored)
}

/** Same cost as a real password check, for timing parity on unknown/locked/suspended accounts. */
export async function dummyPasswordWork(password: string): Promise<void> {
  await pbkdf2Async(password, randomBytes(32).toString('hex'), 600_000, 32)
}
