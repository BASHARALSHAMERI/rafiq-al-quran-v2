# FINANCE & ACCOUNTING ROADMAP
## رفقاء القرآن — خارطة طريق الشؤون المالية والمحاسبة

---

## FA-UX-3A — Voucher Void Journal Reversal
**التاريخ:** 2026-05-04  
**النوع:** إصلاح ثغرة محاسبية (backend-only، بدون schema change)

### الثغرة التي عولجت:
- عند اعتماد عكس السند (`approveVoucherVoid`) كان يتم إنشاء `FinanceAccountMovement` عكسي عبر `postVoucherTx(movementType=VOID_REVERSAL, reversalOfMovementId=…)`، لكن **لم يكن يُنشأ أي `JournalEntry` عكسي في دفتر الأستاذ**.
- النتيجة: الـ`JournalEntry` الأصلي يبقى `POSTED` في Ledger و Trial Balance، ويظهر الأثر المحاسبي للسند الملغى وكأنه ما زال ساريًا، رغم أن حركة الصندوق عُكست. هذا يكسر توافق Ledger مع FinanceAccountMovement ويُفقد Trial Balance المعنى الصحيح عند وجود سندات ملغاة.

### نقطة التنفيذ:
- ملف backend واحد إضافي:
  - `backend/src/modules/accounting/accounting.service.ts`: إضافة method جديد `reverseVoucherJournalEntryTx`.
  - `backend/src/modules/finance-v2/services/accounting.service.ts`: استدعاء الـmethod الجديد داخل `approveVoucherVoid`، مباشرة بعد `postVoucherTx` للسند العكسي.

### كيف يتم إنشاء القيد العكسي:
- يتم جلب الـ`JournalEntry` الأصلي عبر المفتاح `(organizationId, sourceType=VOUCHER, sourceId=originalVoucherId)`.
- إذا لم يوجد (مثلاً السند مصدره `PAYMENT` وقيده تحت `sourceType=PAYMENT`)، تُرجَع `null` بأمان بدون كسر العملية.
- إذا كان الأصلي `POSTED`، يتم إنشاء `JournalEntry` جديد بحالة `POSTED` يحمل:
  - `entryNo = REV-<orgId>-<reversalVoucherId>`
  - `sourceType = VOUCHER`, `sourceId = reversalVoucher.id` (مختلف عن السند الأصلي)
  - `description = Reversal of journal entry <originalEntryNo> for voided voucher`
- تُنسخ سطور الأصلي واحدًا بواحد مع **تبديل debit ↔ credit** فقط، مع الاحتفاظ بنفس الحسابات والمبالغ والـcenterId.
- القيد الأصلي **لا يتم تعديله ولا حذفه ولا تغيير حالته**.

### كيف يتم منع double reversal:
- `@@unique([organizationId, sourceType, sourceId])` الموجود أصلًا على `JournalEntry` يضمن عدم إمكان إنشاء أكثر من قيد عكسي واحد لنفس `reversalVoucher.id`.
- يوجد فحص idempotency صريح أيضًا: لو استُدعي الـmethod مرتين، الثانية ترى الإدخال الأول وتُعيده بدلًا من إنشاء ثانٍ.
- على مستوى التدفق الأعلى، `assertVoucherTransition` يمنع أصلًا تكرار اعتماد void لنفس السند (لا ينتقل إلى VOIDED مرتين).

### كيف بقيت الحركات المالية ودفتر الأستاذ متسقة:
- كل سطر عكسي هو نفس `accountId` و نفس المبلغ بالعكس، فمجموع debit الجديد = مجموع credit الأصلي والعكس، أي السطور متوازنة ذاتيًا.
- لأن الأصلي متوازن والعكس متوازن، Trial Balance يبقى متوازنًا بعد الـvoid.
- Ledger لأي حساب يعرض الحركة الأصلية + الحركة المعاكسة → صافي الأثر صفر للحساب المنتهي، مع بقاء التتبع الكامل للسجل الأصلي.
- `FinanceAccountMovement` لم يُمس: يبقى سجلَّا للأرصدة النقدية الفعلية؛ تعديلنا يعيد تنسيق الـ General Ledger مع نفس الحقيقة.

### الحدود التي تم احترامها:
- لا تعديل على `schema.prisma`.
- لا migration جديدة.
- لا seed.
- لا تغيير على frontend أو Flutter أو الشهادات.
- لا تغيير على منطق ترحيل الدفعات `postPaymentJournalEntryTx` ولا على `postReceiptVoucherJournalEntryTx` ولا على `postDisbursementVoucherJournalEntryTx` — كلها بقيت كما هي.
- التعديل في `approveVoucherVoid` اقتصر على إضافة استدعاء واحد بعد `postVoucherTx` (لا تغيير على منطق الـposting نفسه).

### نتائج التحقق:
- Backend `npx.cmd prisma validate`: نجح (exit 0).
- Backend `npx.cmd tsc --noEmit`: نجح (exit 0).
- Frontend `npm run build`: نجح (exit 0).
- Frontend `npx.cmd tsc --noEmit`: نجح (exit 0).

---

## FA-UX-2 — Donors & Donations Polish
**التاريخ:** 2026-05-04  
**النوع:** تحسين UX للمتبرعين والتبرعات (frontend-only، بدون schema change)

### المشكلة التي عولجت:
- عند استلام تبرع أو استلام تعهد، يُنشأ `FinanceVoucher` من نوع `RECEIPT` بتصنيف `DONATION` وحالة `DRAFT`، لكن **المستخدم لا يُنبَّه بوضوح** أن السند يحتاج مراجعة وترحيل لاحقًا حتى يظهر أثره المحاسبي.
- النتيجة: مستخدم يعتقد أن التبرع "تم" بينما القيد المحاسبي غير موجود، ويستغرق وقتًا لاكتشاف أنه يحتاج الذهاب إلى صفحة السندات وترحيل السند.

### ما تم تحسينه:

#### 1. بانر توضيحي ديناميكي في نافذة إضافة تبرع (`DonationFormModal`)
- عند اختيار "مستلم الآن": يظهر بانر أزرق يوضح أنه سيتم إنشاء سند قبض كمسودة وأن الأثر المحاسبي يتطلب ترحيل السند لاحقًا.
- عند اختيار "تعهد": يظهر بانر يوضح أنه لن يُنشأ سند أو قيد حتى يتم استلام التعهد.

#### 2. إضافة حقل "شخص التواصل" في نافذة إضافة متبرع (`DonorFormModal`)
- حقل اختياري مخصص للمؤسسات والجهات لتحديد اسم الشخص المسؤول عن التواصل.
- يستخدم أيقونة `UserCheck` ويظهر في قسم بيانات التواصل.

#### 3. رسائل نجاح محسّنة مع رقم السند
- عند إنشاء تبرع مستلم: تظهر رسالة توضح أنه تم إنشاء سند قبض كمسودة مع ذكر `voucherNo` إن وُجد.
- عند استلام تعهد: نفس النمط — رسالة واضحة تحتوي رقم السند وتذكير بضرورة ترحيله.

#### 4. تنبيه أعلى الصفحة لسندات بانتظار الترحيل
- يُحسب عدد التبرعات التي لديها `voucher.status === "DRAFT"`.
- إذا كان العدد > 0: يظهر تنبيه برتقالي "تبرعات بانتظار ترحيل السند: X" مع زر رابط إلى صفحة السندات.
- إذا كان العدد = 0: يظهر بانر أزرق معلوماتي يشرح آلية عمل التبرعات والسندات.

#### 5. تحسين عمود "حالة السند" في جدول التبرعات
- بدلًا من عرض رقم السند فقط، يُعرض badge ملون حسب الحالة:
  - `DRAFT`: برتقالي — "السند — مسودة (لم يُرحّل بعد)"
  - `POSTED`: أخضر — "السند — مرحّل"
  - غير ذلك: رمادي — "راجع صفحة السندات"
- للتبرعات المستلمة بدون سند (حالة نادرة): "لم يتم الاستلام بعد"
- للتبرعات الملغاة: "ملغي"

#### 6. تحسين جدول التعهدات بـ badges متأخر/قريب
- يُحسب تاريخ الاستحقاق مقارنة باليوم.
- إذا فات تاريخ الاستحقاق: badge أحمر "متأخر".
- إذا كان خلال 7 أيام: badge برتقالي "قريب".

