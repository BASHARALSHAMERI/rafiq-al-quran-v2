type RequestCounterKey = `${string}|${string}|${number}`;
type DurationKey = `${string}|${string}`;
type ErrorKey = `${string}|${number}`;
type UploadKey = string;

type DurationStats = {
  count: number;
  sumMs: number;
  maxMs: number;
};

const requestCounters = new Map<RequestCounterKey, number>();
const requestDurationStats = new Map<DurationKey, DurationStats>();
const errorCounters = new Map<ErrorKey, number>();
const uploadCounters = new Map<UploadKey, number>();
const uploadRejectedCounters = new Map<UploadKey, number>();

let rateLimitedTotal = 0;

const escapeLabelValue = (value: string) => {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
};

const formatLabels = (labels: Record<string, string | number>) => {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));

  if (!entries.length) {
    return "";
  }

  const values = entries.map(([key, value]) => `${key}="${escapeLabelValue(String(value))}"`);
  return `{${values.join(",")}}`;
};

const incrementCounter = <TKey extends string>(
  map: Map<TKey, number>,
  key: TKey,
  value = 1
) => {
  map.set(key, (map.get(key) ?? 0) + value);
};

const normalizedPath = (path: string) => {
  const withoutQuery = (path.split("?")[0] ?? "/").trim() || "/";
  const parts = withoutQuery.split("/");
  const normalizedParts = parts.map((part) => {
    if (!part) {
      return "";
    }

    if (/^\d+$/.test(part)) {
      return ":id";
    }

    if (/^[0-9a-f]{24,}$/i.test(part)) {
      return ":id";
    }

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(part)) {
      return ":id";
    }

    return part;
  });

  const joined = normalizedParts.join("/");
  return joined.startsWith("/") ? joined : `/${joined}`;
};

const renderCounterMap = (
  map: Map<string, number>,
  metricName: string,
  labelsFactory: (key: string) => Record<string, string | number>
) => {
  const lines: string[] = [];
  const keys = [...map.keys()].sort();

  for (const key of keys) {
    const value = map.get(key);

    if (value === undefined) {
      continue;
    }

    const labels = formatLabels(labelsFactory(key));
    lines.push(`${metricName}${labels} ${value}`);
  }

  return lines;
};

export const metrics = {
  recordHttpRequest(input: {
    method: string;
    path: string;
    status: number;
    durationMs: number;
  }) {
    const method = input.method.toUpperCase();
    const path = normalizedPath(input.path);
    const status = Number(input.status);
    const requestKey: RequestCounterKey = `${method}|${path}|${status}`;
    incrementCounter(requestCounters, requestKey);

    const durationKey: DurationKey = `${method}|${path}`;
    const existing = requestDurationStats.get(durationKey) ?? {
      count: 0,
      sumMs: 0,
      maxMs: 0
    };

    existing.count += 1;
    existing.sumMs += input.durationMs;
    existing.maxMs = Math.max(existing.maxMs, input.durationMs);
    requestDurationStats.set(durationKey, existing);
  },

  recordError(input: { code: string; status: number }) {
    const key: ErrorKey = `${input.code}|${input.status}`;
    incrementCounter(errorCounters, key);
  },

  recordUploadAccepted(source: string) {
    incrementCounter(uploadCounters, source || "unknown");
  },

  recordUploadRejected(source: string) {
    incrementCounter(uploadRejectedCounters, source || "unknown");
  },

  recordRateLimited() {
    rateLimitedTotal += 1;
  },

  renderPrometheus() {
    const lines: string[] = [
      "# HELP http_requests_total Total number of HTTP requests handled by the API.",
      "# TYPE http_requests_total counter"
    ];

    lines.push(
      ...renderCounterMap(requestCounters, "http_requests_total", (key) => {
        const [method, path, status] = key.split("|");
        return {
          method,
          path,
          status
        };
      })
    );

    lines.push(
      "# HELP http_request_duration_ms_count Count of HTTP request duration observations.",
      "# TYPE http_request_duration_ms_count counter"
    );

    const durationKeys = [...requestDurationStats.keys()].sort();
    for (const key of durationKeys) {
      const [method, path] = key.split("|");
      const stats = requestDurationStats.get(key);

      if (!stats) {
        continue;
      }

      const labels = formatLabels({ method, path });
      lines.push(`http_request_duration_ms_count${labels} ${stats.count}`);
    }

    lines.push(
      "# HELP http_request_duration_ms_sum Sum of HTTP request durations in milliseconds.",
      "# TYPE http_request_duration_ms_sum counter"
    );

    for (const key of durationKeys) {
      const [method, path] = key.split("|");
      const stats = requestDurationStats.get(key);

      if (!stats) {
        continue;
      }

      const labels = formatLabels({ method, path });
      lines.push(`http_request_duration_ms_sum${labels} ${Number(stats.sumMs.toFixed(3))}`);
    }

    lines.push(
      "# HELP http_request_duration_ms_max Maximum observed HTTP request duration in milliseconds.",
      "# TYPE http_request_duration_ms_max gauge"
    );

    for (const key of durationKeys) {
      const [method, path] = key.split("|");
      const stats = requestDurationStats.get(key);

      if (!stats) {
        continue;
      }

      const labels = formatLabels({ method, path });
      lines.push(`http_request_duration_ms_max${labels} ${Number(stats.maxMs.toFixed(3))}`);
    }

    lines.push(
      "# HELP app_errors_total Total number of application errors emitted by error middleware.",
      "# TYPE app_errors_total counter"
    );

    lines.push(
      ...renderCounterMap(errorCounters, "app_errors_total", (key) => {
        const [code, status] = key.split("|");
        return {
          code,
          status
        };
      })
    );

    lines.push(
      "# HELP uploads_total Total number of accepted upload attempts.",
      "# TYPE uploads_total counter"
    );
    lines.push(...renderCounterMap(uploadCounters, "uploads_total", (key) => ({ source: key })));

    lines.push(
      "# HELP uploads_rejected_total Total number of rejected upload attempts.",
      "# TYPE uploads_rejected_total counter"
    );
    lines.push(
      ...renderCounterMap(uploadRejectedCounters, "uploads_rejected_total", (key) => ({ source: key }))
    );

    lines.push("# HELP rate_limited_total Total number of requests rejected by rate limiter.");
    lines.push("# TYPE rate_limited_total counter");
    lines.push(`rate_limited_total ${rateLimitedTotal}`);

    lines.push("# HELP process_uptime_seconds Node.js process uptime in seconds.");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds ${Number(process.uptime().toFixed(3))}`);

    return `${lines.join("\n")}\n`;
  }
};
