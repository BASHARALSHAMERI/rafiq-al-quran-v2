# سجل الاعتماد النهائي — `github-main` vs `origin/main`

**تاريخ:** 2026-06-05  
**ملفات التغيير:** 185 (37 A / 147 M / 1 D)  
**commits:** 23

---

## 1. SAFE_DELETE — التحقق الفردي بالأدلة

### 1.1 `e2e-test.mjs` (A)

| دليل | القيمة |
|------|--------|
| imports مباشرة | **0** — `grep "from.*e2e-test"` عبر `backend/src` + `frontend/src` → صفر |
| imports ديناميكية | **0** — لا يوجد `import()` أو `require()` يشير إليه |
| مراجع عبر grep | **0** — `grep "e2e-test"` عبر `*.json,*.yml,*.md,*.ts,*.js` → صفر (عدا هذا التقرير) |
| build / test / CI | **لا** — غير مُدرج في أي `package.json` script أو `.github/workflows` |
| تأثير على route / page / API / migration | **لا** — standalone script |
| نتيجة | **SAFE_DELETE** ✅ |

### 1.2 `backend/scripts/validate-yemen-config.ts` (A)

| دليل | القيمة |
|------|--------|
| imports مباشرة | **0** — `grep "validate-yemen-config"` عبر `backend/src` → صفر |
| imports ديناميكية | **0** |
| مراجع عبر grep | **0** — لا يوجد في أي `package.json` script |
| build / test / CI | **لا** — غير مُدرج في أي script |
| تأثير على route / page / API / migration | **لا** — standalone script |
| نتيجة | **SAFE_DELETE** ✅ |

### 1.3 `backend/src/queues/MIGRATION_GUIDE.md` (A)

| دليل | القيمة |
|------|--------|
| imports / references | **0** — `grep "MIGRATION_GUIDE"` عبر كامل ال repo → صفر (عدا هذا التقرير) |
| build / test / CI | **لا** |
| تأثير | **لا** — وثيقة stub لا تُشير إليها أي شيء |
| نتيجة | **SAFE_DELETE** ✅ |

### 1.4 `frontend/tests/README.md` (A)

| دليل | القيمة |
|------|--------|
| imports / references | **0** — `grep "tests/README"` عبر كامل ال repo → صفر (عدا هذا التقرير) |
| build / test / CI | **لا** |
| تأثير | **لا** |
| نتيجة | **SAFE_DELETE** ✅ |

### 1.5 `frontend/src/features/attendance/components/SelfAttendanceWidget.tsx` (M)

| دليل | القيمة |
|------|--------|
| imports مباشرة | **0** — `grep "SelfAttendanceWidget"` عبر `frontend/src` (308+ ملف) → **1 match فقط**: الملف نفسه |
| imports ديناميكية | **0** — لا يوجد `React.lazy` أو `import()` يشير إليه |
| مراجع عبر grep | **0** — لا يوجد في أي route-meta أو router config |
| build / test / CI | **لا** — لا يُستورد |
| تأثير على route / page / API / migration | **لا** — خارج سلسلة الاعتماد |
| diff بين origin/main..github-main | **line endings فقط** (CRLF) — لا يوجد تغيير منطقي |
| نتيجة | **SAFE_DELETE** ✅ |

**سلسلة الاعتماد الفعلية للحضور الذاتي:**

```
router.tsx (lazy import + route mapping "self_attendance")
  ↓
SelfAttendancePage.tsx (export default)
  ↓
SelfAttendanceView.tsx (import { SelfAttendanceView })
```

**الدليل:** `grep "SelfAttendancePage"` → 3 matches: `router.tsx` (2), `SelfAttendancePage.tsx` (1).  
**الدليل:** `grep "SelfAttendanceView"` → 3 matches: `SelfAttendancePage.tsx` (2), `SelfAttendanceView.tsx` (1).  
**الدليل:** `grep "SelfAttendanceWidget"` → 1 match: `SelfAttendanceWidget.tsx` فقط.

