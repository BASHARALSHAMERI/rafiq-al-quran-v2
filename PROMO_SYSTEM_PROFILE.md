# رفيق القرآن — النظام المتكامل لإدارة حلقات تحفيظ القرآن
## Rafiq Al-Quran — Integrated Quran Circle Management System

---

## 🎬 Promotional Video Script Reference — Générique

### 1. Opening / المشهد الافتتاحي
**Visual:** Animated logo — "رفقاء القرآن" with Quranic calligraphy, teal/emerald gradients
**Tagline:**
- AR: منصة رقمية متكاملة لإدارة حلقات تحفيظ القرآن الكريم
- EN: A comprehensive digital platform for managing Quran memorization circles

### 2. System Overview / نظرة عامة

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend API** | Node.js, Express, TypeScript, Prisma + PostgreSQL | Business logic, RBAC, 30+ API modules |
| **Web Admin** | React 19, Vite, TypeScript, TailwindCSS | Admin dashboard for managers & finance |
| **Mobile App** | Flutter, Riverpod, Dio, GoRouter | Field app for teachers, supervisors, students & parents |

**Architecture:** Modular Monolith — Clean Architecture with Controller → Service → Repository layers

### 3. Key Features / المميزات الرئيسية

#### 3.1 Organizational Hierarchy — التسلسل التنظيمي
```
Association (جمعية)
  └── Centers (مراكز تحفيظ)
        └── Circles (حلقات)
              └── Students / Teachers / Supervisors / Parents
```

#### 3.2 Role-Based Platforms — منصات حسب الصلاحيات

| Role | Platform | Permissions |
|------|----------|-------------|
| **Super Admin** مدير النظام | Web | Full system administration |
| **Center Admin** مدير مركز | Web | Center management, reports |
| **Accountant** محاسب | Web | Financial operations |
| **Finance Manager** مدير مالي | Web | Treasury, payroll, budgets |
| **Treasurer** أمين صندوق | Web | Cash management |
| **Auditor** مدقق | Web | Audit trail review |
| **Supervisor** مشرف | Mobile | Multi-circle oversight, visit logging |
| **Teacher** معلم | Mobile | Attendance, follow-ups, plans |
| **Student** طالب | Mobile | Progress tracking, remote recitation |
| **Parent** ولي أمر | Mobile | Children progress monitoring |

### 4. Modules Walkthrough / استعراض الوحدات

#### 🏛️ Organization Management (إدارة المنظمة)
- Multi-center, multi-circle hierarchy
- Location-based center management with geo-fencing
- Staff scheduling and assignment management

#### 📚 Circle Management (إدارة الحلقات)
- Circle creation with teacher assignment
- Schedule management (prayer/time-based slots)
- Student enrollment with status tracking
- Gender-based segregation support

#### 👥 Student Management (إدارة الطلاب)
- Full student profiles with Quran level tracking (juzz/progress)
- Parent-student linking
- Enrollment lifecycle (active, transferred, graduated)
- Achievement snapshots and yearly tracking

#### 📝 Attendance System (نظام الحضور)
- **Student attendance:** Daily marking with status (present, absent, excused, late)
- **Staff attendance:** Check-in/out with geo-fencing, late/early detection
- Attendance policy engine (grace period, auto-absence, prayer-based scheduling)
- Mobile-friendly marking interface

#### 📖 Quran Exams & Grading (الامتحانات والتقييم)
- Exam creation with question bank
- Multiple exam attempts per student
- Committee-based evaluation workflow
- Grade scales configuration
- Nomination and approval workflow

#### ✅ Follow-Up System (نظام المتابعة)
- Daily/weekly student follow-up records
- Monthly plan creation and tracking
- Group achievement tracking
- Progress monitoring with teacher notes

#### 🏆 Golden Records (السجل الذهبي)
- Student achievement registry
- Approval workflow (create → submit → approve/reject)
- Graduation candidate management
- Achievement snapshots

#### 📖 Library (المكتبة)
- Category-based library item management
- Upload and distribution control
- Download tracking

#### 💰 Finance Module v2 (النظام المالي)
- **Invoices & Payments:** Student billing, payment tracking
- **Vouchers:** Receipt and disbursement vouchers with approval workflow
- **Donors & Donations:** Donor management, pledge tracking
- **Treasury:** Account balances, fund movements
- **Payroll:** Staff salary processing, batch management
- **Rewards:** Student reward profiles and batch processing
- **Expenses:** Expense categories, invoices, payments
- **Fixed Assets:** Asset registry, custody tracking, depreciation
- **Currencies & Exchange Rates:** Multi-currency support
- **Center Funding:** Inter-center fund transfers

