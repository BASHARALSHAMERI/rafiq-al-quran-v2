# Backend Ops Runbook (MVP)

This runbook covers day-1/day-2 operations for `rafiq-al-quran-v2` backend.

## 1) Basic Health Checks

```bash
curl -s http://localhost:4000/system/health
curl -s http://localhost:4000/system/ready
curl -s http://localhost:4000/system/version
curl -s http://localhost:4000/system/info
```

- `system/health`: process-level health + uptime.
- `system/ready`: DB connectivity gate.
- `system/version`: release identity.
- `system/info`: non-sensitive runtime metadata (env/docs/metrics flags).

## 2) Structured Logs and Request Correlation

All HTTP logs are JSON and include at least:

- `request_id`
- `method`
- `path`
- `status`
- `duration_ms`
- `user_id` (if resolved by auth middleware)
- `role` (if resolved)

Error responses include `error.requestId`. Use it to trace:

1. Copy `requestId` from API error payload.
2. Search logs for `request_id=<value>` (or JSON match in log aggregator).
3. Inspect the matching line with `msg=request_failed` and `code/status`.

## 3) Metrics Endpoint

Endpoint: `GET /metrics`

Behavior:

- If `METRICS_ENABLED=false` => endpoint is not exposed (returns `404`).
- If enabled and basic credentials configured => Basic Auth required.
- If enabled and no basic credentials => allowed only in `development`.

Examples:

```bash
curl -s http://localhost:4000/metrics
curl -u "$METRICS_BASIC_USER:$METRICS_BASIC_PASS" -s http://localhost:4000/metrics
```

Key metrics:

- `http_requests_total{method,path,status}`
- `http_request_duration_ms_count/sum/max{method,path}`
- `app_errors_total{code,status}`
- `uploads_total{source}`
- `uploads_rejected_total{source}`
- `rate_limited_total`

## 4) Retention Operations

Retention is executed manually/scheduled externally (cron/PM2), not inside app runtime.

### Audit logs retention

```bash
cd backend
npm run ops:retention:audit
```

Controls:

- `AUDIT_RETENTION_DAYS` (default: `90`)
- `RETENTION_BATCH_SIZE` (default: `5000`)

### Reports exports retention

```bash
cd backend
npm run ops:retention:exports
```

Controls:

- `EXPORT_RETENTION_DAYS` (default: `30`)
- `RETENTION_BATCH_SIZE` (default: `5000`)

The script removes stale report files from disk and database, then prunes old `report_runs` entries that no longer reference output files.

## 5) Troubleshooting Checklists

### If API is slow

1. Check `system/ready` first (DB state).
2. Check logs for `msg=slow_request` and high `duration_ms`.
3. Inspect `http_request_duration_ms_max` per `method/path` in `/metrics`.
4. Identify scope-heavy endpoints (`/reports/*`, `/audit`, `/library/*`) and DB load.

### If 500 errors increase

1. Check `app_errors_total{code="INTERNAL_SERVER_ERROR"}` trend.
2. Search logs by `msg=request_failed` and the most frequent `code/status`.
3. Correlate with `request_id` from client errors.
4. Validate DB readiness and infra dependencies before redeploy/rollback.

## 6) Recommended External Scheduling (example)

```bash
# Daily at 03:10
10 3 * * * cd /srv/rafiq/backend && npm run ops:retention:audit

# Daily at 03:25
25 3 * * * cd /srv/rafiq/backend && npm run ops:retention:exports
```