`SelfAttendanceWidget.tsx` **لا يشارك في أي Route أو Component أو Test**.

---

## 2. `finance-v2.helpers.ts` — ليس جزءاً من التغييرات لكنه دَين تقني

**الحقيقة:** `git diff --name-status origin/main..github-main` **لا يُدرجه** (لم يتغيّر بين الفرعين).  
**الحقيقة:** `git ls-tree origin/main -- finance-v2.helpers.ts` → موجود في `origin/main`.  
**الحقيقة:** `grep "finance-v2\.helpers"` عبر `backend/src` → **0 imports**.

### 2.1 مقارنة دقيقة مع `finance-v2.internal.ts`

| الدالة | موجودة في `helpers.ts` | موجودة في `internal.ts` | نسبة التطابق |
|--------|----------------------|------------------------|--------------|
| `normalizeDecimals` | ✅ | ✅ | **100%** |
| `normalize` | ✅ | ✅ | **100%** |
| `isKnownPrismaError` | ✅ | ✅ | **100%** |
| `mapUniqueConflict` | ✅ | ✅ | **100%** |
| `parseIdempotencyKey` | ✅ | ✅ | **100%** |
| `calcInvoiceTotals` | ✅ | ✅ | **100%** |
| `withInvoiceTotals` | ✅ | ✅ | **100%** |
| `ensureDate` | ✅ | ✅ | **100%** |
| `requireFinanceEntity` | ✅ | ✅ | **100%** |
| `ensureVoucherScope` | ✅ | ✅ | **100%** |
| `ensureFinanceCenter` | ✅ | ✅ | **100%** |
| `ensureFinanceStudent` | ✅ | ✅ | **100%** |
| `deriveBatchStatus` | ✅ | ✅ | **100%** |
| `addAudit` | ✅ | ✅ | **100%** |
| `nextVoucherNo` | ✅ | ❌ (بدلاً منها `nextVoucherNoTx`) | **0%** — دالة مختلفة تماماً (بدون tx) |

**الدوال في `internal.ts` وغير موجودة في `helpers.ts`:**
- `deriveRewardBatchStatus`, `nextVoucherNoTx`, `assertTransferAttachment`, `resolveVoucherMovementType`, `ensureOrgFundAccountTx`, `ensureCenterFundAccountTx`, `ensureAccountLockTx`, `ensureInvoiceLockTx`

### 2.2 الحكم

- **14/15 دالة** في `helpers.ts` مُكرّرة في `internal.ts` بنسبة **100%**.
- `internal.ts` هو الملف المُستورد فعلياً (8 services).
- `helpers.ts` **لا يُستورد من أي مكان** عبر كامل `backend/src`.

**النتيجة:** ملف ميت. يُنصح بحذفه.  
**التصنيف:** `REFACTOR_LATER` (technical debt في `origin/main`) — **ليس جزءاً من التغييرات** لكن يجب تسجيله.

---

## 3. Working Directory — 6 ملفات مُعدّلة

| # | الملف | التغيير | النوع | الحكم |
|---|-------|---------|-------|-------|
| 1 | `supervisor-visit.validation.ts` | إضافة `nullablePositiveId` + ترجمة رسائل `positiveId` + تعديل `circleId` من `optional()` إلى `nullablePositiveId` | **إصلاح** — يُصلح validation bug عند `circleId = null` | **COMMIT_NOW** |
| 2 | `DonationFormModal.tsx` | إضافة `useEffect` مع `notifyInfo` × 2 (توضيح آلية العملة + سند القبض) | **UX** — رسائل إرشادية | **COMMIT_NOW** |
| 3 | `FinanceTreasuryTab.tsx` | نقل رسالة التحويل من JSX إلى `notifyInfo` + إخفاء `<div>` | **UX** — تحسين عرض | **COMMIT_NOW** |
| 4 | `VisitPlanManagement.tsx` | إضافة `<PlanDetailsModal>` + تعديلات طفيفة في JSX | **ميزة** — نافذة تفاصيل خطة الزيارة | **COMMIT_NOW** |
| 5 | `CirclesPage.tsx` | تغيير `isTeacher` من `false` ثابت إلى `user?.role === "TEACHER"` + `notifyInfo` + إزالة Banner JSX | **إصلاح** — يُصلح شرط عرض خاطئ | **COMMIT_NOW** |
| 6 | `FinanceCurrenciesPage.tsx` | إضافة `useEffect` مع `notifyInfo` + `sessionStorage` (دليل استخدام العملات) | **UX** — دليل استخدام لمرة واحدة | **COMMIT_NOW** |