#### 7. تحسين Modal استلام التعهد
- العنوان الفرعي يوضح العملية كاملة.
- قائمة خطوات داخل الـmodal تشرح ما سيحدث:
  1. تحويل التعهد إلى تبرع مستلم.
  2. إنشاء سند قبض كمسودة مرتبط بالتبرع.
  3. عدم إنشاء قيد محاسبي مباشرة.
  4. ظهور الأثر المحاسبي فقط عند ترحيل السند لاحقًا.
- زر الاستلام يصبح: "استلام التعهد وإنشاء السند" (أو نصه بالإنجليزية).

### الحدود التي تم احترامها:
- ✅ لا تعديل على `schema.prisma`.
- ✅ لا migration جديدة.
- ✅ لا seed.
- ✅ لا تعديل على backend (الـresponse يحتوي `voucher.status` أصلًا في `donationSelect`).
- ✅ لا تغيير على منطق ترحيل السندات أو القيود.
- ✅ لا تغيير على Payment Posting أو Void Reversal.
- ✅ لا تعديل على Flutter أو صور الشهادات.
- ✅ المصطلحات صحيحة: "المتبرعون والتبرعات" (صفحة المكافآت القديمة تستخدم "المكافآت والداعمين" لكنها صفحة منفصلة ولم تُعدَّل).

### التأكيدات المحاسبية:
- Donation لا ينشئ `JournalEntry` مباشرة — القيد ينشأ عند ترحيل سند القبض.
- التبرع المستلم ينشئ `FinanceVoucher` نوع `RECEIPT` بحالة `DRAFT` — لا يُرحّل تلقائيًا.
- التعهد لا ينشئ أي سند حتى يتم استلامه.
- كل التحسينات UX فقط لتوضيح هذه الحقائق للمستخدم.

### نتائج التحقق:
- Backend `npx.cmd prisma validate`: نجح (exit 0).
- Backend `npx.cmd tsc --noEmit`: نجح (exit 0).
- Frontend `npm run build`: نجح (exit 0).
- Frontend `npx.cmd tsc --noEmit`: نجح (exit 0).

---

## FA-UX-3B — Rewards Terminology and Financial Reports Center
**التاريخ:** 2026-05-04  
**النوع:** تصحيح مصطلحي + تنظيم مركز التقارير (frontend-only، بدون schema change)

### المشكلة التي عولجت:
- صفحة المكافآت (`FinanceRewardsPage`) كانت تستخدم عنوانًا مربكًا: "المكافآت والداعمين" / "Donations & Rewards" ووصفًا: "إدارة التبرعات والمكافآت المالية" — مما يخلط بين المكافآت (للمعلمين/الطلاب) والتبرعات (من المتبرعين).
- مركز التقارير المالية (`/reports`) كان يعرض تقرير FINANCE فقط بدون توضيح محتواه (الفواتير والتحصيل) وبدون روابط سريعة للتقارير المالية الأخرى المنتشرة في `/finance/*`.

### ما تم تحسينه:

#### 1. تصحيح مصطلحات صفحة المكافآت (`FinanceRewardsPage.tsx`)
- العنوان أصبح: "المكافآت" / "Rewards" (بدون "والداعمين").
- الوصف أصبح: "إدارة مكافآت المعلمين والطلاب حسب الدورات والفترات المعتمدة" / "Manage teacher and student rewards by approved cycles and periods".
- لا تغيير في منطق RewardProfile أو RewardBatch — فقط تصحيح UX.

#### 2. تحسين وصف تقرير FINANCE في ReportsPage
- الوصف السابق: "عرض تفصيلي مع مؤشرات الأداء" — غير واضح.
- الوصف الجديد: "الفواتير والتحصيل والمبالغ المستحقة" / "Invoices, collections, and amounts due" — يوضح المحتوى الفعلي للتقرير.

#### 3. إضافة روابط سريعة للتقارير المالية والمحاسبية (`ReportsPage.tsx`)
- قسم جديد: "التقارير المالية والمحاسبية" / "Financial & Accounting Reports".
- 8 روابط سريعة:
  - تقرير الفواتير → `/finance/invoices`
  - تقرير التحصيل → `/finance/payments`
  - تقرير السندات → `/finance/vouchers`
  - تقرير التبرعات → `/finance/donors`
  - تقرير المكافآت → `/finance/rewards`
  - دفتر الأستاذ → `/finance/accounting/ledger`
  - ميزان المراجعة → `/finance/accounting/trial-balance`
  - شجرة الحسابات → `/finance/accounting/accounts`
- الروابط لا تكرر الصفحات — بل تُسهّل الوصول إليها من مركز التقارير.

#### 4. CSS للروابط السريعة (`reports-v5.css`)
- تصميم متناسق مع البطاقات الموجودة.
- تأثير hover بسيط (رفع + ظل).
- أيقونات ملونة بنفسجية.
- دعم RTL.

### الحدود التي تم احترامها:
- ✅ لا تعديل على `schema.prisma`.
- ✅ لا migration جديدة.
- ✅ لا seed.
- ✅ لا تعديل على backend.
- ✅ لا تغيير على منطق المكافآت أو التقارير.
- ✅ لا تعديل على Flutter أو صور الشهادات.
- ✅ لا بيانات وهمية — الروابط فقط توجه للصفحات الحقيقية.
- ✅ صفحات المحاسبة (`/finance/accounting/*`) بقيت في مكانها — لم تُنقل.

### التأكيدات المصطلحية:
- صفحة المكافآت: "المكافآت" فقط — لا داعمين ولا تبرعات.
- صفحة المتبرعين: "المتبرعون والتبرعات" — لا علاقة لها بالمكافآت.
- لا يوجد خلط بين المصطلحات بعد التصحيح.

### نتائج التحقق:
- Backend `npx.cmd prisma validate`: نجح (exit 0).
- Backend `npx.cmd tsc --noEmit`: نجح (exit 0).
- Frontend `npm run build`: نجح (exit 0).
- Frontend `npx.cmd tsc --noEmit`: نجح (exit 0).

---

## FA-6.1 — Core Finance Modals Foundation
**التاريخ:** 2026-05-03  
**النوع:** واجهات تشغيل مالية ومحاسبية محدودة + Backend محدود للحسابات

### ماذا تم إضافته:
- إضافة نافذة `إضافة حساب` ونافذة `تعديل حساب` في شجرة الحسابات.
- إضافة نافذة `قيد محاسبي جديد` في القيود اليومية مع حفظ كمسودة وحفظ وترحيل.
- تحسين نافذة إنشاء فاتورة طالب لتشمل الطالب، نوع الفاتورة، المبلغ، تاريخ الاستحقاق، المركز، الوصف، والملاحظات.
- تحسين نافذة السندات لتدعم `سند صرف جديد` كمصروف عبر سند صرف، بدون إنشاء صفحة مصروفات مستقلة.

### النوافذ الجديدة/المحسنة:
- `AccountingAccountsPage`: إضافة/تعديل حساب مع الحساب الأب واقتراح رقم فرعي.
- `AccountingJournalEntriesPage`: إنشاء قيد يدوي مع سطور مدين/دائن ومؤشر التوازن.
- `FinanceInvoicesTab`: إنشاء فاتورة طالب محسنة.
- `FinanceVouchersTab`: سند صرف جديد مع التصنيف المحاسبي وطريقة الدفع والوصف.

### Endpoints المستخدمة:
- `GET /accounting/accounts`
- `POST /accounting/accounts`
- `PATCH /accounting/accounts/:id`
- `GET /accounting/journal-entries`
- `POST /accounting/journal-entries`
- `POST /accounting/journal-entries/:id/post`
- `POST /finance/v2/invoices`
- `POST /finance/v2/vouchers`
- `POST /finance/v2/vouchers/:id/post`

### هل أضيف Backend؟
- نعم، بشكل محدود للحسابات المحاسبية فقط لأن إنشاء/تعديل الحساب لم يكن موجودًا.
- تمت إضافة تحقق backend للحساب الأب ونوع الحساب ومنع استخدام الحسابات الرئيسية ذات الأبناء في سطور القيود.
- لم يتم تغيير منطق ترحيل Payment/Voucher؛ backend ما زال مسؤولًا عن إنشاء قيود السندات عند POST.

