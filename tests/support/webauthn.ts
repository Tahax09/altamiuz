// A software WebAuthn authenticator for integration tests: real P-256 keys, real CBOR attestation
// objects ("none" format), real signatures over authenticatorData ‖ SHA-256(clientDataJSON). Every
// field the server checks can be bent (origin, RP ID, user verification, counter, type) so the
// tests can show each check refusing.
import { createHash, generateKeyPairSync, randomBytes, sign, type KeyObject } from 'node:crypto'

const b64u = (b: Uint8Array | Buffer) => Buffer.from(b).toString('base64url')
const sha256 = (b: Uint8Array | string) => createHash('sha256').update(b).digest()

// Minimal CBOR encoder (RFC 8949): unsigned/negative integers, byte and text strings, maps.
type Cbor = number | string | Buffer | Map<Cbor, Cbor> | Record<string, unknown>
function head(major: number, n: number): Buffer {
  if (n < 24) return Buffer.from([(major << 5) | n])
  if (n < 0x100) return Buffer.from([(major << 5) | 24, n])
  if (n < 0x10000) return Buffer.from([(major << 5) | 25, n >> 8, n & 0xff])
  const b = Buffer.alloc(5)
  b[0] = (major << 5) | 26
  b.writeUInt32BE(n, 1)
  return b
}
function cbor(v: Cbor): Buffer {
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v)
  if (typeof v === 'string') {
    const s = Buffer.from(v, 'utf8')
    return Buffer.concat([head(3, s.length), s])
  }
  if (Buffer.isBuffer(v)) return Buffer.concat([head(2, v.length), v])
  const entries = v instanceof Map ? [...v.entries()] : Object.entries(v)
  return Buffer.concat([
    head(5, entries.length),
    ...entries.flatMap(([k, val]) => [cbor(k as Cbor), cbor(val as Cbor)]),
  ])
}

export type Bend = {
  origin?: string
  rpId?: string
  userVerified?: boolean
  counter?: number
  type?: string
  userHandle?: string | null
}

export class SoftAuthenticator {
  readonly credentialId = randomBytes(32)
  private readonly privateKey: KeyObject
  private readonly cose: Buffer
  counter = 0
  userHandle = ''

  constructor(
    readonly origin = 'http://localhost:3000',
    readonly rpId = 'localhost',
  ) {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    this.privateKey = privateKey
    const jwk = publicKey.export({ format: 'jwk' }) as { x: string; y: string }
    this.cose = cbor(
      new Map<Cbor, Cbor>([
        [1, 2], // kty: EC2
        [3, -7], // alg: ES256
        [-1, 1], // crv: P-256
        [-2, Buffer.from(jwk.x, 'base64url')],
        [-3, Buffer.from(jwk.y, 'base64url')],
      ]),
    )
  }

  get id() {
    return b64u(this.credentialId)
  }

  private authData(rpId: string, uv: boolean, counter: number, attested: boolean): Buffer {
    const flags = 0x01 | (uv ? 0x04 : 0) | (attested ? 0x40 : 0)
    const count = Buffer.alloc(4)
    count.writeUInt32BE(counter)
    const parts: Buffer[] = [sha256(rpId), Buffer.from([flags]), count]
    if (attested) {
      const len = Buffer.alloc(2)
      len.writeUInt16BE(this.credentialId.length)
      parts.push(Buffer.alloc(16), len, this.credentialId, this.cose)
    }
    return Buffer.concat(parts)
  }

  private clientData(type: string, challenge: string, origin: string): Buffer {
    return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }))
  }

  /** navigator.credentials.create() for the server's registration options. */
  register(options: { challenge: string; user: { id: string } }, bend: Bend = {}) {
    this.userHandle = options.user.id
    const clientDataJSON = this.clientData(
      bend.type ?? 'webauthn.create',
      options.challenge,
      bend.origin ?? this.origin,
    )
    const attestationObject = cbor({
      fmt: 'none',
      attStmt: new Map(),
      authData: this.authData(bend.rpId ?? this.rpId, bend.userVerified ?? true, 0, true),
    })
    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key',
      response: {
        clientDataJSON: b64u(clientDataJSON),
        attestationObject: b64u(attestationObject),
        transports: ['internal'],
      },
      clientExtensionResults: {},
    }
  }

  /** navigator.credentials.get() for the server's authentication options. */
  assert(options: { challenge: string }, bend: Bend = {}) {
    if (bend.counter === undefined) this.counter += 1
    const counter = bend.counter ?? this.counter
    const clientDataJSON = this.clientData(
      bend.type ?? 'webauthn.get',
      options.challenge,
      bend.origin ?? this.origin,
    )
    const authenticatorData = this.authData(
      bend.rpId ?? this.rpId,
      bend.userVerified ?? true,
      counter,
      false,
    )
    const signature = sign(
      'sha256',
      Buffer.concat([authenticatorData, sha256(clientDataJSON)]),
      this.privateKey,
    )
    const userHandle = bend.userHandle === undefined ? this.userHandle : bend.userHandle
    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key',
      response: {
        clientDataJSON: b64u(clientDataJSON),
        authenticatorData: b64u(authenticatorData),
        signature: b64u(signature),
        ...(userHandle === null ? {} : { userHandle }),
      },
      clientExtensionResults: {},
    }
  }
}
