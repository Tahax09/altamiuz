// Setup placeholder (T016): Payload's admin needs an auth collection. Every operation is denied
// so no account can exist yet — including Payload's "first user" registration, which the
// request proxy also blocks. Replaced by the real users collection in Phase 3 (T056).
import type { CollectionConfig } from 'payload'

const deny = () => false

export const usersPlaceholder: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: { admin: deny, create: deny, read: deny, update: deny, delete: deny, unlock: deny },
  fields: [],
}
