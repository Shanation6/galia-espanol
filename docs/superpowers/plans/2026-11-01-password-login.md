# Password login

User explicitly requests removing ChatGPT login in favor of a username and password. This supersedes the Sites skill default to preserve platform authentication. Preserve the current public Site audience and data; do not touch platform-owned auth routes. Use app-local routes under /admin/.

- [x] Write integration tests for anonymous login page, correct/incorrect credentials, session expiry/revocation, CSRF, rate limiting and denial of old platform identity.
- [x] Implement server-only PBKDF2-SHA256 password verification; configure only the salted verifier and username in runtime secrets. Generate a strong initial password and deliver it directly in chat, never repository/source/browser assets.
- [x] Create opaque 256-bit sessions with hashed tokens in D1, 12-hour expiration, Secure/HttpOnly/SameSite=Lax __Host cookie; logout revokes server record. Bind session to credential configuration so credential changes invalidate it. Lax preserves login when navigating from the public GitHub Pages website; every mutation separately enforces same-origin POST/PATCH/DELETE.
- [x] Add a matching login screen, native password-manager autocomplete and POST logout. Preserve real leads UI and existing visitor form.
- [x] Run full tests and browser checks, independent security review, publish Sites and GitHub source/privacy updates, verify live login/read/update/logout without any ChatGPT account.