### ما بقي مؤجلًا:
- الرصيد الافتتاحي، الاسم الإنجليزي، الملاحظات التفصيلية للحساب، وفلاغ `يسمح بالترحيل` لا تملك أعمدة مستقلة في `AccountingAccount` حاليًا؛ أضيفت في واجهة التأسيس بدون schema change.
- عكس القيود اليدوية وتعديل القيود المرحلة مؤجلان.
- أنواع فواتير اختبار/كتب تحفظ عبر نوع `OTHER` لأن enum الحالي لا يحتوي أنواعًا منفصلة لها.

### حدود المرحلة:
- لم يتم تنفيذ Donors أو Donations (تم في FA-UX-3B).
- Currencies: تم Foundation فقط (الجداول + APIs + صفحة الإدارة) في FA-UX-4؛ الدمج في التبرعات والسندات مؤجل.
- لم يتم تنفيذ Fixed Assets.
- لم يتم تنفيذ Inventory Adjustments.
- لم يتم تنفيذ Financial Periods.
- لم يتم تعديل Flutter.
- لم يتم تعديل M phases.
- لم يتم إنشاء migration أو تعديل schema.

### نتائج التحقق:
- Backend `npx.cmd prisma validate`: نجح.
- Backend `npx.cmd tsc --noEmit`: نجح.
- Frontend `npm run build`: نجح.
- Frontend `npx.cmd tsc --noEmit`: نجح.

---

## FA-6.2-A — Donors & Donations Lite
**التاريخ:** 2026-05-03  
**النوع:** وحدة مالية تشغيلية خفيفة + Models محدودة + صفحة مالية جديدة

### لماذا أضيفت الوحدة:
- الجمعية تعتمد على دعم خارجي من متبرعين ومؤسسات لأن كثيرًا من الطلاب يدرسون مجانًا أو برسوم رمزية.
- كان تصنيف `DONATION` موجودًا في سندات القبض، لكن لم تكن هناك شاشة منظمة لإدارة المتبرعين والتبرعات والتعهدات.

### Models / الجداول المضافة:
- `Donor`: بيانات المتبرع ونوعه ومركزه الاختياري وحالة النشاط.
- `Donation`: التبرع أو التعهد، مع `voucherId` اختياري يربط التبرع المستلم بسند قبض.
- Enums: `DonorType`, `DonationStatus`.

### Endpoints الجديدة:
- `GET /finance/donors`
- `POST /finance/donors`
- `GET /finance/donors/:id`
- `PATCH /finance/donors/:id`
- `GET /finance/donations`
- `POST /finance/donations`
- `POST /finance/donations/:id/receive`

### الصفحة الجديدة:
- `/finance/donors`
- تظهر في القائمة الجانبية باسم: `المتبرعون والتبرعات`
- تحتوي تبويبات: المتبرعون، التبرعات، التعهدات.

### ربط التبرع بسند قبض:
- عند إنشاء تبرع مستلم مباشرة أو استلام تعهد، يتم إنشاء `FinanceVoucher` من نوع `RECEIPT`.
- السند يستخدم `accountingCategory = DONATION`.
- يتم ربط السند بالتبرع عبر `Donation.voucherId`.

### منع double posting:
- `Donation` لا تنشئ `JournalEntry` مباشرة.
- القيد المحاسبي ينتج فقط من مسار ترحيل سند القبض الموجود سابقًا.
- `voucherId` فريد على `Donation`، واستلام التعهد مرفوض إذا كان مربوطًا بسند مسبقًا.

### ما بقي مؤجلًا:
- العملات وأسعار الصرف.
- الأصول الثابتة.
- التسويات والجرد.
- الفترات المالية والإغلاق.
- التقارير المتقدمة للمتبرعين والتبرعات.
- Flutter.

---

## FA-5.0 — Finance & Reports Content Audit Before Restructure
**التاريخ:** 2026-05-02  
**النوع:** Audit فقط — لا تعديلات  
**آخر Commit:** `38bcbcb219dedd5834be88278014a64407ba14a0`

---

### أولاً: حالة Git عند بداية المرحلة

**ملفات Modified (من مراحل سابقة):**
```
M docs/FINANCE_ACCOUNTING_ROADMAP.md
M frontend/src/app/route-meta.ts
M frontend/src/app/router.tsx
M frontend/src/constants/labels.ts
M frontend/src/features/finance-v2/components/page/FinancePageFilters.tsx
M frontend/src/features/finance-v2/components/page/FinancePageKpis.tsx
M frontend/src/features/finance-v2/components/tabs/FinancePaymentsTab.tsx
M frontend/src/features/finance-v2/components/tabs/FinanceSummaryTab.tsx
M frontend/src/pages/accounting/AccountingAccountsPage.tsx
M frontend/src/pages/accounting/accounting-preview.css
```

**ملفات Untracked (موثّقة — لم تُلمس):**
```
?? backend/storage/library/1/org/2026/04/1777413777676-bffaef8eedd2.pdf
?? backend/storage/library/1/org/2026/04/1777413777725-f09dd12c2f3f.png
?? backend/storage/reports/1/follow_up/2026/05/
?? backend/storage/uploads/1/
?? docs/MIGRATION_DRIFT_BACKUP.patch
?? frontend/public/images/
?? frontend/src/pages/finance/               ← صفحات المالية الجديدة (FA-4.x)
?? frontend/src/styles/pages/finance-premium.css
?? rafiq_mobile/my_changes.patch
```

---

### ثانياً: جدول صفحات المالية الحالية

| Route | Label الحالي (AR) | Component | ماذا تعرض؟ | تشغيلية؟ | محاسبية؟ | تقرير؟ | مكررة؟ | القرار المقترح |
|---|---|---|---|---|---|---|---|---|
| `/finance` | — | Redirect | Redirect إلى `/finance/dashboard` | — | — | — | نعم (مع dashboard) | إبقاء كـ redirect |
| `/finance/dashboard` | لوحة المؤشرات المالية | `FinanceDashboardPage` | KPIs مالية (إجمالي/محصل/متبقي) + مؤشرات رواتب + مكافآت + `FinanceSummaryTab` | نعم | لا | لا | **نعم — مكررة مع FinancePage SUMMARY tab** | إعادة النظر |
| `/finance/invoices` | الفواتير والرسوم | `FinanceInvoicesPage` | قائمة فواتير الطلاب مع فلاتر | نعم ✅ | لا | لا | لا | Keep |
| `/finance/payments` | المدفوعات | `FinancePaymentsPage` | سجل المدفوعات والتحصيل مع فلتر invoiceId | نعم ✅ | لا | لا | لا | Keep |
| `/finance/vouchers` | السندات | `FinanceVouchersPage` | سندات القبض والصرف | نعم ✅ | نعم (مرتبط بقيود) | لا | لا | Keep |
| `/finance/treasury` | الخزينة والصندوق | `FinanceTreasuryPage` | أرصدة الصناديق وحركة الخزينة | نعم ✅ | لا | لا | لا | Keep |
| `/finance/payroll` | الرواتب والمكافآت | `FinancePayrollPage` | رواتب الموظفين والخصومات | نعم ✅ | لا | لا | لا | Keep |
| `/finance/rewards` | التبرعات والمكافآت | `FinanceRewardsPage` | التبرعات والمكافآت (YEMEN_MODE) | نعم ✅ | لا | لا | **يحتمل** (الاسم مزدوج مع payroll) | Rename |
| `/finance/reports` | التقارير المالية | `FinanceReportsPage` | بطاقات تنقل فقط إلى صفحات المحاسبة | لا ❌ | نعم (روابط) | **نعم (بشكل غير مباشر)** | **نعم — مكررة مع accounting pages** | دمج أو redirect |

**ملاحظة خاصة على `FinancePage.tsx`:**  
موجود في `/src/pages/FinancePage.tsx` لكن **غير مضمّن في router حالياً** — الـ router يستخدم صفحات `finance/` المنفصلة. هو الصفحة القديمة ذات التبويب الكامل (all-in-one). **dead page حالياً**.

---

### ثالثاً: جدول صفحات المحاسبة

