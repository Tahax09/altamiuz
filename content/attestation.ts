// Evidence reference used when the owner confirms a claim without supporting documents (owner
// instruction 2026-11-18: "no need for proof"). The evidence gate still runs: each claim is
// recorded as verified with this reference, and editing a claim later removes the verification.
export const OWNER_ATTESTATION =
  'Owner attestation, 2026-11-18: claim confirmed by the owner (Taha Alabyad); supporting documents waived by the owner.'
