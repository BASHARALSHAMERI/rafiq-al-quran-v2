# نظام التصميم V4 - رفيق القرآن
## تصميم احترافي على مستوى عالمي Enterprise-Grade

---

## 🎯 فلسفة التصميم الجديدة

### منهج "الهدوء والاحترافية"
بدلاً من التصميم المبالغ فيه (Glassmorphism + Gradients الثقيلة)، نتجه نحو:
- **نظافة** (Clean): مساحات فارغة واضحة وتنظيم بصري
- **احترافية** (Professional): ألوان هادئة وتباين مناسب للقراءة
- **بساطة** (Minimal): إزالة كل ما هو زائد
- **تركيز** (Focused): التركيز على البيانات والمحتوى

### مرجع التصميم:
- **Notion**: بساطة في التخطيط
- **Linear**: سرعة في الأداء ونظافة
- **Stripe Dashboard**: احترافية في عرض البيانات

---

## 🎨 نظام الألوان

### الألوان الأساسية - هوية إسلامية محترفة

```css
/* الأخضر العميق - اللون الرئيسي */
--emerald-50: #ecfdf5;
--emerald-100: #d1fae5;
--emerald-200: #a7f3d0;
--emerald-300: #6ee7b7;
--emerald-400: #34d399;
--emerald-500: #10b981;  /* Primary Brand */
--emerald-600: #059669;
--emerald-700: #047857;
--emerald-800: #065f46;
--emerald-900: #064e3b;

/* الرمادي المحايد - الأساس */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
--slate-950: #020617;
```

### الألوان الدلالية (Semantic)

```css
/* النجاح - أخضر هادئ */
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-500: #22c55e;
--success-600: #16a34a;
--success-700: #15803d;

/* التحذير - برتقالي دافئ */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-700: #b45309;

/* الخطأ - أحمر معتدل */
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;
--error-600: #dc2626;
--error-700: #b91c1c;

/* المعلومات - أزرق محايد */
--info-50: #eff6ff;
--info-100: #dbeafe;
--info-500: #3b82f6;
--info-600: #2563eb;
--info-700: #1d4ed8;
```

### توكنات الألوان الدلالية

```css
/* الخلفيات */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-tertiary: #f1f5f9;
--bg-elevated: #ffffff;

/* النصوص */
--text-primary: #0f172a;
--text-secondary: #334155;
--text-tertiary: #64748b;
--text-disabled: #94a3b8;
--text-inverse: #ffffff;

/* الحدود */
--border-subtle: #e2e8f0;
--border-default: #cbd5e1;
--border-strong: #94a3b8;

/* البراند */
--brand-primary: #059669;
--brand-primary-hover: #047857;
--brand-primary-subtle: #d1fae5;
--brand-primary-muted: #ecfdf5;
```

---

## ✍️ نظام الطباعة (Typography)

### الخطوط

```css
/* العربي: تاجوال - عصري وواضح */
--font-arabic: "Tajawal", "IBM Plex Arabic", -apple-system, sans-serif;

/* الإنجليزي: إنتر - احترافي */
--font-english: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;

/* الكود: JetBrains Mono */
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

### سلم الأحجام (Type Scale)

```css
/* العناوين */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* الأوزان */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* الارتفاعات */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### تسلسل هرمي النصوص

| العنصر | الحجم | الوزن | الاستخدام |
|--------|-------|-------|-----------|
| H1 | 2.25rem | 700 | عناوين الصفحات الرئيسية |
| H2 | 1.875rem | 600 | عناوين الأقسام |
| H3 | 1.5rem | 600 | عناوين البطاقات |
| H4 | 1.25rem | 600 | عناوين فرعية |
| Body Large | 1.125rem | 400 | نصوص مميزة |
| Body | 1rem | 400 | النص الافتراضي |
| Body Small | 0.875rem | 400 | نصوص ثانوية |
| Caption | 0.75rem | 500 | تسميات وتعليقات |

---

## 📐 نظام المسافات (Spacing System)

### نظام 8pt Grid

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### الاستخدامات الموصى بها

| القيمة | الاستخدام |
|--------|-----------|
| 4px | مسافات داخلية صغيرة (padding) |
| 8px | مسافات بين عناصر صغيرة |
| 16px | padding افتراضي للبطاقات |
| 24px | padding للأقسام الكبيرة |
| 32px | المسافة بين الأقسام |
| 48px | المسافة بين الأقسام الرئيسية |

---

## 🟦 المكونات (Components)

### 1. الأزرار (Buttons)

