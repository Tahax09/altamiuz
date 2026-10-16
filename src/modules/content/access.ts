// Content access (D-3, FR-021, FR-037). CMS reads need an MFA-verified role with read permission.
// The public site renders through the Local API with context.publicSite and sees published only;
// REST requests cannot set context, so anonymous REST stays denied.
import type { Access, PayloadRequest } from 'payload'
import { allow, can, isMfaVerified, roleOf, type Action, type Resource } from '../access'

export const contentRead =
  (resource: Resource): Access =>
  ({ req }) => {
    const role = roleOf(req.user)
    if (req.user && isMfaVerified(req.user) && role && can(role, resource, 'read')) return true
    if (req.context?.publicSite === true && !req.user) return { _status: { equals: 'published' } }
    return false
  }

export const contentAccess = (resource: Resource) => ({
  read: contentRead(resource),
  readVersions: allow(resource, 'read'),
  create: allow(resource, 'create'),
  update: allow(resource, 'updateDraft'),
  delete: allow(resource, 'delete'),
})

export function mayDo(req: PayloadRequest, resource: Resource, action: Action): boolean {
  const role = roleOf(req.user)
  return !!req.user && isMfaVerified(req.user) && !!role && can(role, resource, action)
}