#### 📊 Accounting Module (المحاسبة)
- Chart of Accounts (شجرة الحسابات)
- Journal Entries (قيود اليومية)
- General Ledger (دفتر الأستاذ)
- Trial Balance (ميزان المراجعة)
- Fiscal Periods & Year Close
- Voucher void with automatic journal reversal

#### 📈 Reports (التقارير)
- Donation reports
- Receipt reports
- Statement of Financial Position
- Statement of Activities
- Student monthly reports
- Custom report generation

#### 👁️ Supervisor Visits (زيارات المشرفين)
- Monthly visit planning
- Visit logging with geo-location verification
- Checklist and evaluation forms
- Teacher evaluation and circle assessment
- Plan tracking (draft → approved → completed)

#### 📡 Remote Recitation (التلاوة عن بعد)
- Slot scheduling for teachers
- Student booking system
- Join URL integration (Zoom/Meet/etc.)
- Full lifecycle: request → approve → complete

#### 👥 Group Activities (الأنشطة الجماعية)
- Activity creation with teacher assignment
- Student participation tracking
- Activity scheduling

#### 👔 Staff Operations (شؤون الموظفين)
- Staff attendance with prayer-based scheduling
- Leave requests with approval workflow
- Excuse requests management
- Staff scheduling and assignment
- Role-based access (teacher, supervisor, admin)

#### 🔔 Notifications (الإشعارات)
- System notifications with read/unread tracking
- In-app notification delivery
- Notification history

#### 🛡️ Security & Audit (الأمان والتدقيق)
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC) with data scoping
- Rate limiting and CORS protection
- Activity logging and audit trail
- Account activation workflow
- Password reset flow

#### 🌐 i18n — Arabic/English Bilingual
- Full Arabic (RTL) and English (LTR) support
- Locale-based content delivery
- Right-to-left layout handling

### 5. Technical Highlights / نقاط القوة التقنية

**Backend:**
- ✅ TypeScript throughout — full type safety
- ✅ Prisma ORM with PostgreSQL — type-safe database access
- ✅ Zod validation — runtime request validation
- ✅ Helmet security headers — production-hardened
- ✅ Rate limiting — login & general API protection
- ✅ Swagger/OpenAPI documentation
- ✅ Background job runner
- ✅ Audit & activity logging
- ✅ Data retention policies

**Frontend:**
- ✅ React 19 with Suspense lazy loading
- ✅ Framer Motion animations
- ✅ Zustand state management
- ✅ TanStack React Query — server state caching
- ✅ Lucide icons — consistent iconography
- ✅ Glassmorphism UI design (V3)
- ✅ Role-based routing with guards
- ✅ Responsive admin layout

**Mobile (Flutter):**
- ✅ Riverpod state management
- ✅ Clean Architecture (data/domain/presentation)
- ✅ GoRouter with role-based redirects
- ✅ Dio HTTP client with interceptors
- ✅ Offline-capable with local storage
- ✅ Geolocation for attendance & visits
- ✅ Hijri calendar support
- ✅ Dark/light theme support

### 6. Database Overview / نظرة على قاعدة البيانات

**50+ Models** covering:
- Organization, Centers, Circles
- Users with 10 role types + profile specializations
- Student enrollments, attendance records
- Exams, attempts, question bank, grade scales
- Finance: accounts, movements, vouchers, payroll, rewards, expenses, assets
- Accounting: chart of accounts, journal entries, fiscal periods
- Library, notifications, activity/audit logs
- Supervisor visits, schedules, leave management
- Remote recitation, group activities
- And more...

### 7. System Requirements / متطلبات التشغيل

| Resource | Specification |
|----------|-------------|
| Backend | Node.js 20+, PostgreSQL 15+ |
| Frontend | Modern browser (Chrome, Firefox, Edge) |
| Mobile | Android 7+ / iOS 15+ |
| Deployment | PM2 or Docker |

### 8. Closing / المشهد الختامي

**Visual:** Dashboard overview → mobile app transitions → happy teacher marking attendance → student progress chart → golden records celebration

**Final Tagline:**
- AR: رفيقك في رحلة الحفظ والإتقان — رفيق القرآن
- EN: Your companion in the journey of memorization and mastery — Rafiq Al-Quran

---

*Prepared for promotional video production. Last updated: June 2026*
