# ADR-002: Public site reads through Payload's Local API; anonymous REST denied; GraphQL off

- **Status**: Accepted (plan D-3)
- **Decision**: Public pages render on the server via the Local API with `overrideAccess: false`.
  Anonymous REST access is denied for every collection except published-use media files (Phase 4).
  `graphQL.disable: true`; the GraphQL route files are not shipped.
- **Evidence (Setup)**: `tests/smoke/foundation.spec.ts`: `/api/graphql` → 404; anonymous
  `GET /api/users` → 403.
