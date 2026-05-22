# Rafiq Al-Quran v2 - AI Engineering Guide

AGENTS.md is the required guide for AI agents, while the active source code and backend/prisma/schema.prisma are the implementation source of truth. Read this completely before making any changes.

## 1. Active Project Facts
- **Architecture**: Modular Monolith + Layered/Clean Architecture.
- **Backend Stack**: Node.js, Express, TypeScript.
- **Frontend Stack**: React 19, Vite, TypeScript, TailwindCSS.
- **Mobile Stack**: Flutter (Riverpod, Clean Architecture).
- **Database**: PostgreSQL (NOT MySQL).
- **ORM**: Prisma schema contains the active database model set. Always inspect schema.prisma directly instead of relying on old table counts.

## 2. Documentation Trust Levels
- **Prisma Schema & Active Code**: The absolute source of truth. If documentation contradicts the `schema.prisma` or active codebase, the documentation is wrong.
- **Reference Docs**: Treat all files in `docs/`, `backend/docs/`, and `frontend/docs/` as references that may be outdated unless actively verified against the code.
- **2.1-ERD.md**: Historical/Outdated. Do not rely on it. It references MySQL and only 11 tables. Rely on `backend/prisma/schema.prisma` instead.
- **2.13-FINANCE.md**: Legacy finance documentation. Prefer the new `finance-v2` module docs and code.
- **V4 Design Documentation**: (`V4_DEPLOYMENT_SUMMARY.md`, `V4_IMPLEMENTATION_GUIDE.md`, etc.) V4 documentation must not be treated as implemented unless the referenced files exist in the active codebase and the user explicitly authorizes a V4 migration task.
- **Roadmap Files**: Root-level roadmap files such as `implementation_plan.md` and `page_detailed_mapping.md` are planning references only. Do not implement them unless the user explicitly activates that plan. 

## 3. UI/Design Rules (Frontend)
- Treat the active frontend as **V3 Glassmorphism** (Teal/Emerald gradients, `theme-noor.css`, `dashboard-v3.css`, Cairo font). 
- Do NOT attempt to use V4 Flat design components or tokens (e.g., `colors.css`, `ui/new/Button.tsx`) unless explicitly given a separate, approved V4 migration task. Those files do not currently exist.

## 4. Backend/API Rules
- Maintain the Controller-Service-Repository pattern.
- Respect strict RBAC (Role-Based Access Control) and platform boundaries. Supervisors cannot do Admin tasks; Admins cannot login to the mobile app.

## 5. Database/Prisma Rules
- Do NOT change the database provider from `postgresql`.
- Always validate the schema with `npx prisma validate` after any modifications.
- Prisma schema is the current implementation source of truth, but it is not automatically approved as the correct domain/database design. Database design must be audited later against requirements, normalization, relationships, constraints, workflows, reports, permissions, and finance rules.
- A passing `npx prisma validate` only proves that the Prisma schema is syntactically valid. It does not prove that the database design is academically correct, normalized, complete, or suitable for all business workflows.

## 6. Mobile Rules
- Verify paths before editing Flutter code. Older blueprints (`MOBILE_FUNCTIONAL_FIX_PLAN.md`) reference obsolete directories like `lib/presentation/follow_up/`.
- Active role-scoped directories exist under `lib/presentation/teacher/`, `lib/presentation/supervisor/`, etc.
- Maintain Clean Architecture and Riverpod state management patterns.

## 7. General Coding Rules
- Before implementing any roadmap, plan, or documentation instruction, verify that it is still active, current, and explicitly approved for the current task.
- Never modify unrelated files.
- Never delete working features or endpoints.
- Never create new `.md` documentation files without explicit user permission.

## 8. Reporting Format for Every Task
Before proposing or making any code changes, your response MUST include:
1. **What was inspected**: (Files, paths, schemas reviewed)
2. **What is wrong**: (The bug, drift, or missing feature)
3. **Proposed minimal change**: (How you will fix it)
4. **Files to be changed**: (Exact paths)
5. **How to test**: (Commands, API calls, or UI flows)
6. **Risks**: (Potential side effects on other modules)
