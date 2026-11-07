# Usability Protocol — SC-002 (T142)

**SC-002**: an editor with no developer help can create, preview and publish a new bilingual page
from existing section types in **under 20 minutes on the first attempt**, in usability testing
with **at least 2 staff members**. This protocol has **not been run**: it needs two Altamiuz staff
members (the owner nominates them) and a running build with an account per participant.

## Setup

- Environment: the preview deployment (ADR-010) or the local production build with seeded data.
  Record the build commit and URL.
- Accounts: one Editor and one Publisher per participant, MFA enrolled beforehand (enrolment is
  not part of the timed task).
- Material: a one-page brief with an English and an Arabic title, two short paragraphs per
  language and one image with alt text. No training beyond the brief; no developer present.
- The facilitator observes only (think-aloud, no hints); a second person keeps timed notes.

## Tasks (timed from the first click)

1. As Editor: create a page, enter the English title and body using existing section types, add
   the image with alt text, save a draft.
2. Add the Arabic version; save.
3. Preview both languages.
4. As Publisher: publish English and Arabic.
5. Open the public page in both languages and confirm it is visible.

## Measures

Completion without help (per task), time per task and in total, errors and recoveries, use of
field help text, SUS questionnaire after the session, free comments. **Pass**: both participants
complete all tasks unaided, first attempt, in under 20 minutes.

## Results

| Participant | Role | Date | Completed unaided | Total time | Issues |
| ----------- | ---- | ---- | ----------------- | ---------- | ------ |
| —           | —    | —    | not run           | —          | —      |

Issues go to tasks.md (project UI) or `docs/accessibility/admin-findings.md` (Payload core).
