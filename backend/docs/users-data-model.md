# Users Data Model (Decision Document)

## الهدف
إعادة تصميم بيانات المستخدمين بشكل أكاديمي وقابل للتوسع مع الحفاظ على:
- role واحد فقط لكل مستخدم الآن (بدون multi-role حاليًا)
- عدم كسر auth / RBAC / scoping الحالي
- عدم كسر endpoints الحالية بشكل رجعي
- التنفيذ عبر Prisma Migrations فقط (PostgreSQL)
- إبقاء `users.id` كـ `Int` في هذه المرحلة
- إبقاء `users.fullName` مؤقتًا كـ Deprecated mirror للتوافق، مع جعل مصدر الحقيقة الجديد هو `user_profiles.fullName`

## قرارات تنفيذية (Implementation Decisions)
- `user_profiles.gender` سيكون `nullable` في المرحلة الأولى (Migration 1)، ثم يصبح required لاحقًا في Migration 2 بعد اكتمال UI وتجميع البيانات.
- `centers.gender` (إن وُجد في نمذجة المراكز الحالية) لا يمثل User Gender، بل يمثل سياسة المركز (Center Gender Policy) مثل: `MALE_ONLY` / `FEMALE_ONLY` / `MIXED`. هذا توثيق فقط الآن (خارج نطاق تنفيذ users في هذه المرحلة).

## ملاحظة توافق مهمة (Compatibility)
- المخطط المرجعي يسمح بـ `uuid/cuid`، لكن النظام الحالي يعتمد `users.id` كـ `Int autoincrement` ويرتبط به عدد كبير من الجداول.
- القرار الآن: **الإبقاء على `users.id` كـ Int** وعدم تحويله إلى UUID في هذه المرحلة.

## المخطط النهائي المعتمد (Field Blueprint)

### 1) `users` (Auth Account) — ثابت ومحدود
- `id` (PK, Int حاليًا)
- `organizationId` (FK -> `organizations.id`)
- `email` (required, `UNIQUE` كما هو حاليًا)
- `username` (nullable `UNIQUE`)
- `passwordHash` (required)
- `role` (ENUM): `SUPER_ADMIN`, `CENTER_ADMIN`, `SUPERVISOR`, `TEACHER`, `STUDENT`, `PARENT`
- `isActive` (default true)
- `lastLoginAt` (nullable)
- `createdAt`, `updatedAt`
- `createdByUserId` (nullable FK -> `users.id`)

قيود/فهارس:
- `UNIQUE(email)`
- `UNIQUE(username)` (nullable)
- `INDEX(role)`
- `INDEX(isActive)`
- `INDEX(organizationId)`
- `INDEX(createdByUserId)`
- `INDEX(lastLoginAt)`

ملاحظة توافق:
- `users.fullName` يبقى موجودًا مؤقتًا كـ **Deprecated mirror**.

### 2) `user_profiles` (Common Profile)
- `userId` (PK/FK -> `users.id`, cascade delete)
- `fullName` (required)
- `gender` (ENUM `MALE/FEMALE`) — **nullable في المرحلة الأولى**
- `birthDate` (nullable)
- `phone` (nullable, unique nullable)
- `address` (nullable)
- `avatarUrl` (nullable)
- `createdAt`, `updatedAt`
- `createdByUserId` (nullable FK -> `users.id`)

قيود/فهارس:
- FK `userId` cascade
- `UNIQUE(phone)` (nullable)
- `INDEX(fullName)`
- `INDEX(createdByUserId)`

### 3) Role-specific Profiles

#### `teacher_profiles`
- `userId` (PK/FK)
- `hireDate` (nullable)
- `khatmType` (nullable ENUM): `HAFIZ`, `KHATEM`, `IJAZAH`, `QIRAAT`
- `riwaya` (nullable ENUM/Text seeded): `HAFS`, `WARSH`, ...
- `educationLevel` (nullable)
- `yearsExperience` (nullable int)
- `employmentStatus` (required ENUM): `ACTIVE`, `SUSPENDED`, `TRANSFERRED`
- `createdAt`, `updatedAt`, `createdByUserId`

#### `supervisor_profiles`
- `userId` (PK/FK)
- `assignedAt` (nullable)
- `status` (required ENUM): `ACTIVE`, `SUSPENDED`
- `createdAt`, `updatedAt`, `createdByUserId`

#### `center_admin_profiles`
- `userId` (PK/FK)
- `assignedAt` (nullable)
- `employmentStatus` (required ENUM): `ACTIVE`, `SUSPENDED`, `TRANSFERRED`
- `createdAt`, `updatedAt`, `createdByUserId`

