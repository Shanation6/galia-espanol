# Verification — 2026-11-01

## Result

Published: https://shanation6.github.io/galia-espanol/

Protected admin: https://galia-espanol-studio.micsonwilktaywilsamu.chatgpt.site/admin/

## Evidence

- `node --test tests/service.test.mjs`: 12/12 pass, including a real SQLite schema and request/update/delete/idempotency behavior.
- `scripts/browser-qa.mjs`: passes form validation, retry after network failure, edited-contact request identity, blocked localStorage, phrase interaction, 360/390/768/1440 widths, reduced motion, and admin status update UI.
- `scripts/live-check.mjs`: live GitHub Pages returned HTTP 200; production form POST returned 201 and displayed success; no runtime errors; mobile overflow check passed.
- Anonymous `/api/leads` returned 401. A client-supplied fake owner identity also returned 401: platform strips untrusted identity headers.
- Sites live database read confirmed test requests persist in D1.
- A normal request to `/admin/` redirects to the platform's ChatGPT sign-in page. Actual owner authentication was not completed: the browser has no logged-in owner session. Authenticated admin workflow verified with the local browser fixture and server integration tests.
- Two clearly named QA records remain in the production inbox and can be deleted by the owner. They are not real students.

## Independent review

Reviewer found two Important issues: stale contact data on an edited retry, and blocked browser storage stopping form initialization. Both fixed. The server rejects a reused ID with a different payload; the client changes the ID for edited submissions and disables edits in flight. Preference storage errors are ignored without affecting form handlers.

## Rendered quality gate

Desktop hero, notebook, booking confirmation, admin and mobile hero were visually inspected. Identity: warm paper, terracotta, editorial Spanish/Russian typography, real Galia portrait, handwritten underline and phrase notebook. Primary action and request semantics are explicit. Horizontal overflow repaired at 360 px. Motion has a static reduced-motion replacement. Self-hosted WOFF2 font subsets total 333120 bytes. Public quality gate passed; no claim of measured conversion improvement.

## Integration decisions

User explicitly requested publication to GitHub Pages. This is a new repository on main, with no existing branch to merge and no existing user changes to preserve. Server functionality uses Sites because GitHub Pages does not run the database or private server code. Site can receive inquiries; visitor acquisition, actual lesson terms and handover of the administrator account are separate business steps.
