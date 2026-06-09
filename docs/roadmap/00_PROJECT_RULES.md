# Project Rules — Rafiq Al-Quran v2

## Canonical Sources
- Main branch: `github-main`
- Canonical Prisma schema: `backend/prisma/schema.prisma`
- Canonical development database: `rafiq_v2_clean_dev`
- Do not use `rafiq_v2` for current development checks unless explicitly requested.
- Do not use old temporary databases unless the task is specifically database inventory/cleanup.

## Database Rules
- Never use `prisma db push`.
- Never run migrations on `rafiq_v2`.
- Use only `rafiq_v2_clean_dev` for migration testing.
- Do not print DATABASE_URL or passwords.
- Do not modify `backend/.env` unless explicitly requested.
- If DATABASE_URL does not point to `rafiq_v2_clean_dev`, stop immediately.
- Any schema change must have a Prisma migration or justified raw SQL migration.
- No destructive migration without precheck, backup plan, and explicit approval.

## Branching Rules
- One task = one branch.
- Do not work on the same branch from two models.
- Do not mix backend/database/Flutter/web changes unless the task explicitly requires it.
- Do not commit unrelated local changes.
- Do not use `git add .` blindly.

## Verification Rules
Every PR must report:
- changed files
- build/test results
- risks
- safe next step

For backend/database:
- `prisma validate`
- `prisma generate`
- backend build
- migration status if relevant

For web:
- frontend build

For Flutter:
- `flutter analyze`
- `flutter test`

## Parallel Work Rules
Allowed:
- Model A works on Database/Backend.
- Model B works on Flutter/UX.
- Model C works on Web/Reports.

Forbidden:
- Two models modifying `schema.prisma`.
- Two models modifying the same Flutter files.
- Two models using the same working tree.
- Any model running migrations without confirming `rafiq_v2_clean_dev`.

## Merge Rules
- Do not merge red checks.
- Do not merge unresolved conflicts.
- Do not merge if the PR contains unrelated files.
- Do not merge if Arabic text is corrupted.
- Do not merge DB changes without migration verification.