```
┌─────────────────────────────────────────┐
│  Primary Button                         │
│  - bg: emerald-600                      │
│  - text: white                          │
│  - height: 40px (default) / 36px (sm)   │
│  - padding: 0 16px                      │
│  - border-radius: 8px                   │
│  - font-weight: 500                     │
└─────────────────────────────────────────┘

Variants:
- Primary: bg-emerald-600, hover:bg-emerald-700
- Secondary: bg-white, border, hover:bg-slate-50
- Ghost: transparent, hover:bg-slate-100
- Danger: bg-red-600, hover:bg-red-700
```

### 2. البطاقات (Cards)

```
┌─────────────────────────────────────────┐
│  Card Component                         │
│  - bg: white                            │
│  - border: 1px solid slate-200          │
│  - border-radius: 12px                  │
│  - shadow: none (flat design)           │
│  - padding: 24px                        │
└─────────────────────────────────────────┘

Variations:
- Default: مع حدود خفيفة
- Elevated: مع ظل خفيف (shadow-sm)
- Interactive: hover effect
```

### 3. حقول الإدخال (Inputs)

```
┌─────────────────────────────────────────┐
│  Input Field                            │
│  - height: 40px                         │
│  - padding: 0 12px                      │
│  - border: 1px solid slate-300          │
│  - border-radius: 8px                   │
│  - focus: ring-2 ring-emerald-500       │
└─────────────────────────────────────────┘

States:
- Default: border-slate-300
- Focus: border-emerald-500, ring
- Error: border-red-500
- Disabled: bg-slate-100, text-slate-400
```

### 4. الجداول (Data Tables)

```
┌──────────────┬──────────────┬──────────────┐
│  Header      │  Header      │  Header      │  ← bg-slate-50
├──────────────┼──────────────┼──────────────┤
│  Cell        │  Cell        │  Cell        │  ← hover:bg-slate-50
├──────────────┼──────────────┼──────────────┤
│  Cell        │  Cell        │  Cell        │
└──────────────┴──────────────┴──────────────┘

Specifications:
- Header: font-semibold, text-slate-700
- Row height: 52px
- Padding: 16px
- Border: 1px solid slate-200
- Hover: bg-slate-50
```

### 5. الشارات (Badges)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Default    │  │   Success    │  │    Error     │
│  bg-slate-100│  │  bg-green-100│  │  bg-red-100  │
│  text-slate-700  │  text-green-700  │  text-red-700
└──────────────┘  └──────────────┘  └──────────────┘

Sizes:
- sm: px-2 py-0.5, text-xs
- md: px-2.5 py-1, text-sm
```

---

## 📱 نظام التخطيط (Layout System)

### هيكل الصفحة

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (240px) │  Header (64px)                    │
│                  ├───────────────────────────────────┤
│  ┌──────────┐    │                                   │
│  │  Logo    │    │   Page Content                    │
│  └──────────┘    │   ┌─────────────────────────────┐ │
│                  │   │  Page Header                  │ │
│  ┌──────────┐    │   │  Title + Actions              │ │
│  │  Nav 1   │    │   └─────────────────────────────┘ │
│  │  Nav 2   │    │   ┌─────────────────────────────┐ │
│  │  Nav 3   │    │   │  Content Area                 │ │
│  └──────────┘    │   │                               │ │
│                  │   │  ┌─────────┐  ┌─────────┐    │ │
│  ┌──────────┐    │   │  │ Card 1  │  │ Card 2  │    │ │
│  │  User    │    │   │  └─────────┘  └─────────┘    │ │
│  └──────────┘    │   └─────────────────────────────┘ │
└──────────────────┴───────────────────────────────────┘
```

### القائمة الجانبية (Sidebar)

```
Width: 240px (固定)
Background: white
Border: 1px solid slate-200 (right side)

Sections:
- Logo area: height 64px
- Navigation: flex-1
- User area: height auto

Navigation Item:
- height: 40px
- padding: 0 12px
- border-radius: 8px
- icon + label gap: 12px
- Active: bg-emerald-50, text-emerald-700, border-right: 3px emerald-600
```

### رأس الصفحة (Header)

```
Height: 64px
Background: white
Border: 1px solid slate-200 (bottom)
Content:
- Breadcrumbs (left)
- Actions cluster (right)
  - Search
  - Notifications
  - Theme toggle
  - User menu
```

### منطقة المحتوى (Content Area)

```
Padding: 32px
Background: slate-50
Min-height: calc(100vh - 64px)

Page Header:
- Title: text-3xl, font-bold
- Description: text-slate-500
- Actions: buttons on right
```

---

