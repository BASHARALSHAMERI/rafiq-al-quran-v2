# دليل الانتقال إلى Bull Queue

## الوضع الحالي
- `job-runner.ts` يستخدم `setInterval` (كل 5 دقائق)
- لا يوجد persistency أو retry mechanism
- إذا تعطل السيرفر، تُفقد المهام المجدولة

## الملفات الجديدة (Ready)
- `src/queues/queue.ts` - تعريف Queue
- `src/queues/processors/auto-absence.processor.ts` - معالج

## خطوات التفعيل (Future)

### 1. تثبيت Dependencies
```bash
npm install bull ioredis
npm install -D @types/bull
```

### 2. إضافة REDIS_URL إلى .env
```env
REDIS_URL=redis://localhost:6379
```

### 3. تعديل `src/config/env.ts`
أضف:
```typescript
REDIS_URL: z.string().optional()
```

### 4. تعديل `src/app/server.ts`
استورد الـ Processors وشغّل Queue:
```typescript
import "../queues/processors/auto-absence.processor";
import { autoAbsenceQueue } from "../queues/queue";

// في بدء التشغيل:
autoAbsenceQueue.add({}, { repeat: { cron: "0 */5 * * * *" } });
```

### 5. إيقاف `job-runner.ts` القديم
```typescript
// في server.ts، استبدل:
// startBackgroundJobs();
// بـ:
// (تم الاستبدال بـ Bull Queue)
```

### 6. Graceful Shutdown
```typescript
process.on("SIGTERM", async () => {
  await closeQueues();
  server.close();
});
```

## الفوائد
- ✅ Persistency (Redis)
- ✅ Retry mechanism (3 attempts + exponential backoff)
- ✅ Job Dashboard (Bull Board)
- ✅ Horizontal scaling (multiple workers)