| Accounting Page | Route | Purpose | Data Source | Read-only? | Print Support? | Keep? |
|---|---|---|---|---|---|---|
| `AccountingAccountsPage` | `/finance/accounting/accounts` | شجرة الحسابات الهرمية مع أرصدة | API: `/accounting/accounts` + TrialBalance | ✅ نعم | ✅ نعم | ✅ Keep |
| `AccountingJournalEntriesPage` | `/finance/accounting/journal-entries` | القيود اليومية مع فلاتر الحالة والمصدر | API: `/accounting/journal-entries` | ✅ نعم | ✅ نعم | ✅ Keep |
| `AccountingLedgerPage` | `/finance/accounting/ledger` | دفتر الأستاذ التفصيلي لكل حساب | API: `/accounting/ledger?accountId=X` | ✅ نعم | ✅ نعم | ✅ Keep |
| `AccountingTrialBalancePage` | `/finance/accounting/trial-balance` | ميزان المراجعة الإجمالي | API: `/accounting/trial-balance` | ✅ نعم | ✅ نعم | ✅ Keep |

**الإجابات المطلوبة:**

1. **هل المحاسبة جزء من المالية أم ظهرت كقسم مستقل؟**  
   ظهرت كقسم فرعي تحت `/finance/accounting/...` في الـ router، لكنها مُجمَّعة في قسم `financeReports` في `route-meta.ts`. تسميات الـ sidebar تقول: "المحاسبة - شجرة الحسابات" — أي هي فرعية من المالية.

2. **هل تسميات المحاسبة واضحة؟**  
   لا تماماً. التسميات في route-meta تستخدم نمط "المحاسبة - اسم الصفحة" (hardcoded strings وليس labels.ts)، وهذا غير متسق مع باقي النظام.

3. **هل هناك تكرار بين المحاسبة والتقارير؟**  
   **نعم — تكرار صريح:** `FinanceReportsPage` (`/finance/reports`) تعرض فقط بطاقات تشير إلى:  
   - `/finance/accounting/trial-balance`
   - `/finance/accounting/ledger`
   - `/finance/vouchers`
   - `/finance/accounting/journal-entries`  
   أي أنها **مجرد index page بروابط** — لا تضيف قيمة مستقلة.

---

### رابعاً: جدول صفحة التقارير العامة

| Report Route/Page | Label | Component | Report Type | يغطي المالية؟ | يجب أن يحتوي التقارير المالية؟ |
|---|---|---|---|---|---|
| `/reports` | التقارير | `ReportsPage` | عام — كتالوج | نعم (FINANCE type موجود) | **نعم — المكان المناسب** |

**الإجابات المطلوبة:**

1. **هل توجد صفحة تقارير عامة فعلاً؟**  
   **نعم.** `ReportsPage` في `/reports` موجودة وتعمل. تعرض كتالوج تقارير ثم تنتقل للعرض الموحد.

2. **هل التقارير المالية موجودة داخلها؟**  
   **جزئياً.** النوع `"FINANCE"` موجود في `ReportType` وفي `RPT_META` بأيقونة Wallet2 ولون rose. لكن مدى توفر بيانات فعلية يعتمد على الـ backend catalog (لا يمكن التأكد بدون تشغيل).

3. **هل يجب نقل التقارير المالية إليها؟**  
   **نعم — هذا هو الخيار الأمثل.** التقارير يجب أن تكون مركزية في `/reports`.

4. **هل وجود `/finance/reports` سيكرر `/reports`؟**  
   **نعم بالتأكيد.** `FinanceReportsPage` الحالية هي مجرد navigation index — ليست صفحة تقارير فعلية.

---

### خامساً: قرار لوحة المالية

| الخيار | مناسب؟ | السبب |
|---|---|---|
| إبقاء لوحة مالية مستقلة (`/finance/dashboard`) | **لا** | `FinanceDashboardPage` = نسخة مكررة من tab SUMMARY في `FinancePage` القديمة. نفس الـ KPIs ونفس الـ FinanceSummaryTab — لا قيمة مضافة |
| دمج المؤشرات المالية في لوحة التحكم العامة | **جزئياً** | لوحة التحكم العامة (`/dashboard`) تعرض مؤشرات تشغيلية فقط (طلاب، حلقات، حضور). إضافة مؤشرات مالية إليها ممكن لاحقاً لكن ليست أولوية الآن |
| جعل `/finance` redirect لأول صفحة تشغيلية | **نعم — الأفضل** | `/finance` يعمل بالفعل كـ redirect → `/finance/dashboard`، لكن يجب تحويله إلى `/finance/invoices` (أول صفحة تشغيلية فعلية) بعد إلغاء dashboard المكرر |

**الخلاصة:** `/finance/dashboard` = `FinanceDashboardPage` — مكررة. يجب إخفاؤها من Sidebar وتحويل `/finance` redirect إلى `/finance/invoices`.

---

### سادساً: قرار التقارير المالية

| Option | Pros | Cons | Recommended? |
|---|---|---|---|
| **A: `/finance/reports`** (الوضع الحالي) | موجودة بالفعل | مكررة، لا تضيف قيمة، تشير فقط إلى صفحات أخرى | ❌ لا |
| **B: `/reports/finance`** (رابط جديد داخل التقارير) | تنظيم مركزي واضح | يتطلب إضافة route جديد | ✅ ممكن |
| **C: رابط من المالية يفتح قسم التقارير المالية في `/reports`** | لا تكرار، تجربة موحدة، `/reports` تملك FINANCE type بالفعل | يتطلب تعديل UI فقط لا بنية | ✅ **الأفضل** |

**الترشيح:** Option C — التقارير المالية تكون جزءاً من `/reports` مع فلتر تلقائي لنوع FINANCE. `FinanceReportsPage` تُخفى من Sidebar وتُحوَّل إلى redirect لـ `/reports?type=FINANCE`.

**ملاحظة:** تتوافق هذه القرار مع توجه المستخدم بأن التقارير تشمل النظام كله.

---

### سابعاً: اكتشاف التكرار

| Item | مكرر؟ | يكرر ماذا؟ | الإجراء المقترح |
|---|---|---|---|
| `FinanceDashboardPage` (`/finance/dashboard`) | **نعم** | `FinanceSummaryTab` في `FinancePage` القديمة — نفس KPIs ونفس Component | Hide from Sidebar + Redirect → `/finance/invoices` |
| `FinancePage.tsx` (القديمة، all-in-one) | **نعم (dead)** | جميع صفحات `/finance/*` الجديدة | Remove later after proof |
| `FinanceReportsPage` (`/finance/reports`) | **نعم** | صفحات accounting مباشرة + `/reports` | Redirect → `/reports` (Option C) |
| السندات (`/finance/vouchers`) | لا | — | Keep |
| التبرعات والمصروفات (`/finance/rewards`) | **جزئياً** | اسم "التبرعات والمكافآت" مشتبك مع "الرواتب والمكافآت" | Rename → "المكافآت" |
| الخزينة والصندوق (`/finance/treasury`) | لا | — | Keep |
| المدفوعات (`/finance/payments`) | لا | — | Keep |
| التقارير المالية (`/finance/reports`) | **نعم** | `/reports` + accounting pages | Redirect → `/reports` |
| المحاسبة المالية (4 صفحات accounting) | لا | — | Keep — تُحسَّن تسمياتها في Sidebar |
| لوحة المؤشرات المالية (`/finance/dashboard`) | **نعم** | SUMMARY tab في FinancePage القديمة | Hide from Sidebar |

---

### ثامناً: الهيكل النهائي المقترح

بناءً على الفحص الفعلي، الهيكل المقترح للـ Sidebar:

```
الشؤون المالية
├── الفواتير والرسوم        ← /finance/invoices       ✅ تشغيلي
├── المدفوعات والتحصيل     ← /finance/payments       ✅ تشغيلي
├── السندات                 ← /finance/vouchers       ✅ تشغيلي + محاسبي
├── الخزينة والصندوق        ← /finance/treasury       ✅ تشغيلي
├── الرواتب والاستقطاعات    ← /finance/payroll        ✅ تشغيلي
├── المكافآت                ← /finance/rewards        ✅ تشغيلي (YEMEN_MODE)
└── المحاسبة المالية
    ├── شجرة الحسابات       ← /finance/accounting/accounts
    ├── القيود اليومية      ← /finance/accounting/journal-entries
    ├── دفتر الأستاذ        ← /finance/accounting/ledger
    └── ميزان المراجعة      ← /finance/accounting/trial-balance

التقارير (قسم منفصل)
└── التقارير               ← /reports
    ├── تقارير الحضور      (ATTENDANCE)
    ├── تقارير المتابعة    (FOLLOW_UP)
    ├── تقارير الاختبارات  (EXAMS)
    └── التقارير المالية   (FINANCE) ← يُفعَّل من هنا
```

