# Backend Production Baseline

This document describes the runtime baseline introduced in phase **2.18**.

## 1) Environment Files

Use the matching template:

- `.env.example` for local/dev
- `.env.staging.example` for staging
- `.env.production.example` for production

All variables in these templates are aligned with `src/config/env.ts`.

## 2) Build and Run

```bash
cd backend
npm ci
npm run build
node dist/app/server.js
```

## 3) PM2 (recommended process manager)

```bash
pm2 start dist/app/server.js --name rafiq-backend --time
pm2 save
pm2 startup
```

## 4) API Contract and Docs

- Swagger UI: `GET /docs` (when `DOCS_ENABLED=true`)
- OpenAPI JSON: `GET /openapi.json`
- OpenAPI YAML: `GET /openapi.yaml`

Export static artifacts:

```bash
cd backend
npm run docs:export
```

Artifacts are generated at:

- `backend/docs/openapi.json`
- `backend/docs/openapi.yaml`

## 5) Flutter Client Generation (later)

After exporting OpenAPI files, generate a Dart client with your preferred generator, for example:

```bash
openapi-generator-cli generate \
  -i backend/docs/openapi.yaml \
  -g dart-dio \
  -o mobile/generated/api_client
```

> This phase only provides the contract and export artifacts; Flutter integration is intentionally deferred.

## 6) Observability and Ops (phase 2.19)

- Metrics endpoint: `GET /metrics` (controlled by `METRICS_ENABLED` and optional basic auth).
- Ops runbook: `backend/docs/ops.md`.
- Retention scripts:
  - `npm run ops:retention:audit`
  - `npm run ops:retention:exports`