**الملاحظة:** جميع التعديلات الستة تعتمد على `notifyInfo` من `shared/ui/feedback` وهو موجود وفعّال. لا يوجد أي تعديل يحتاج إلغاء.

---

## 4. `ci.yml` — فحص DIRECT_URL

### 4.1 الحالة الحالية

```yaml
env:
  DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci"
```

### 4.2 الحالة المطلوبة

`backend/prisma/schema.prisma` السطر 8:
```prisma
directUrl = env("DIRECT_URL")
```

`backend/package.json` يحدد `prisma@^6.15.0`.  
Prisma 6 يتطلب `DIRECT_URL` عند وجود `directUrl` في schema.

### 4.3 النتيجة

- `npx prisma validate` في CI **سيفشل فوراً** مع:
  ```
  Error: Environment variable not found: DIRECT_URL.
  ```
- هذا ليس تخميناً — `prisma validate` يتحقق من جميع `env()` في schema.

### 4.4 التعديل المطلوب (دون تنفيذ)

```yaml
env:
  DATABASE_URL: "postgresql://ci:ci@localhost:5432/ci"
  DIRECT_URL: "postgresql://ci:ci@localhost:5432/ci"
```

---

## 5. الجدول النهائي

### KEEP_FINAL (يُعتمد — مبني على سلاسل الاعتماد)

| # | البند | سلسلة الاعتماد |
|---|-------|---------------|
| 1 | Prisma Schema + 3 Migrations | `schema.prisma` → `prisma generate` → `@prisma/client` → كل الـ services |
| 2 | i18n Backend (`shared/i18n/`) | `app.ts:14` (localeMiddleware) → `error.middleware.ts:6` (t, messages) → 23+ service |
| 3 | CENTER_ADMIN Scope Isolation | `scope.domain.ts` → `scope.middleware.ts` → `router.ts` → 12+ domain/service |
| 4 | Health Endpoint | `health.ts` → `router.ts:45` → Express app |
| 5 | Reports Module | `reports.routes.ts` → `router.ts:60` → `reports.service.ts` (1629 سطر) |
| 6 | Staff Attendance Module | `staff-operations.routes.ts` → `router.ts:24,66` → `staff-operations.service.ts` |
| 7 | Auth Fixes | `auth.service.ts` → `auth.routes.ts` → `router.ts` + `session.ts` → `auth.store.ts` |
| 8 | Lazy Router | `router.tsx` → `App.tsx` → 25+ lazy page |
| 9 | Self-Attendance Page | `router.tsx:26,83` → `SelfAttendancePage.tsx` → `SelfAttendanceView.tsx` |
| 10 | Frontend I18n | `http.ts` → `error.ts` → كل الـ API calls |
| 11 | Finance v2 (backend) | `finance-v2.internal.ts` → 8 services → `router.ts` |
| 12 | Finance v2 (frontend) | `finance-v2.hooks.ts` → 34 query مع `keepPreviousData` → كل الـ pages |
| 13 | Topbar Premium Fix | `TopbarPremium.tsx` → `AppLayout.tsx` |
| 14 | Org Module (Geo) | `org.routes.ts` → `router.ts` → `Center` model (lat/lng/radius) |
| 15 | Mobile Flutter Updates | `app_router.dart` → 19 ملف (teacher plan, supervisor ops, student report) |
| 16 | `jest.config.js` + `vitest.config.ts` | build pipeline |
| 17 | `pageAnimations.ts` | `fadeUp`, `stagger` → كل الـ pages |