**العناصر المحذوفة/المخفية من Sidebar:**
- `/finance/dashboard` — مخفي ثم redirect
- `/finance/reports` — redirect إلى `/reports`
- `FinancePage.tsx` القديمة — dead, يُحذف لاحقاً بعد التحقق

**`/finance` redirect يصبح:** `/finance/invoices` (بدل `/finance/dashboard`)

---

### تاسعاً: خطة التنفيذ اللاحقة

#### FA-5.1 — Finance Navigation Restructure

| Phase | Goal | Files likely affected | Risk | Validation |
|---|---|---|---|---|
| FA-5.1 | تعديل Sidebar: إخفاء dashboard و reports من القائمة + redirect آمن + إعادة تسمية rewards | `route-meta.ts`, `labels.ts` (financeRewards label), `router.tsx` | منخفض — تغييرات UI فقط | `tsc --noEmit` + manual navigation test |

**التفاصيل:**
- تغيير `sidebar: false` لـ `finance_dashboard` و `finance_reports`
- تحويل redirect `/finance` من `/finance/dashboard` إلى `/finance/invoices`
- إضافة redirect `/finance/reports` → `/reports`
- تغيير label `financeRewards` من "التبرعات والمكافآت" إلى "المكافآت"
- تحسين labels المحاسبة (إزالة prefix "المحاسبة -" واستخدام labels.ts)

---

#### FA-5.2 — Finance Reports Integration

| Phase | Goal | Files likely affected | Risk | Validation |
|---|---|---|---|---|
| FA-5.2 | ربط التقارير المالية بـ `/reports` — إضافة deep link أو redirect | `FinanceReportsPage.tsx` (redirect فقط), `ReportsPage.tsx` (اختياري: فلتر تلقائي) | منخفض — لا backend جديد | `tsc --noEmit` + test navigation |

**التفاصيل:**
- تحويل `FinanceReportsPage` إلى component بسيط يعمل `<Navigate to="/reports" />` أو `<Navigate to="/reports?type=FINANCE" />`
- التحقق من أن FINANCE report type يظهر في catalog الـ backend
- لا تعديل backend إلا إذا تبين أن FINANCE غير مفعّل في catalog

---

#### FA-5.3 — Finance Page Cleanup

| Phase | Goal | Files likely affected | Risk | Validation |
|---|---|---|---|---|
| FA-5.3 | تنظيف `FinancePage.tsx` القديمة وإزالة imports غير مستخدمة | `FinancePage.tsx`, `router.tsx` | متوسط — يجب التأكد من عدم الاستخدام أولاً | `rg "FinancePage"` + `npm run build` |

**التفاصيل:**
- التحقق بـ `rg "FinancePage"` من عدم استخدامها في أي مكان
- حذفها فقط بعد التأكد أن build يمر بدونها
- مراجعة imports في router.tsx للتنظيف

---

### عاشراً: نتائج التحقق

