# DEAD CODE TRACE MATRIX

## 1. Goal
To provide a comprehensive mapping of all untracked, legacy, and suspicious files in the "Rafiq Al-Quran" project to determine their usage status and safety for future removal or tracking.

## 2. Safety Rules
- **DO NOT DELETE ANY FILES** during this phase.
- Verification must include: imports, routes, API usage, and build dependencies.
- If a file is imported or referenced anywhere in the active code, it must be marked as **Active** or **Protected**.

## 3. Protected Untracked Files
| File | Why Protected | Evidence of Use | Should Track Later? | Notes |
|------|---------------|-----------------|---------------------|-------|
| `backend/src/modules/certificates/` | Essential module | Imported by exams/golden-records | Yes | Critical for printing |
| `frontend/src/features/certificates/` | Essential feature | Imported by web pages | Yes | Critical for printing |
| `frontend/src/components/ui/LoadingState.tsx` | Essential UI | Imported by 10+ pages | Yes | Core UI component |
| `rafiq_mobile/lib/application/sync/sync_queue_service.dart` | Essential Sync | Imported by controllers | Yes | Offline sync logic |
| `rafiq_mobile/lib/core/utils/data_parsing_helper.dart` | Essential Helper | Imported by 15+ files | Yes | Data mapping logic |
| `frontend/src/styles/pages/night-day-enhancements.css` | Theme styles | Imported in index.css | Yes | UX enhancements |
| `frontend/src/styles/pages/self-attendance-v1.css` | Attendance UI | Imported in page | Yes | New UI implementation |

## 4. Tracing Matrix (Candidates & Suspicious Files)

| Candidate | Type | Route Registered? | Imported? | Referenced by API? | Used by Tests? | Build Needs It? | Runtime Risk | Decision | Evidence |
|-----------|------|-------------------|-----------|--------------------|----------------|-----------------|--------------|----------|----------|
| `frontend/src/pages/TeacherPanelPage.tsx` | Page | Redir (403) | No | No | No | No | Low | Delete Candidate | Confirmed: Redirected in router.tsx, zero imports in active code |
| `frontend/src/features/teacher-panel/` | Feature | No | No | No | No | No | Low | Delete Candidate | Only imported by TeacherPanelPage |
| `backend/src/modules/finance/` | Backend Mod | Yes (Optional) | No | No | No | No | Med | Defer (Phase D) | Used by finance-deduction (Active), but main routes behind FINANCE_LEGACY_ENABLED |
| `frontend/src/features/finance/` | Feature | No | No | No | No | No | Low | Delete Candidate | Confirmed: superseded by finance-v2, no imports in FinancePage |
| `CenterAdminsPage.tsx` | Page | No | No | No | No | No | Med | Manual Review | Not in router.tsx, but exists in pages. Likely new or legacy |
| `TeachersPage.tsx` | Page | Yes | Yes | Yes | No | Yes | High | Active / Keep | Confirmed in router.tsx (line 59) |
| `SupervisorsPage.tsx` | Page | Yes | Yes | Yes | No | Yes | High | Active / Keep | Confirmed in router.tsx (line 61) |
| `StudentsPage.tsx` | Page | Yes | Yes | Yes | No | Yes | High | Active / Keep | Confirmed in router.tsx (line 58) |
| `ActivateAccountPage.tsx` | Page | Yes | Yes | Yes | No | Yes | High | Active / Keep | Confirmed in router.tsx (line 90) |
| `rafiq_mobile/my_changes.patch` | Patch | N/A | N/A | N/A | N/A | No | None | Manual Review | Contains SQL/Schema backups (AccountStatus already in DB) |
| `rafiq_mobile/lib/presentation/follow_up/` | Flutter Legacy | No | No | No | No | No | Low | Delete Candidate | Confirmed: Legacy path (v2 is in presentation/teacher/follow_up) |

## 5. Patch File Analysis

| Patch File | Files Mentioned | Seems Applied? | Risk if Deleted | Decision |
|------------|-----------------|----------------|-----------------|----------|
| `my_changes.patch` | `follow_up_records`, `exam_module_nomination_workflow` | Partially | High (Data loss) | Manual Review |

## 6. Conclusion & Roadmap
- **Active Files:** All standard management pages and new untracked components.
- **Protected Files:** Certificates module and sync services.
- **Legacy Files:** Teacher panel and Finance v1 (web).
- **Safe for deletion later:** `TeacherPanelPage` and `features/teacher-panel`.
