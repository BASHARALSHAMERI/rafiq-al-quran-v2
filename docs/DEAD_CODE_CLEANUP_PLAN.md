# DEAD CODE CLEANUP PLAN

## 1. Cleanup Goal
The primary objective is to purge the "Rafiq Al-Quran" project of all legacy, unused, temporary, and redundant files to improve maintainability, reduce build sizes, and clear technical debt without affecting active system logic.

## 2. Safety Rules
- **No Direct Deletion:** Audit and analyze first.
- **Verification First:** Only delete after proving the file is unused (no imports, no routes, no build dependencies).
- **Phased Approach:** Cleanup is executed in order from safest to most complex.
- **Validation:** Run system-wide validation (build, type-check, prisma) after each phase.
- **No Logic Changes:** Do not modify business logic, database schema, or migrations.
- **Platform Policy:** Maintain strict Web/Mobile separation.

## 3. Current Git Status
- **Branch:** `cleanup/dead-code-audit`
- **Short Status Summary:**
    - Multiple untracked artifacts (`.hprof`, `.log`, `.txt`) in `rafiq_mobile/android/` and `.runtime/`.
    - Multiple untracked CSS files in `frontend/src/styles/pages/`.
    - `my_changes.patch` found in `rafiq_mobile/`.

## 4. Cleanup Inventory

### Phase A: Artifacts & Temp Files
| Path | Type | Tracked? | Used by Code? | Safe to Delete? | Reason |
|------|------|----------|---------------|-----------------|--------|
| `rafiq_mobile/android/java_pid14372.hprof` | Crash Dump | No | No | Yes | Memory dump artifact |
| `rafiq_mobile/android/build_output.txt` | Build Log | No | No | Yes | Temporary build output |
| `rafiq_mobile/android/build_output_2.txt` | Build Log | No | No | Yes | Temporary build output |
| `.runtime/*.log` | Logs | No | No | Yes | Execution logs |
| `.runtime/*.png` | Screenshots | No | No | Yes | Test/Debug screenshots |
| `backend/.codex-temp/` | Temp Dir | No | No | Yes | AI temporary files |
| `rafiq_mobile/my_changes.patch` | Patch | No | No | Yes | Temporary patch file |

### Phase B: Untracked Source Candidates
| Path | Type | Tracked? | Used by Code? | Safe to Delete? | Reason |
|------|------|----------|---------------|-----------------|--------|
| `frontend/src/styles/pages/centers-v4.css` | CSS | No | No | Yes | Untracked legacy style |
| `frontend/src/styles/pages/circles-v4.css` | CSS | No | No | Yes | Untracked legacy style |
| `frontend/src/styles/pages/self-attendance-v1.css` | CSS | No | No | Yes | Untracked legacy style |

### Phase C: Web Legacy Route Cleanup
| File | Route Exists? | Imported? | Used in Sidebar? | Used in Build? | Candidate Action |
|------|---------------|-----------|------------------|----------------|------------------|
| `frontend/src/pages/TeacherPanelPage.tsx` | Yes (Redirect) | No | No | No | Remove safely |
| `frontend/src/styles/pages/teacher-panel.css` | N/A | No | N/A | No | Remove safely |

### Phase D: Backend Legacy Module Cleanup
| Module | Registered in Router? | Used by Frontend? | Used by Mobile? | DB Dependency? | Delete Risk | Recommendation |
|--------|-----------------------|-------------------|-----------------|----------------|-------------|----------------|
| `backend/src/modules/finance` | Optional (Legacy) | No | No | High | Medium | Defer (Phase D) |

### Phase F: CSS Cleanup (Tracked)
| CSS File | Imported? | Page/Component Using It | Duplicate With | Safe to Delete? |
|----------|-----------|-------------------------|----------------|-----------------|
| `frontend/src/styles/pages/centers-aurora.css` | Yes (index.css) | None (Modern used) | `centers-modern.css` | Yes |
| `frontend/src/styles/pages/v1/v2...` | No | None | N/A | Yes |

## 5. Phase-by-Phase Cleanup Roadmap