### SAFE_DELETE (أدلة صفرية على الاستخدام)

| # | الملف | الدليل |
|---|-------|--------|
| 1 | `e2e-test.mjs` | 0 imports / 0 references / 0 scripts |
| 2 | `validate-yemen-config.ts` | 0 imports / 0 references / 0 scripts |
| 3 | `MIGRATION_GUIDE.md` | 0 references |
| 4 | `frontend/tests/README.md` | 0 references |
| 5 | `SelfAttendanceWidget.tsx` | 0 imports عبر 308+ ملف. خارج سلسلة `router → page → view`. diff = line endings فقط |

### COMMIT_NOW (Working Directory — جاهزة)

| # | الملف | السبب |
|---|-------|-------|
| 1 | `supervisor-visit.validation.ts` | إصلاح `circleId` nullable + ترجمة رسائل |
| 2 | `DonationFormModal.tsx` | UX: إرشادات العملة |
| 3 | `FinanceTreasuryTab.tsx` | UX: notifyInfo للتحويل |
| 4 | `VisitPlanManagement.tsx` | Feature: PlanDetailsModal |
| 5 | `CirclesPage.tsx` | إصلاح: `isTeacher` كان `false` ثابت |
| 6 | `FinanceCurrenciesPage.tsx` | UX: دليل استخدام العملات |

### INVESTIGATE_FIRST

| # | البند | السبب | التعديل المطلوب |
|---|-------|-------|----------------|
| 1 | **CI `DIRECT_URL`** | `schema.prisma:8` يتطلب `DIRECT_URL`. `ci.yml` لا يُعيّنه. `npx prisma validate` سيفشل. | إضافة `DIRECT_URL: "postgresql://ci:ci@localhost:5432/ci"` إلى `ci.yml:13` |
| 2 | **Prisma 6 vs 7** | `package.json` يحدد `prisma@^6.15.0`. `npx prisma --version` على الجهاز = `7.8.0`. هل CI سيُثبّت 6 أم 7؟ | تأكد من `package-lock.json` يقفل على 6.x. إذا كان CI يُثبّت 7، فالـ `url`/`directUrl` في schema ستُعطي `P1012`. |

### REFACTOR_LATER

| # | البند | السبب |
|---|-------|-------|
| 1 | `reports.service.ts` (1629 سطر) | ضخم. يجمع 12 نوع تقرير. لا يؤثر على الاستقرار. |
| 2 | `staff-operations.service.ts` (2054 سطر) | أكبر service. يجمع ~5 domains. لا يؤثر على الاستقرار. |
| 3 | `accounting.service.ts` (1877 سطر) | يجمع بين ledger + journal + trial balance. لا يؤثر على الاستقرار. |
| 4 | `finance-v2.helpers.ts` | **ليس جزءاً من التغييرات** — ملف ميت مُكرّر في `origin/main` (14/15 دالة = 100% match مع `internal.ts`). يجب حذفه خارج سياق هذا الفرع. |
| 5 | `auth.service.test.ts` | 7 assertions قديمة — i18n string mismatch. لا تُعطل build. |

---

## 6. الملاحظات الحاسمة

1. **لا يوجد `ROLLBACK`.** كل التعديلات إما إصلاحات حقيقية أو إضافات نظامية.
2. **`finance-v2.helpers.ts` ليس جزءاً من `github-main`.** هو دَين تقني في `origin/main` مُؤكد. يُحذف خارج هذا الفرع.
3. **CI Blocker حاسم:** `DIRECT_URL` مفقود في `.github/workflows/ci.yml`. `prisma validate` سيفشل فوراً.
4. **Prisma 7 Threat:** إذا كان CI يُثبّت Prisma 7 (عبر `npx` بدون `package-lock.json` دقيق)، فالـ `url`/`directUrl` في schema ستُعطي `P1012` (`url is no longer supported`). يجب تأكيد lockfile.

---

*نهاية السجل*
