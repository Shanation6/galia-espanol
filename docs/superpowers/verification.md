# Verification — 2026-11-01

## Password login update

User explicitly replaced ChatGPT sign-in with ordinary username/password. Native environment revision 3 configures `ADMIN_LOGIN` and secret `ADMIN_PASSWORD_HASH`; the old `ADMIN_EMAIL` was removed. Sites version 3 is deployed successfully with migration `0001_admin_sessions`.

- Full suite: 25/25 passed, including actual SQLite session storage, wrong passwords, session rotation, expiration, logout revocation, credential rotation, origin/CSRF denial, throttling, private lead read/update/delete, and compiled Worker syntax.
- Independent security review found no Critical or Important issues; suggested origin/rotation tests were added.
- Real browser check on the published service passed: local login page, rejected wrong password, correct login, private request listing, status update, deletion of the temporary test record, session persistence on reload, logout, denial of a copied old session (401), zero runtime errors. No ChatGPT login was needed.
- Browser testing caught a `Referrer-Policy: no-referrer` interaction that set the form POST Origin to null. Replaced with `same-origin`; complete browser flow then passed locally and in production.
- Package test caught replacement-string metacharacters in embedded source. Build uses replacement callbacks; the compiled Worker is verified before publication.
- Sessions: random 256-bit tokens; only SHA-256 hashes stored in D1; 12-hour expiry; HttpOnly/Secure host-only cookie. SameSite=Lax permits following a link from the public website while authenticated; mutating routes additionally require exact Origin. Actual password is delivered only in chat, absent from source and public assets.

The original account-based verification below is historical and superseded by this update.

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
