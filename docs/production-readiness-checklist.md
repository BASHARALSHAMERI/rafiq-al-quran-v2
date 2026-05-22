# Production Readiness Checklist

Use this checklist before any production deployment of Rafiq Al-Quran. The goal is to verify secrets, runtime flags, database safety, and post-deploy smoke coverage without changing application behavior during release.

## 1. Secrets And Git Hygiene

- [ ] Rotate `JWT_ACCESS_SECRET` with a new 64+ character secret.
- [ ] Rotate `JWT_REFRESH_SECRET` with a new 64+ character secret.
- [ ] Rotate the production database password away from any previously exposed value.
- [ ] Confirm `backend/.env` is not tracked by Git.
- [ ] Review Git history for committed env files or leaked secrets before release.

Recommended local secret generation:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Backend Environment Alignment

- [ ] `NODE_ENV=production`
- [ ] `DOCS_ENABLED=false`
- [ ] `METRICS_ENABLED=true`
- [ ] `RATE_LIMIT_LOGIN_MAX` is set for production traffic tolerance
- [ ] `RATE_LIMIT_LOGIN_WINDOW_MS` is aligned with the login policy
- [ ] `UPLOAD_MAX_BYTES` matches storage and reverse-proxy limits
- [ ] `PUBLIC_BASE_URL` points to the real production API host
- [ ] `CORS_ORIGIN` / `CORS_ORIGINS` include only approved production origins
- [ ] `METRICS_BASIC_USER` and `METRICS_BASIC_PASS` are set when metrics are enabled

## 3. Frontend And Mobile Environment Alignment

- [ ] `VITE_API_BASE_URL` points to the production backend
- [ ] Frontend production build completes successfully
- [ ] Mobile production flavor points to the production API, not localhost
- [ ] Mobile release build completes successfully

## 4. Database And Runtime Safety

- [ ] Production backup is available and tested before deploy
- [ ] `prisma migrate deploy` is used in production, not development migration commands
- [ ] Database connection pool sizing is reviewed for expected concurrency
- [ ] Audit retention and export retention values are aligned with operations policy
- [ ] Storage paths and upload retention jobs are configured for the production host

## 5. Deployment Commands

Backend:

```bash
cd backend
npm ci
npm run build
npm run prisma:deploy
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Mobile:

```bash
cd rafiq_mobile
flutter build apk --release
```

## 6. Post-Deploy Smoke Verification

- [ ] Health check returns `200`
- [ ] Administrator login works on web
- [ ] Teacher, supervisor, parent, and student login work on mobile
- [ ] `npm run test:smoke:rbac:critical` passes against the deployed backend
- [ ] `npm run test:smoke:finance-v2` passes against the deployed backend when finance-v2 changes are included

## 7. Release Gates

Do not mark the release ready until these environment variables are aligned across all deploy targets:

- Backend: `NODE_ENV`, `PUBLIC_BASE_URL`, `DOCS_ENABLED`, `METRICS_ENABLED`
- Frontend: `VITE_API_BASE_URL`
- Mobile: production backend base URL / flavor configuration
