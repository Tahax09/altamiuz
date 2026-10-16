// Role × permission data (T030), transcribed from contracts/access-matrix.md. The unit suite
// parses the contract and fails on any drift. Anything absent here is denied.
export const ROLES = ['editor', 'publisher', 'administrator', 'owner'] as const
export type Role = (typeof ROLES)[number]

export type Resource =
  | 'pages'
  | 'services'
  | 'courses'
  | 'evidence'
  | 'media'
  | 'navigation'
  | 'banner'
  | 'redirects'
  | 'site-settings'
  | 'enquiries'
  | 'audit-events'
  | 'users'
  | 'own-account'
  | 'security-settings'

export type Action =
  | 'read'
  | 'create'
  | 'updateDraft'
  | 'update'
  | 'publish'
  | 'unpublish'
  | 'restore'
  | 'delete'
  | 'verify'
  | 'upload'
  | 'export'

const ALL: readonly Role[] = ROLES
const PUBLISHER_UP: readonly Role[] = ['publisher', 'administrator', 'owner']
const ADMIN_UP: readonly Role[] = ['administrator', 'owner']
const OWNER: readonly Role[] = ['owner']

type Grants = Partial<Record<Action, readonly Role[]>>
const content: Grants = {
  read: ALL,
  create: ALL,
  updateDraft: ALL,
  publish: PUBLISHER_UP,
  unpublish: PUBLISHER_UP,
  restore: PUBLISHER_UP,
  delete: ADMIN_UP,
}

// WS8 owner decisions: navigation/banner read/create/delete; users directory read.
export const MATRIX: Readonly<Record<Resource, Grants>> = {
  pages: content,
  services: content,
  courses: content,
  evidence: { verify: ADMIN_UP },
  media: { read: ALL, upload: ALL, update: ALL, delete: PUBLISHER_UP },
  navigation: {
    read: ALL,
    create: PUBLISHER_UP,
    updateDraft: PUBLISHER_UP,
    publish: ADMIN_UP,
    unpublish: ADMIN_UP,
    delete: ADMIN_UP,
  },
  banner: {
    read: ALL,
    create: PUBLISHER_UP,
    updateDraft: PUBLISHER_UP,
    publish: ADMIN_UP,
    unpublish: ADMIN_UP,
    delete: ADMIN_UP,
  },
  users: { read: ADMIN_UP },
  redirects: { read: ALL, create: ADMIN_UP, update: ADMIN_UP, delete: ADMIN_UP },
  'site-settings': { read: ALL, update: ADMIN_UP, publish: ADMIN_UP },
  enquiries: { read: ADMIN_UP, export: ADMIN_UP, delete: ADMIN_UP },
  'audit-events': { read: ADMIN_UP, export: ADMIN_UP },
  'own-account': { update: ALL },
  'security-settings': { update: OWNER },
}

export type UserAction = 'invite' | 'suspend' | 'revokeSessions' | 'resetMfa' | 'changeRole'