## 🌙 الوضع المظلم (Dark Mode)

```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #e2e8f0;
  --text-tertiary: #94a3b8;
  
  /* Borders */
  --border-subtle: #334155;
  --border-default: #475569;
}
```

---

## ♿ إمكانية الوصول (Accessibility)

### متطلبات WCAG 2.1

- **التباين**: 4.5:1 للنصوص العادية، 3:1 للعناوين الكبيرة
- **الحجم**: لا يعتمد على الألوان فقط لنقل المعلومات
- **التركيز**: outline واضح عند التنقل بالكيبورد
- **الحجم**: أزرار لا تقل عن 44px × 44px للمس

### RTL Support

```css
/* دعم كامل للعربية */
html[dir="rtl"] {
  /* تحويل الاتجاهات تلقائياً */
}

/* Logical Properties */
.inline-start { /* بدلاً من left/right */ }
.inline-end { /* بدلاً من left/right */ }
.margin-inline-start { }
.border-inline-end { }
```

---

## ⚡ الأداء

### تحسينات الأداء

1. **CSS**: استخدام Tailwind CSS للـ utility classes
2. **Fonts**: تحميل الخطوط بشكل async
3. **Images**: استخدام WebP مع fallback
4. **Animations**: استخدام transform و opacity فقط
5. **Code Splitting**: تقسيم الكود حسب المسارات

### الميزات الممنوعة (Anti-patterns)

❌ Box shadows الثقيلة
❌ Gradients المعقدة
❌ Backdrop-filter (glassmorphism)
❌ Animations طويلة (>300ms)
❌ Blur effects

---

## 🗂️ هيكل الملفات الجديد

```
frontend/src/
├── styles/
│   ├── tokens/              # توكنات التصميم
│   │   ├── colors.css       # الألوان
│   │   ├── typography.css   # الطباعة
│   │   ├── spacing.css      # المسافات
│   │   └── shadows.css      # الظلال
│   ├── components/          # أنماط المكونات
│   │   ├── buttons.css
│   │   ├── cards.css
│   │   ├── inputs.css
│   │   ├── tables.css
│   │   └── badges.css
│   ├── layout/              # أنماط التخطيط
│   │   ├── sidebar.css
│   │   ├── header.css
│   │   └── page.css
│   ├── utilities.css        # classes مساعدة
│   └── index.css            # المدخل الرئيسي
├── components/
│   ├── ui/                  # مكونات أساسية
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Table.tsx
│   │   └── Skeleton.tsx
│   ├── layout/              # مكونات التخطيط
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageLayout.tsx
│   └── feedback/            # مكونات التغذية الراجعة
│       ├── Toast.tsx
│       ├── Modal.tsx
│       └── EmptyState.tsx
└── pages/                   # الصفحات (بدون تغيير في المنطق)
```

---

## 📊 مقارنة Before vs After

| الجانب | Before (V3) | After (V4) |
|--------|-------------|------------|
| **التصميم** | Glassmorphism, gradients | Flat, clean, minimal |
| **الألوان** | Teal + شفافيات | Emerald + Slate محايد |
| **الخط** | Cairo | Tajawal |
| **الأداء** | 30KB CSS, animations ثقيلة | 15KB CSS, transitions خفيفة |
| **قراءة المحتوى** | صعبة مع الخلفيات الشفافة | سهلة وواضحة |
| **الاحترافية** | مبالغ فيها | متوازنة وعصرية |
| **قابلية الصيانة** | معقد | بسيط ومنظم |

---

## 🚀 خطة التنفيذ

### المرحلة 1: نظام التصميم الأساسي
- [x] تحديد الألوان والخطوط
- [x] إنشاء توكنات CSS
- [ ] بناء مكونات UI الأساسية
- [ ] اختبار الوصول (Accessibility)

### المرحلة 2: تخطيط النظام
- [ ] إعادة تصميم Sidebar
- [ ] إعادة تصميم Header
- [ ] إعادة تصميم Page Layout
- [ ] التجاوب (Responsive)

### المرحلة 3: الصفحات
- [ ] إعادة تصميم Dashboard
- [ ] إعادة تصميم الجداول (Tables)
- [ ] إعادة تصميم النماذج (Forms)
- [ ] إعادة تصميم صفحة تسجيل الدخول

### المرحلة 4: التفاعلات
- [ ] Toast notifications
- [ ] Modal dialogs
- [ ] Loading states
- [ ] Empty states

---

**الإصدار**: 4.0 Enterprise
**التاريخ**: 2026-02-17
**الحالة**: جاهز للتنفيذ
