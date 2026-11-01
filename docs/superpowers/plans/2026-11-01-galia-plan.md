# Galia Implementation Plan

Goal: publish an individual Spanish teaching website with durable lesson requests and a protected admin.
Architecture: static Pages frontend plus Sites Worker/D1 backend. No frontend frameworks required.
Spec: ../specs/2026-11-01-galia-design.md

## Constraints and review focus
- Preserve real identity; no invented outcomes, reviews, prices, free lessons or guarantees.
- Reject invalid contacts, oversized fields and missing consent server-side.
- Deny anonymous and non-owner lead reads/updates; restrict cross-origin writes.
- Retry must not duplicate a submitted request; never display success before server response.
- Public HTML remains readable without motion; no mobile horizontal overflow.

## Task 1: Lead contract and service
- [x] Write Node tests for validation, consent, owner auth, CORS, idempotency and status allowlist; observe initial failure.
- [x] Implement worker with schema migration, public POST, protected list/PATCH and owner admin route.
- [x] Run tests and package/deploy Sites backend; verify anonymous API denial.

## Task 2: Visitor site and admin
- [x] Create semantic editorial layout, real assets, responsive CSS, reduced-motion scroll behavior.
- [x] Implement phrase demo and two-step form with errors/retry/success.
- [x] Create owner admin with search, statuses, notes and safe CSV export.
- [x] Run desktop/mobile browser checks, validate one full lead lifecycle, repair failures.

## Task 3: Publish
- [x] Review code/security and verify no credentials or leads are tracked.
- [x] Create GitHub repository, commit source and publish Pages from docs/ output.
- [x] Verify live Pages form and admin integration; return both live links.
