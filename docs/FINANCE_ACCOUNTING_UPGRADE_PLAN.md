# Finance Accounting MVP Upgrade

## Overview

سنكمل على `finance-v2` الحالي ولا نعيد بناء المالية من الصفر. هذه الترقية تضيف Accounting Layer مستقل فوق العمليات المالية الحالية حتى يصبح النظام قابلًا للتوسع نحو شجرة حسابات، قيود يومية، دفتر أستاذ، وميزان مراجعة.

هذه ليست إعادة بناء كاملة، ولا تستبدل التحصيل والسندات والرواتب والمكافآت الموجودة. المرحلة الأولى FA-1 تضيف الأساس المحاسبي فقط.

## FA-1 Scope

- إضافة `AccountingAccount` كشجرة حسابات مبسطة.
- إضافة `JournalEntry` للقيود اليومية.
- إضافة `JournalEntryLine` لأسطر القيود المدينة والدائنة.
- إضافة seed idempotent لشجرة الحسابات الافتراضية لكل جمعية.
- إضافة backend accounting module بواجهات إدارية آمنة.

## Deferred Scope

- لا يوجد ربط تلقائي الآن مع المدفوعات أو السندات.
- لا يوجد ربط الآن مع الرواتب أو الخصومات أو المكافآت.
- لا يوجد إقفال فترات.
- لا يوجد عكس قيود.
- لا يوجد backfill للعمليات المالية القديمة.
- لا يوجد تعديل على واجهة المالية في الويب أو Flutter.

## Default Chart of Accounts

| Code | Account Name | Type | Normal Balance |
|---|---|---|---|
| 1100 | الصندوق الرئيسي | ASSET | DEBIT |
| 1110 | البنك | ASSET | DEBIT |
| 1120 | صناديق المراكز | ASSET | DEBIT |
| 1200 | ذمم الطلاب | ASSET | DEBIT |
| 2100 | مستحقات موظفين | LIABILITY | CREDIT |
| 2200 | مصروفات مستحقة | LIABILITY | CREDIT |
| 3100 | صافي أصول غير مقيدة | NET_ASSET | CREDIT |
| 3200 | صافي أصول مقيدة | NET_ASSET | CREDIT |
| 4100 | اشتراكات ومساهمات الطلاب | REVENUE | CREDIT |
| 4200 | التبرعات والدعم | REVENUE | CREDIT |
| 4300 | إيرادات أخرى | REVENUE | CREDIT |
| 5100 | رواتب ومكافآت | EXPENSE | DEBIT |
| 5200 | مصروفات تشغيلية | EXPENSE | DEBIT |
| 5300 | مصروفات تعليمية | EXPENSE | DEBIT |
| 5400 | مصروفات مراكز | EXPENSE | DEBIT |
| 5500 | خصومات وتسويات | EXPENSE | DEBIT |

## FA-1 Implementation Result

- تمت إضافة تعريفات `AccountingAccount`, `JournalEntry`, `JournalEntryLine` إلى `backend/prisma/schema.prisma`.
- تمت إضافة enums:
  - `AccountingAccountType`
  - `AccountingNormalBalance`
  - `JournalEntryStatus`
  - `JournalSourceType`
- تمت إضافة seed idempotent لشجرة الحسابات الافتراضية داخل `backend/prisma/seed.ts` باستخدام `upsert` حسب `organizationId + code`.
- تمت إضافة backend accounting module مستقل تحت `backend/src/modules/accounting/`.
- تمت إضافة endpoints المخططة:
  - `GET /accounting/accounts`
  - `GET /accounting/journal-entries`
  - `GET /accounting/ledger`
  - `GET /accounting/trial-balance`
  - `POST /accounting/journal-entries`
  - `POST /accounting/journal-entries/:id/post`
- تم تسجيل `accountingRouter` في `backend/src/app/router.ts`.
- لم يتم تعديل منطق `finance-v2`.
- لم يتم تعديل Flutter.
- لم يتم تعديل واجهة المالية في frontend.
- لم يتم حذف أي جدول أو ملف مالي قائم.
- لم يتم ربط المدفوعات أو السندات أو الرواتب أو الخصومات تلقائيًا.

### Migration Status

- تم تشغيل `npx.cmd prisma validate` بنجاح.
- فشل إنشاء migration عبر:
  - `npx.cmd prisma migrate dev --name finance_accounting_mvp_foundation`
- سبب الفشل:
  - Prisma error `P3006`
  - migration قديم باسم `20260303093000_follow_up_draft_final` فشل عند تطبيقه على shadow database.
  - الخطأ الداخلي `P1014`: الجدول `public.follow_up_records` غير موجود في shadow database.
- التزامًا بقيود التنفيذ، تم التوقف هنا ولم يتم استخدام `migrate reset` أو `db push`.
- لم يتم إنشاء مجلد migration باسم `finance_accounting_mvp_foundation`.
- لم يتم تشغيل `prisma generate` أو TypeScript checks أو frontend build بعد فشل shadow database، لأن مرحلة migration لم تكتمل.

### Deferred After Shadow DB Fix

- إصلاح مشكلة migration القديمة أو shadow database بطريقة آمنة.
- إعادة تشغيل `npx.cmd prisma migrate dev --name finance_accounting_mvp_foundation`.
- بعد نجاح migration:
  - `npx.cmd prisma generate`
  - `npx.cmd tsc --noEmit`
  - `npx.cmd prisma migrate status`
  - `npm run build` في frontend
  - `npx.cmd tsc --noEmit` في frontend

## FA-1.1 Safe Migration Recovery Result