### Phase A — Safe Artifacts Cleanup
- **Target:** Logs, screenshots, crash dumps, temp folders.
- **Status:** COMPLETED ✅
- **Execution Log:**
    - Purged `.runtime/*.log`, `.runtime/*.png`, `.runtime/*.xml`.
    - Purged `rafiq_mobile/android/*.hprof`, `rafiq_mobile/android/build_output*.txt`.
    - Purged `rafiq_mobile/android/debug.log`, `rafiq_mobile/test_mobile.log`.
    - Deleted `backend/.codex-temp/`.
    - **Deferred:** `rafiq_mobile/my_changes.patch` (Moved to Manual Review).

### Phase B — Untracked Dead Source Cleanup
- **Target:** Untracked CSS and source files.
- **Status:** IN PROGRESS (B.1 Dependency Trace Matrix Created)
- **Execution Log:**
    - Performed safety audit of Phase A (Successful).
    - Inventoried untracked source files.
    - Created `docs/DEAD_CODE_TRACE_MATRIX.md` with full dependency analysis.
    - Protected essential untracked files (Certificates, LoadingState, Sync Service).
    - Identified `TeacherPanelPage` and legacy `finance` (web) as safe deletion candidates.

## 8. Phase B.0 — Untracked Source Inventory

| Path | Type | Tracked? | Imported? | Routed? | Build/Analyze Impact | Recommendation |
|------|------|----------|-----------|---------|-----------------------|----------------|
| `backend/src/modules/certificates/` | Backend Source | No | Yes | No | Required | Keep and track later |
| `frontend/src/features/certificates/` | Frontend Source | No | Yes | No | Required | Keep and track later |
| `frontend/src/components/ui/LoadingState.tsx` | Frontend Source | No | Yes | No | Required | Keep and track later |
| `rafiq_mobile/lib/application/sync/sync_queue_service.dart` | Flutter Source | No | Yes | No | Required | Keep and track later |
| `rafiq_mobile/lib/core/utils/data_parsing_helper.dart` | Flutter Source | No | Yes | No | Required | Keep and track later |
| `frontend/src/pages/TeacherPanelPage.tsx` | Frontend Source | No | No | Redir | None | Delete candidate |
| `backend/src/modules/finance/` | Backend Source | Yes | No | Optional | None | Defer (Phase D) |
| `frontend/src/styles/pages/night-day-enhancements.css` | CSS | No | Yes | N/A | Required | Keep and track later |
| `rafiq_mobile/my_changes.patch` | Patch files | No | N/A | N/A | None | Manual review |
| `frontend/src/pages/CenterAdminAttendancePage.tsx` | Frontend Source | No | No | No | None | Manual review |

### Phase B.0 Safety Check
- **Deleted Files (Tracked):** Only debug snapshots and logs in `.runtime/`.
- **Source Code Impact:** None (Legacy `follow_up` were already missing/D before cleanup, or are unused).
- **Validation:** All build/analyze checks PASSED.

### Phase C — Web Legacy Route Cleanup
- **Target:** `TeacherPanelPage` and related styles.
- **Status:** Planned.

### Phase D — Backend Legacy Module Cleanup
- **Target:** Legacy finance module (conditional).
- **Status:** Planned (Requires careful verification).

### Phase E — Flutter Legacy Cleanup
- **Target:** Verified unused views/providers.
- **Status:** Inventory in progress.

### Phase F — CSS Cleanup
- **Target:** Unimported/Duplicate CSS files.
- **Status:** Planned.

## 6. Validation Commands
After each phase, run:
1. `npx.cmd tsc --noEmit` (Backend)
2. `npm run build` (Frontend)
3. `flutter analyze --no-pub` (Mobile)
4. `npx.cmd prisma validate` (Database)

## 7. Final Cleanup Report

### Phase A Report
- **Files Deleted:** ~150+ (Mostly snapshots/logs in `.runtime`).
- **Source Code Deleted?** No.
- **Migrations/DB Deleted?** No.
- **Storage/Images Deleted?** No.
- **Validation Results:**
    - Backend TSC: Pass ✅
    - Frontend Build: Pass ✅
    - Mobile Analyze: Pass ✅
    - Prisma Validate: Pass ✅
- **Manual Review Additions:**
    - `rafiq_mobile/my_changes.patch` (Deferred for inspection).