#### `student_profiles`
- `userId` (PK/FK)
- `nickname` (nullable)
- `nationalId` (nullable, unique)
- `level` (required ENUM): `BEGINNER`, `INTERMEDIATE`, `ADVANCED`
- `studentStatus` (required ENUM): `REGULAR`, `DROPPED`, `GRADUATED`
- `joinDate` (nullable)
- `createdAt`, `updatedAt`, `createdByUserId`

#### `parent_profiles`
- `userId` (PK/FK)
- `relationType` (nullable ENUM/TEXT): `FATHER`, `MOTHER`, `GUARDIAN`, `OTHER`
- `createdAt`, `updatedAt`, `createdByUserId`

## العلاقات (FK)
- `users.organizationId` -> `organizations.id`
- `users.createdByUserId` -> `users.id` (`ON DELETE SET NULL`)
- `user_profiles.userId` -> `users.id` (`ON DELETE CASCADE`)
- `user_profiles.createdByUserId` -> `users.id` (`ON DELETE SET NULL`)
- لكل `*_profiles.userId` -> `users.id` (`ON DELETE CASCADE`)
- لكل `*_profiles.createdByUserId` -> `users.id` (`ON DELETE SET NULL`)

## جداول العلاقات (Relationships)
- `parent_student_links`
  - `parentUserId`, `studentUserId`, `createdAt`, `createdByUserId`
  - `UNIQUE(parentUserId, studentUserId)`
- `user_center_accesses`
  - `UNIQUE(userId, centerId)`
- `user_circle_accesses`
  - `UNIQUE(userId, circleId)`
- `student_circle_enrollments`
  - `studentUserId`, `circleId`, `status`, `startDate`, `endDate`
  - `INDEX(studentUserId, status)`

## ما الذي يبقى في `users` وما الذي ينتقل إلى profiles

يبقى في `users` (Auth/RBAC):
- `email`, `username`, `passwordHash`
- `role`, `isActive`, `lastLoginAt`
- `organizationId`
- `createdAt`, `updatedAt`, `createdByUserId`

ينتقل إلى `user_profiles` / role profiles:
- `fullName` (المصدر الجديد للحقيقة)
- `phone`, `gender`, `birthDate`, `address`, `avatarUrl`
- حقول الدور المتخصصة

توافق مرحلي:
- `users.fullName` يبقى مؤقتًا كمرآة متزامنة من `user_profiles.fullName`.

## قواعد التشغيل (المرحلة الحالية)
- عند إنشاء `user.role = TEACHER` يتم إنشاء `teacher_profiles` تلقائيًا داخل transaction.
- نفس المبدأ لباقي الأدوار.
- `role` immutable في هذه المرحلة (لا تغيير role بعد الإنشاء).
- create/update يجب ألا يكسر endpoints القديمة؛ التوسعة تكون بإضافة حقول اختيارية فقط.
- عدم تسجيل كلمات المرور أو التوكنز في logs/audit.

## استراتيجية التنفيذ (Non-breaking + Reproducible)
1. Migration 1:
   - إضافة أعمدة `users` الجديدة (`username`, `lastLoginAt`, `createdByUserId`)
   - إنشاء `user_profiles` + role profiles + enums
   - إبقاء `users.fullName`
2. Backfill Script:
   - إنشاء `user_profiles` للمستخدمين الحاليين من `users.fullName`
   - إنشاء role-profile افتراضي لكل مستخدم حسب `users.role`
   - إبقاء `gender = NULL` مؤقتًا
3. Backend compatibility:
   - القراءة ترجع `profile + roleProfile`
   - الكتابة تحدث `user_profiles.fullName` وتزامن `users.fullName`
4. Migration 2 (لاحقًا عند الحاجة):
   - Tightening constraints مثل جعل `user_profiles.gender` required بعد اكتمال البيانات

## مسار ترقية لاحقًا إلى Multi-Role
1. إنشاء `roles` (أو الاستمرار على enum حسب قرار المرحلة)
2. إنشاء `user_roles`
   - `userId`, `role`, `isPrimary`, `assignedAt`, `assignedByUserId`
   - `UNIQUE(userId, role)`
3. Backfill من `users.role` إلى `user_roles` مع `isPrimary = true`
4. الحفاظ على التوافق عبر `users.role` كـ `primaryRole` مؤقتًا أو View توافق
5. تحديث الخدمات تدريجيًا للقراءة من `user_roles`
6. إزالة الاعتماد على `users.role` لاحقًا بعد اكتمال الترحيل