| Check | Result | Details |
|---|---|---|
| `frontend/tsc --noEmit` | ✅ نجح | لا أخطاء TypeScript |
| `frontend/npm run build` | ❌ فشل — خطأ واحد | `FinancePaymentsTab.tsx(39,7): error TS6133: 'PAYMENTS_ENTITY' is declared but its value is never read.` |
| `backend/prisma validate` | ✅ نجح | `The schema at prisma\schema.prisma is valid 🚀` (تحذير deprecation لـ package.json#prisma فقط) |
| `backend/tsc --noEmit` | ✅ نجح | لا أخطاء TypeScript |
| Flutter | لم يُشغَّل | خارج نطاق هذه المرحلة |
| backend schema تعديل | ❌ لم يحدث | Audit فقط |
| DB/migrations تعديل | ❌ لم يحدث | Audit فقط |
| Flutter تعديل | ❌ لم يحدث | Audit فقط |

**ملاحظة خطأ Build:** الخطأ الوحيد موجود في `FinancePaymentsTab.tsx` (متعلق بـ FA-4.x السابقة) — `'PAYMENTS_ENTITY' declared but never used`. هذا الخطأ موجود قبل هذه المرحلة ومُوثَّق في git status (الملف Modified). لم يُنشأ ولم يُعدَّل في FA-5.0.

---

### حادي عشر: الإجابات على أسئلة الرد النهائي

1. **ما صفحات المالية الحالية وماذا تعرض كل صفحة؟**  
   موثّقة في الجدول أعلاه. 9 صفحات في `/finance/*` + 4 محاسبة + `FinancePage.tsx` القديمة (dead).

2. **هل توجد لوحة مالية فعلاً؟ وهل هي مكررة مع لوحة التحكم؟**  
   نعم — `FinanceDashboardPage` موجودة في `/finance/dashboard`. مكررة مع `FinanceSummaryTab` (نفس KPIs ونفس المكون). لوحة التحكم العامة `/dashboard` **لا تعرض مؤشرات مالية** — تقتصر على طلاب/حلقات/حضور.

3. **هل نحتاج `/finance/dashboard` أم لا؟**  
   **لا.** `FinanceDashboardPage` = نسخة مكررة. يجب إخفاؤها وتحويل redirect `/finance` إلى `/finance/invoices`.

4. **هل توجد صفحة تقارير عامة؟**  
   **نعم.** `ReportsPage` في `/reports` — موجودة وتعمل ومنظمة كـ catalog بأنواع: ATTENDANCE, FOLLOW_UP, EXAMS, FINANCE.

5. **هل التقارير المالية يجب أن تكون داخل `/reports` بدل `/finance`؟**  
   **نعم.** نوع FINANCE مُعرَّف بالفعل في types و RPT_META. `FinanceReportsPage` الحالية مجرد navigation index تُوجّه إلى صفحات أخرى.

6. **هل "التبرعات والمصروفات" صفحة مستقلة فعلاً أم مكررة؟**  
   **مستقلة** ولكن التسمية مشكلة: label يقول "التبرعات والمكافآت" وهو مشترك مع payroll. يجب Rename فقط.

7. **ما الصفحات التي يجب إبقاؤها؟**  
   invoices, payments, vouchers, treasury, payroll, rewards (بعد rename), accounting (4 صفحات), reports.

8. **ما الصفحات التي يجب إعادة تسميتها؟**  
   - `financeRewards` label: "التبرعات والمكافآت" → "المكافآت"
   - صفحات accounting في Sidebar: "المحاسبة - X" → "شجرة الحسابات", "القيود اليومية", إلخ (من labels.ts)

9. **ما الصفحات التي يجب إخفاؤها من القائمة؟**  
   - `finance_dashboard` (sidebar: false)
   - `finance_reports` (sidebar: false)

10. **ما الصفحات التي يجب تحويلها redirect؟**  
    - `/finance` → `/finance/invoices` (بدل dashboard)
    - `/finance/reports` → `/reports`

11. **ما الهيكل النهائي المقترح؟**  
    موثّق في القسم الثامن أعلاه.

12. **هل تم تعديل backend؟** لا ✅

13. **هل تم تعديل DB أو migrations؟** لا ✅

14. **هل تم تعديل Flutter؟** لا ✅

15. **نتائج التحقق:**
    - frontend tsc: ✅ نجح
    - frontend build: ❌ خطأ واحد موجود مسبقاً (`PAYMENTS_ENTITY` unused) — ليس من FA-5.0
    - backend prisma validate: ✅ نجح
    - backend tsc: ✅ نجح

16. **هل يمكن بعد هذا البدء في FA-5.1؟**  
    **نعم** — مع ملاحظة أن خطأ build الواحد (`PAYMENTS_ENTITY`) يجب إصلاحه إما في FA-5.1 أو كـ hotfix منفصل قبل البدء.

---

*FA-5.0 مكتملة — Audit فقط — لا تعديلات على كود أو backend أو Flutter*

---

## FA-3.2.3 — Disbursement Voucher Posting Implementation Result
**Date:** 2026-05-03
**Type:** Backend/accounting only

### Posting point used
- Disbursement voucher accounting posting is executed from `backend/src/modules/finance-v2/services/accounting.service.ts` inside `postVoucher`.
- The posting flow runs inside the existing `prisma.$transaction` that posts the finance voucher through `postVoucherTx`.
- The transaction then calls `globalAccountingService.postDisbursementVoucherJournalEntryTx(tx, scope, { voucherId, postedById })`.
- The Receipt Voucher posting point remains `globalAccountingService.postReceiptVoucherJournalEntryTx(...)` in the same `postVoucher` transaction.

### Disbursement mapping
- `OPERATING_EXPENSE`: Debit `5200` / `OPERATING_EXPENSES` (expense), Credit cash/bank.
- `EDUCATIONAL_EXPENSE`: Debit `5300` / `EDUCATIONAL_EXPENSES` (expense), Credit cash/bank.
- `CENTER_EXPENSE`: Debit `5400` / `CENTER_EXPENSES` (expense), Credit cash/bank.
- `REWARD`: Debit `5100` / `PAYROLL_REWARDS_EXPENSE` (expense), Credit cash/bank.
- `CASH`: Credit `1100` / `MAIN_CASH` (asset).
- `TRANSFER`: Credit `1110` / `BANK` (asset).

### Fail-closed behavior
- Missing `accountingCategory` fails with `ACCOUNTING_CATEGORY_MISSING`.
- Receipt-only categories (`DONATION`, `STUDENT_CONTRIBUTION`, `OTHER_INCOME`) fail for disbursement vouchers with `INVALID_ACCOUNTING_CATEGORY`.
- Missing or wrong-type expense/cash/bank accounts fail with `ACCOUNTING_MAPPING_MISSING`.
- Unknown or unmapped payment method fails with: `Accounting cash/bank account mapping is missing for disbursement voucher posting`.
- Out-of-scope vouchers fail before journal creation through the accounting scope check.

### Duplicate prevention
- Before creating a journal entry, the helper checks `JournalEntry` by:
  - `organizationId`
  - `sourceType = VOUCHER`
  - `sourceId = FinanceVoucher.id`
- If a journal entry already exists, the helper returns it and does not create a second entry.
- The schema-level unique constraint `@@unique([organizationId, sourceType, sourceId])` remains unchanged and provides the database safety net.

### Transaction behavior
- Finance voucher posting, finance movement creation, journal entry creation, and journal posting all run in the same Prisma transaction.
- The helper accepts the transaction client and does not instantiate a new `PrismaClient`.
- If journal posting fails, the voucher posting transaction rolls back.

### Receipt and Payment safety
- Receipt Voucher posting remains handled by `postReceiptVoucherJournalEntryTx` and was not changed for this phase.
- Payment-generated vouchers are still skipped in voucher posting helpers when `sourceType === PAYMENT`, preserving Payment Posting as the source of accounting entries for payments.
- Payment Posting was not modified.

### Functional validation
- Test data was created in the development database and removed after validation.
- `OPERATING_EXPENSE`: verified `Dr 5200 / Cr 1100`.
- `EDUCATIONAL_EXPENSE`: verified `Dr 5300 / Cr 1110`.
- `CENTER_EXPENSE`: verified `Dr 5400 / Cr 1100`.
- `REWARD`: verified `Dr 5100 / Cr 1110`.
- Invalid `DONATION` on a disbursement voucher was rejected clearly and the transaction rolled back.
- Re-running the journal helper for the same posted voucher did not create a duplicate `JournalEntry`.
- Ledger rows were present for the posted expense accounts.
- Trial Balance remained balanced: Debit `100`, Credit `100`.

### Technical validation
- `npx.cmd prisma validate`: passed.
- `npx.cmd prisma migrate status --schema prisma/schema.prisma`: passed; database schema is up to date.
- `npx.cmd tsc --noEmit` in backend: passed.
- `npm run build` in frontend: passed.
- `npx.cmd tsc --noEmit` in frontend: passed.

### Constraints confirmed
- No `schema.prisma` change.
- No migration created or run.
- No seed run.
- No Flutter change.
- No frontend UI change.
- No M phase change.
- No Payment Posting change.
- No Receipt Voucher Posting behavior change.

---

## FA-5.1 — Finance Navigation and Content Flow Restructure
**التاريخ:** 2026-05-02
**النوع:** UI/Navigation Refactor — لا تعديلات على البنية التحتية

### ما تم إنجازه:
1. **تعديل الـ Redirects (`frontend/src/app/router.tsx`)**:
   - تحويل مسار `/finance` الافتراضي ليوجه إلى `/finance/invoices` بدلًا من `/finance/dashboard`.
   - إضافة تحويل لـ `/finance/reports` ليوجه مباشرة إلى `/reports`.

2. **إعادة هيكلة القائمة الجانبية (Sidebar) (`frontend/src/app/route-meta.ts`)**:
   - إخفاء `finance_dashboard` (مكررة مع FinanceSummaryTab) بجعل `sidebar: false`.
   - إخفاء `finance_reports` (مكررة مع التقارير العامة) بجعل `sidebar: false`.
   - استخدام الـ dynamic getters (`get label()`) لصفحات المحاسبة لكي تقرأ من `labels.ts`.

3. **تحديث التسميات (`frontend/src/constants/labels.ts`)**:
   - `financePayments`: "المدفوعات والتحصيل"
   - `financePayroll`: "الرواتب والاستقطاعات"
   - `financeRewards`: "المكافآت"
   - صفحات المحاسبة الأربع تمت إعادة تسميتها بإزالة بادئة "المحاسبة المالية /".

4. **إصلاح خطأ الـ Build (`frontend/src/features/finance-v2/components/tabs/FinancePaymentsTab.tsx`)**:
   - حذف الثابت `PAYMENTS_ENTITY` غير المستخدم والذي كان يسبب فشل `npm run build` بالخطأ `TS6133`.

### القيود التي تم الالتزام بها:
- **Backend / Schema / DB**: ❌ لم يتم التعديل
- **Flutter / Mobile**: ❌ لم يتم التعديل
- **M phases / Payment Posting / Receipt Voucher**: ❌ لم يتم التعديل
- **حذف ملفات**: ❌ لم يتم حذف أي ملف (`FinancePage.tsx` ما زالت موجودة ومخفية).
- **إضافة / تشغيل migrations أو seeds**: ❌ لم يتم.

### نتائج التحقق بعد التعديل:
- `npm run build` في frontend: ✅ نجح (تم حل خطأ `PAYMENTS_ENTITY`).
- `npx tsc --noEmit` في frontend: ✅ نجح.
- `npx prisma validate` في backend: ✅ نجح.
- `npx tsc --noEmit` في backend: ✅ نجح.

---

## FA-5.0.2 — Finance & Accounting Deep Page Content Audit (Validation)
**التاريخ:** 2026-05-02
**النوع:** Audit / توثيق

### ملخص التدقيق العميق للصفحات المالية والمحاسبية:
1. **FinancePayrollTab و FinanceRewardsTab**:
   - تم التأكد من أن التابات تدير الرواتب والمكافآت بشكل تشغيلي منفصل، مع دورات شهرية أو ربع سنوية.
   - اسم `financeRewards` كان خادعاً، والصفحة فعلياً تتعامل مع "مكافآت" (للمعلمين/الطلاب) مما يؤكد صحة خطوة تعديل التسمية السابقة.

2. **FinanceTreasuryTab و FinanceApprovalsTab**:
   - تعمل صفحات الخزينة والاعتمادات كنقطة تحكم في التحويلات وحالة السندات، وتعمل بشكل صحيح بالكامل.

3. **Accounting (Accounts, JournalEntries, Ledger, TrialBalance)**:
   - الصفحات الأربع المحاسبية صُممت لتكون للعرض (Read-Only) مع دعم ممتاز للطباعة والفلترة.
   - لا يوجد فيها أي عمليات كتابة أو تعديل على الـ Schema، وتعمل بشكل ممتاز كتقارير محاسبية مفصلة.

4. **التقارير المالية (FinanceReportsPage)**:
   - تأكدنا مجدداً أنها مجرد صفحة تجميعية (Index) لا تحوي منطقاً برمجياً، مما يؤكد صحة قرار توجيه مسارها إلى `/reports`.

### نتائج التحقق النهائية (Validation):
- تم تنفيذ فحص TypeScript للواجهة الأمامية `frontend/tsc --noEmit` واكتمل بنجاح دون أي أخطاء.
- تم تنفيذ فحص Schema قاعدة البيانات `backend/prisma validate` واكتمل بنجاح (The schema is valid).
- النظام الآن مستقر تماماً برمجياً وبنيوياً.

---

*يمكن الآن الانتقال إلى الخطوة القادمة في الخارطة (FA-5.2 / FA-5.3).*

---

## FA-5.1.2 — Correct Finance Sidebar Labels Based on Real Content
**التاريخ:** 2026-05-02
**النوع:** تعديل UI / Documentation

### ملخص المرحلة:
- تم تصحيح `financeRewards` إلى "المكافآت" في `labels.ts`.
- السبب: `FinanceRewardsTab` يتعامل مع مكافآت (للمعلمين/الطلاب)، وليس تبرعات أو داعمين.
- التبرعات حاليًا تدخل من خلال سندات القبض بتصنيف DONATION.
- الداعمون يحتاجون وحدة مستقبلية مستقلة فقط إذا وُجد نموذج/جدول لإدارة الداعمين.
- تمت إزالة بادئة "المحاسبة المالية /" من عناصر المحاسبة الأربعة في `labels.ts` لتصبح (شجرة الحسابات، القيود اليومية، دفتر الأستاذ، ميزان المراجعة).
- لم يتم تعديل backend أو DB أو Flutter.
- لا يوجد تعديل على logic التوجيه لأنه كان صحيحًا بالفعل (توجيه `/finance` إلى `/finance/invoices`، وإخفاء `dashboard` والتقارير في الشريط الجانبي).

---

## FA-5.2 — Finance Pages Content Flow Redesign
**التاريخ:** 2026-05-02
**النوع:** UI/Content Flow Restructure — لا تعديلات على البنية التحتية

### ملخص المرحلة:
الهدف من هذه المرحلة كان تحسين تدفق المحتوى (Content Flow) وتنظيم البيانات في صفحات المالية لتعزيز تجربة المستخدم، عبر إضافة بطاقات ملخصة (KPIs) وجداول عرض متسقة.

- **Invoices (`FinanceInvoicesTab`)**: تم استبدال العرض القديم بجدول بيانات احترافي (Premium Data Table) مع إضافة بطاقات KPI ملخصة في الأعلى.
- **Payments (`FinancePaymentsTab`)**: تمت إضافة بطاقات KPI للتحصيل (Cash, Transfer) وتم إدراج "حالة القيد" المحاسبي داخل جدول المدفوعات.
- **Vouchers (`FinanceVouchersTab`)**: تمت إضافة بطاقات KPI تميز بين سندات القبض والصرف وإجمالي المبالغ، وإضافة عمود "طريقة الدفع" للجدول.
- **Treasury (`FinanceTreasuryTab`)**: تم تبسيط الصفحة لتعرض حركة النقد الفعلية (Cashflow) بدلاً من تكرار جدول السندات، مع بطاقات لأرصدة الصناديق.
- **Payroll (`FinancePayrollTab`)**: تمت إضافة بطاقات KPI لإجمالي الرواتب والخصومات والصافي. تم تحويل عرض الدفعات إلى هيكل متداخل يعرض تفاصيل راتب كل موظف داخل الدفعة الشهرية.
- **Rewards (`FinanceRewardsTab`)**: تم تأكيد استخدام مصطلح "المكافآت" وإضافة بطاقات KPI ملخصة، وتم تحويل عرض الدفعات لعرض تفاصيل كل مستفيد داخل الدفعة.

### القيود التي تم الالتزام بها:
- **Backend / Schema / DB**: ❌ لم يتم التعديل
- **Flutter / Mobile**: ❌ لم يتم التعديل
- **منطق الحسابات**: ❌ لم يتم التعديل (فقط قراءة البيانات المحاسبية)

### FA-5.2.1 — Fix Finance Treasury Build Error and Rewards Terminology Cleanup
**التاريخ:** 2026-05-03
**النوع:** Hotfix

- تم إصلاح خطأ JSX في `FinanceTreasuryTab` (Missing parent element for empty state/table).
- تم تصحيح التسمية المتبقية من "إكراميات" إلى "مكافآت" في صفحة الاعتمادات (`FinanceApprovalsTab`).
- لم يتم تعديل backend أو DB أو Flutter.
- تم عمل amend للـ commit الأخير للحفاظ على نظافة الـ git history بعد نجاح جميع الفحوصات.

*يمكن الآن الانتقال لتنظيف الأكواد الميتة (FA-5.3).*

---

## FA-5.4 — Finance Legacy Cleanup Execution
**التاريخ:** 2026-05-03  
**النوع:** Cleanup — إزالة الأكواد الميتة  
**آخر Commit:** `affd755c75c730afc5eee293fd768429b30f7a66`

### ما تم إنجازه:
1. **تنظيف الـ Router (`frontend/src/app/router.tsx`)**:
   - إزالة imports الخاصة بـ `FinanceDashboardPage` و `FinanceReportsPage`.
   - تحويل مسار `/finance/dashboard` إلى `Navigate` مباشر إلى `/finance/invoices`.
   - تحويل مسار `/finance/reports` إلى `Navigate` مباشر إلى `/reports`.

2. **تعديل الـ Meta (`frontend/src/app/route-meta.ts`)**:
   - تحديث التعليقات لتوضيح أن المسارات أصبحت تحويلات (Redirects).
   - إبقاء العناصر في `ADMIN_ROUTES` مع `sidebar: false` للحفاظ على الـ RBAC metadata.

3. **حذف الملفات الميتة (7 ملفات)**:
   - `frontend/src/pages/FinancePage.tsx` (الصفحة القديمة الشاملة).
   - `frontend/src/pages/finance/FinanceDashboardPage.tsx` (الداشبورد المكرر).
   - `frontend/src/pages/finance/FinanceReportsPage.tsx` (فهرس التقارير المكرر).
   - `frontend/src/features/finance-v2/components/page/FinancePageTabs.tsx` (تبويبات قديمة).
   - `frontend/src/features/finance-v2/components/page/FinancePageHeader.tsx` (هيدر قديم).
   - `frontend/src/features/finance-v2/components/page/FinancePageKpis.tsx` (مؤشرات قديمة).
   - `frontend/src/features/finance-v2/components/tabs/FinanceSummaryTab.tsx` (تاب ملخص قديم - ثبت عدم استخدامه بعد حذف الداشبورد).

4. **ما تم الإبقاء عليه**:
   - `FinancePageFilters.tsx`: مستخدم في كل صفحات المالية الجديدة.
   - `finance-v4.css` و `finance-premium.css`: مستخدمة في `FinancePaymentsPage.tsx` لتنسيق الواجهة المتقدمة.

### نتائج التحقق:
- **Frontend Build:** ✅ نجح.
- **Frontend TSC:** ✅ نجح.
- **Backend Prisma:** ✅ نجح.
- **Backend TSC:** ✅ نجح.

---

## FA-UX-4 — Currencies Lite + Safe Donations/Vouchers Integration
**التاريخ:** 2026-05-04
**النوع:** Foundation — بنية عملات وأسعار صرف (بدون تعديل منطق الترحيل)

### ملخص:
تم تنفيذ دعم محدود للعملات متعددة مع الحفاظ على العملة الأساسية (YER) لجميع العمليات المحاسبية.

### Schema Changes (Safe Migration):
- **جداول جديدة:**
  - `Currency`: تخزين العملات (code, nameAr, nameEn, symbol, decimalPlaces, isBase, isActive)
  - `ExchangeRate`: تخزين أسعار الصرف (rateToBase, effectiveDate, source, notes)
- **حقول جديدة (nullable):**
  - `Donation.originalAmount`, `originalCurrencyCode`, `exchangeRateToBase`
  - `FinanceVoucher.originalAmount`, `originalCurrencyCode`, `exchangeRateToBase`

### Backend APIs:
- `GET /finance/v2/currencies` — قائمة العملات
- `POST /finance/v2/currencies` — إضافة عملة
- `PATCH /finance/v2/currencies/:id` — تعديل عملة
- `GET /finance/v2/currencies/predefined` — العملات المتاحة
- `GET /finance/v2/currencies/base` — العملة الأساسية
- `GET /finance/v2/exchange-rates` — قائمة أسعار الصرف
- `POST /finance/v2/exchange-rates` — إضافة سعر صرف
- `GET /finance/v2/exchange-rates/latest` — أحدث سعر صرف

### Frontend:
- صفحة جديدة: `/finance/currencies` مع تبويبين (العملات / أسعار الصرف)
- مكانة في Sidebar ضمن قسم الشؤون المالية
- KPIs: العملة الأساسية، عدد العملات النشطة، عدد أسعار الصرف

### القيود المطبقة:
- لا يمكن تعديل منطق Posting الموجود — فقط إضافة حقول nullable
- لا يمكن جلب أسعار الصرف من الإنترنت — إدخال يدوي فقط
- لا يمكن إضافة عملات غير معرفة مسبقًا — قائمة محددة (YER, USD, SAR, AED, QAR, KWD, OMR, BHD, TRY, EUR)

### ما لم يُنفذ (مؤجل FA-UX-4B):
- دمج العملات في نماذج التبرعات والسندات (إضافة حقول originalAmount و originalCurrencyCode و exchangeRateToBase)
- حساب amount الأساسي تلقائيًا: `amount = originalAmount × exchangeRateToBase`
- اختيار سعر الصرف تلقائيًا بناءً على التاريخ
- **ملاحظة مهمة:** Posting logic والقيود اليومية تبقى معتمدة على `amount` الأساسي فقط. لا تستخدم `originalAmount` في القيود.

### نتائج التحقق:
- **Prisma Validate:** ✅ نجح (exit 0)
- **Prisma Migrate Deploy:** ✅ نجح — Migration طُبقت على قاعدة التطوير
- **Prisma Migrate Status:** ✅ نجح — Database schema is up to date!
- **Prisma Generate:** ✅ نجح — Generated Prisma Client (v6.15.0)
- **Backend TSC:** ✅ نجح (exit 0)
- **Frontend Build:** ✅ نجح
- **Frontend TSC:** ✅ نجح (exit 0)

### حالة الاعتماد:
✅ **FA-UX-4A جاهزة للاعتماد والـ Commit.**

---

## FA-UX-4B — Safe Currency Integration for Donations and Vouchers
**التاريخ:** 2026-05-04
**النوع:** Integration — ربط العملات وأسعار الصرف بالتبرعات وسندات القبض/الصرف فقط (دون تغيير منطق الترحيل)

### نطاق العمل:
المرحلة تربط حقول العملات الموجودة في FA-UX-4A بنماذج التبرعات والسندات، مع الحفاظ التام على القيود المحاسبية بالعملة الأساسية (الريال اليمني).

### كيف تم ربط العملات بالتبرعات:
- توسيع `createDonationBodySchema` و `receiveDonationBodySchema` (`backend/src/modules/finance-v2/finance-v2.validation.ts`) لقبول الحقول الاختيارية: `originalAmount` و `originalCurrencyCode` و `exchangeRateToBase`.
- إضافة `currency-amount.helper.ts` (`backend/src/modules/finance-v2/services/currency-amount.helper.ts`) الذي:
  - يعتبر العملة الافتراضية YER عند غيابها.
  - يفرض `exchangeRateToBase = 1` و `amount = originalAmount` حين تكون العملة YER.
  - يطلب `originalAmount` و `exchangeRateToBase > 0` للعملات الأجنبية ويحسب `amount = originalAmount × exchangeRateToBase`.
  - يتحقق من وجود العملة في جدول `Currency` ومن كونها نشطة قبل القبول.
- في `donors.service.ts`: `createDonation` تحفظ الثلاثي على Donation، وعند `RECEIVED` تنشئ سند قبض كمسودة بنفس بيانات العملة (`originalAmount`/`originalCurrencyCode`/`exchangeRateToBase`).
- `receiveDonation` للتعهدات بعملة أجنبية يقبل `exchangeRateToBase` اختياريًا لإعادة احتساب المبلغ الأساسي عند الاستلام، ثم تحدّث Donation وسند القبض بالقيمة المحققة.
- توسيع `donationSelect` لإرجاع الحقول الجديدة في القراءة فقط دون تغيير الفهارس أو المخطط.

### كيف تم ربط العملات بسندات القبض والصرف:
- توسيع `createVoucherBodySchema` لقبول الثلاثي نفسه.
- في `accounting.service.ts` ضمن `createVoucher` يتم استدعاء `resolveCurrencyAmountTx` قبل الإنشاء؛ تُكتب الحقول الثلاثة، ويبقى `amount` هو المبلغ الأساسي بالريال اليمني.
- توسيع `voucherSelect` (في `finance-v2.internal.ts`) لإرجاع الحقول الجديدة لاستخدامها في الواجهة والطباعة فقط.

### بقاء `amount` هو المبلغ الأساسي:
- جميع المسارات (Donation، FinanceVoucher، Posting) تستخدم `voucher.amount` و `donation.amount` كقيمة أساسية بالريال اليمني.
- لم يُستخدم `originalAmount` في `JournalEntry` أو `JournalEntryLine` أو في أي مسار ترحيل.

### دور الحقول الجديدة:
- `originalAmount`، `originalCurrencyCode`، `exchangeRateToBase` تُستخدم فقط للتوثيق والعرض والطباعة:
  - عرض في صفحة المتبرعين/السندات (سطر فرعي صغير `100 USD × 530 = 53,000 YER`).
  - عرض في طباعة سند القبض/الصرف (المبلغ الأصلي + العملة + سعر الصرف + المبلغ المعادل).
  - إعادة احتساب الأساس عند استلام تعهد بعملة أجنبية بسعر صرف محدّث.

### القيود المحاسبية وعدم تعديل Posting:
- لم يُعدَّل `JournalEntry` ولا `JournalEntryLine`.
- لم يُعدَّل `postReceiptVoucherJournalEntryTx` ولا `postDisbursementVoucherJournalEntryTx` ولا `postPaymentJournalEntryTx`.
- لم يُعدَّل عكس السندات (Void Reversal).
- لم تُنشأ migrations جديدة، ولم يُعدَّل `schema.prisma`.
- جميع القيود تستمر في استخدام `voucher.amount` بالعملة الأساسية فقط.

### واجهة المستخدم (Frontend):
- `DonationFormModal`: استبدال حقل المبلغ بـ (المبلغ الأصلي، العملة، سعر الصرف، المعادل بالريال اليمني)؛ تعطيل سعر الصرف عند YER؛ ملء سعر الصرف تلقائيًا من آخر سعر مخزّن للعملات الأجنبية مع السماح بتعديله يدويًا.
- `FinanceDonorsPage`: ربط `useCurrenciesQuery` بالنموذج، تمرير قائمة العملات كـ prop، وإضافة سطر "عملة أصلية" داخل تبويب التبرعات.
- نافذة استلام التعهد: تعرض المبلغ والعملة الأصلية، تطلب تأكيد سعر الصرف عند الاستلام (مع ملء آخر سعر مخزّن)، وتحسب المعادل بالريال اليمني.
- `FinanceVouchersTab`: ثلاثي المبلغ في نموذج إنشاء السند مع معاينة المعادل بالريال اليمني، وسطر فرعي في جدول السندات للعملات الأجنبية فقط.
- `printAccounting.printVoucherReceipt`: قسم إضافي يعرض المبلغ الأصلي + العملة + سعر الصرف + المبلغ المعادل عند وجود عملة أجنبية. مبلغ الصندوق المؤطّر يبقى بالريال اليمني.

### ما لم يُنفَّذ في هذه المرحلة (مؤجَّل لاحقًا):
- ربط العملات بالفواتير (Invoice).
- ربط العملات بالرواتب (Payroll/Reward).
- تقارير متعددة العملات (Multi-currency reports).
- جلب أسعار الصرف من الإنترنت (إدخال يدوي فقط).

### الملفات المتأثرة:
- Backend:
  - `backend/src/modules/finance-v2/finance-v2.validation.ts`
  - `backend/src/modules/finance-v2/finance-v2.internal.ts`
  - `backend/src/modules/finance-v2/services/donors.service.ts`
  - `backend/src/modules/finance-v2/services/accounting.service.ts`
  - `backend/src/modules/finance-v2/services/currency-amount.helper.ts` (جديد)
- Frontend:
  - `frontend/src/features/finance-v2/types.ts`
  - `frontend/src/features/finance-v2/finance-v2.api.ts`
  - `frontend/src/features/finance-v2/finance-v2.hooks.ts`
  - `frontend/src/features/finance-v2/components/DonationFormModal.tsx`
  - `frontend/src/features/finance-v2/components/tabs/FinanceVouchersTab.tsx`
  - `frontend/src/features/accounting/printAccounting.ts`
  - `frontend/src/pages/finance/FinanceDonorsPage.tsx`
- Docs:
  - `docs/FINANCE_ACCOUNTING_ROADMAP.md`

---
