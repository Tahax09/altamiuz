// Media access (FR-051, FR-056, contracts/access-matrix.md). CMS roles with a completed second
// factor: read, upload and update (all roles), delete (Publisher and above). Anonymous visitors get
// exactly two things: file delivery (Payload's file route, `isReadingStaticFile`) and population
// on the public site (Local API with `context.publicSite`), and both only for media with a
// published, visible use (usage.ts). Anonymous REST/GraphQL reads of media documents are denied.
import type { Access } from 'payload'
import { allow, can, isMfaVerified, roleOf } from '../access'
import { publicMediaIds } from './usage'

export const mediaRead: Access = async (args) => {
  const { req } = args
  const role = roleOf(req.user)
  if (req.user && isMfaVerified(req.user) && role && can(role, 'media', 'read')) return true
  if (req.user) return false // signed in without MFA or permission: nothing, not even public files
  const staticFile = (args as { isReadingStaticFile?: boolean }).isReadingStaticFile === true
  if (!staticFile && req.context?.publicSite !== true) return false
  const ids = [...(await publicMediaIds(req.payload))]
  // `in: []` is not a reliable "match nothing" across adapters; an impossible id is.
  return { id: { in: ids.length ? ids : [-1] } }
}

export const mediaAccess = {
  read: mediaRead,
  create: allow('media', 'upload'),
  update: allow('media', 'update'),
  delete: allow('media', 'delete'),
}
