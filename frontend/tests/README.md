# UI Testing Guide

يوضح هذا الدليل كيفية تشغيل ومتابعة اختبارات الواجهة (Playwright) بشكل بصري لمشروع رفقاء القرآن.

## طرق تشغيل الاختبارات:

### 1. تشغيل الاختبار العادي (في الخلفية)
هذا الأمر لتشغيل الاختبارات بسرعة بدون فتح واجهة المتصفح، وهو مناسب للتحقق السريع.
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright test tests/crud.spec.ts
```

### 2. تشغيل الاختبار المرئي (Headed Mode)
هذا الأمر يفتح متصفح Chrome أمامك أثناء التشغيل لتتمكن من رؤية الخطوات وهي تُنفذ (تسجيل الدخول، فتح الصفحات، النقر على الأزرار) بصرياً.
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright test tests/crud.spec.ts --headed
```

### 3. تشغيل الاختبار من واجهة Playwright UI (وضع UI)
يفتح هذا الأمر واجهة متقدمة تسمح لك برؤية جميع الاختبارات وتشغيلها يدويًا وتتبع كل خطوة مع رؤية حالة الـ DOM والـ Network والـ Console لكل ثانية من الاختبار.
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright test tests/crud.spec.ts --ui
```

### 4. وضع التتبع خطوة بخطوة (Debug Mode)
استخدم هذا الوضع إذا أردت إيقاف الاختبار في نقاط معينة والتقدم خطوة بخطوة لمشاهدة ما يحدث بدقة واستكشاف الأخطاء.
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright test tests/crud.spec.ts --debug
```

### 5. عرض تقرير النتائج
بعد انتهاء التشغيل، يمكنك فتح هذا التقرير لرؤية النتيجة الكاملة (ناجح/فاشل) ومدة الاختبار.
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright show-report
```

### 6. تشغيل الاختبار مع تسجيل كامل (Trace on)
```powershell
cd C:\dev\rafiq-al-quran-v2\frontend
npx playwright test tests/crud.spec.ts --trace on
npx playwright show-report
```