- سبب فشل `migrate dev` السابق:
  - `P3006 / P1014` أثناء replay على shadow database.
  - migration قديم `20260303093000_follow_up_draft_final` توقع جدول `public.follow_up_records` غير موجود في shadow database.
- طريقة الاسترداد:
  - لم يتم استخدام `migrate reset`.
  - لم يتم استخدام `db push`.
  - لم يتم تعديل أي migration قديم.
  - تم إنشاء migration SQL عبر `prisma migrate diff` من قاعدة البيانات الحالية إلى `schema.prisma` الحالي.
- اسم migration:
  - `20260502000100_finance_accounting_mvp_foundation`
- مراجعة SQL:
  - تمت مراجعة `migration.sql`.
  - يحتوي على إنشاء enums المحاسبية الجديدة، وجداول `accounting_accounts`, `journal_entries`, `journal_entry_lines`, والفهارس، والمفاتيح الأجنبية.
  - لا يحتوي على `DROP`.
  - لا يحتوي على `DELETE FROM` أو `TRUNCATE`.
  - لا يحتوي على تعديل مباشر لجداول `payments`, `finance_vouchers`, `finance_accounts`, `invoices`, `finance_account_movements`, `finance_fund_transfers`.
- Check constraints:
  - تمت إضافة `journal_entry_lines_debit_non_negative`.
  - تمت إضافة `journal_entry_lines_credit_non_negative`.
  - تمت إضافة `journal_entry_lines_debit_credit_xor`.
- تطبيق migration:
  - أول محاولة `migrate deploy` فشلت بسبب BOM في بداية SQL الناتج من PowerShell `Out-File`.
  - تم إصلاح ملف migration الجديد فقط بإزالة BOM.
  - تم استخدام `prisma migrate resolve --rolled-back 20260502000100_finance_accounting_mvp_foundation` للـ migration الجديدة فقط لأنها فشلت قبل تنفيذ SQL.
  - نجح `npx.cmd prisma migrate deploy` بعد إزالة BOM.
- نتائج التحقق حتى نقطة التوقف:
  - `npx.cmd prisma validate`: نجح.
  - `npx.cmd prisma migrate status`: نجح بعد التطبيق ويقول `Database schema is up to date!`.
  - `npx.cmd prisma generate`: لم يكتمل. فشل أولًا بسبب `EPERM` عند إعادة تسمية `query_engine-windows.dll.node` لأن backend محلي كان يقفل Prisma Client.
  - تم إيقاف عمليتي backend المحليتين `node dist\app\server.js` و`node scripts\serve-dist.cjs` لتحرير القفل.
  - محاولة إعادة تشغيل `prisma generate` بصلاحية مصعّدة رُفضت من نظام الموافقات بسبب حد الاستخدام، لذلك تم التوقف دون التفاف.
  - لم يتم تشغيل backend `tsc` بنجاح بعد، لأن Prisma Client لم يتجدد.
  - لم يتم تشغيل فحوصات frontend بعد نقطة التوقف.
- Seed:
  - تمت مراجعة seed المضاف.
  - هو idempotent باستخدام `upsert` حسب `organizationId + code`.
  - لا يغير أرصدة مالية.
  - لا ينشئ قيودًا قديمة.
  - لم يتم تشغيل seed.

## FA-1.2 Prisma Client Generation and Final Validation

- EPERM / Prisma Client lock:
  - تم عرض عمليات `node` الحالية قبل التنفيذ.
  - لم يتم استخدام `taskkill /F /IM node.exe` لأن الجهاز كان يحتوي عدة عمليات Node ولم يكن ممكنًا إثبات أنها كلها تخص هذا المشروع.
  - لم يتم إيقاف عمليات Node إضافية في هذه المرحلة.
  - نجح `npx.cmd prisma generate` بدون صلاحية مصعّدة بعد أن لم يعد قفل Prisma Client فعالًا.
- Prisma checks:
  - `npx.cmd prisma generate`: نجح.
  - `npx.cmd prisma validate`: نجح.
  - `npx.cmd prisma migrate status`: نجح ويقول `Database schema is up to date!`.
  - ملاحظة: تشغيل `migrate status` داخل sandbox فشل أولًا بـ `EPERM` عند تشغيل `schema-engine-windows.exe`، ثم نجح عند تشغيل نفس أمر status خارج sandbox. لم يتم تشغيل migration جديد.
- Backend validation:
  - `npx.cmd tsc --noEmit`: نجح.
  - تم إجراء تعديل TypeScript محدود داخل `backend/src/modules/accounting/accounting.service.ts` لتصحيح فلتر `centerId` nullable بصيغة Prisma الصحيحة `OR` بدل وضع `null` داخل `in`.
  - لم يتم تعديل `schema.prisma`.
  - لم يتم تعديل `finance-v2`.
- Accounting module check:
  - `accountingRouter` مسجل في `backend/src/app/router.ts`.
  - endpoints الستة موجودة:
    - `GET /accounting/accounts`
    - `GET /accounting/journal-entries`
    - `POST /accounting/journal-entries`
    - `POST /accounting/journal-entries/:id/post`
    - `GET /accounting/ledger`
    - `GET /accounting/trial-balance`
  - الصلاحيات محصورة في `Role.SUPER_ADMIN` و`Role.CENTER_ADMIN`.
  - لا توجد صلاحيات Mobile roles.
  - لا توجد imports مكسورة بعد نجاح backend `tsc`.
- Frontend validation:
  - `npm run build`: نجح.
  - `npx.cmd tsc --noEmit`: نجح.
- Seed:
  - لم يتم تشغيل seed.
- نتيجة FA-1:
  - FA-1 أصبح قابلًا للاعتماد بعد نجاح generate وPrisma checks وbackend/frontend checks.
