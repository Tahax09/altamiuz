# Evidence Register (T143, FR-016, SC-016)

Every claim-bearing item in published content must carry **verified** evidence with a
**reference** to the document that supports it (registration certificate, signed letter,
contract register entry …), verified by an Administrator or Owner with completed MFA, and the
verification must match the claim text as it is published in every language.

## Where the register lives

The register is the CMS data itself, not this file: each claim has an evidence group (`status`,
`reference`, `verifiedBy`, `verifiedAt`, a digest of the claim it covers). This file defines the
claim types and the check; the current register is printed by:

```sh
pnpm check:evidence   # read-only; lists every published claim; exit 1 on any problem
```

Run it before launch, after any import, restore or SQL fix, and attach the output to the launch
record. The supporting documents themselves are held by the owner outside the CMS; the
`reference` names them.

## Claim types (code: `src/modules/content/evidence.ts`)

| Claim                                           | Where                                   | Content dependency  |
| ----------------------------------------------- | --------------------------------------- | ------------------- |
| Company legal name (`companyName`)              | site settings → `companyNameEvidence`   | CD-01               |
| Address (`address`)                             | site settings → `addressEvidence`       | CD-02               |
| Course accreditation (`accreditationStatement`) | each course → `accreditationEvidence`   | CD-05               |
| Statistics block (values and labels)            | any page/service/course section `stats` | CD-07               |
| Credentials block (name, issuer, valid until)   | any section `credentials`               | CD-01, CD-05, CD-06 |

Client names, logos, testimonials (CD-08) and biographies (CD-03) have no claim block in v1 and
must not be published until a decision adds one.

## Checks performed

1. Every claim present in any language of a document published in any language has evidence
   with status `verified` whose digest equals the digest of the claim **as published**. The same
   rule is enforced at publish time against both the draft and the resulting published version
   (`assertClaimsVerified`, A-8).
2. Every verified item has a non-empty `reference`.

Tests: `tests/integration/content/evidence-register.test.ts` (listed with reference; drafts not
listed; claim changed outside the app after verification flagged; verified without reference
flagged). Publish-time gates: `tests/integration/content/publish.test.ts` (T074),
`evidence-binding.test.ts`.

## Current state (2026-11-07)

- **Production content**: none entered. CD-01, CD-02, CD-05, CD-06, CD-07 are open
  (`docs/content/dependencies.md`), so there is no approved claim and no evidence to register.
  SC-016 cannot be verified until real content is published.
- **Seeded e2e data** (`altamiuz_e2e`, reseeded 2026-11-07): `pnpm check:evidence` → 1 published
  claim, **0 problems**. The earlier problem (finding A-8: the home statistics block published
  with an English label its verification did not cover) came from the seed sending Arabic rows
  without ids and publishing Arabic only; the publish gate now checks the published version too
  and refuses that sequence, and the seed keeps row ids. The fixture keeps its synthetic test
  reference; no evidence was invented.
