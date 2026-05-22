export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height
}: SkeletonProps) {
  const classes = [`skeleton skeleton-${variant}`, className].filter(Boolean).join(" ");

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return <div className={classes} style={style} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-text" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? "75%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({
  lines = 3,
  showMedia = true
}: {
  lines?: number;
  showMedia?: boolean;
}) {
  return (
    <div className="ui-card-skeleton" aria-hidden="true">
      {showMedia ? <Skeleton variant="rounded" height={176} /> : null}
      <div className="ui-card-skeleton__content">
        <Skeleton variant="text" width="60%" />
        <SkeletonText lines={2} />
        {lines > 2
          ? Array.from({ length: lines - 2 }).map((_, index) => (
              <Skeleton key={index} variant="text" width={index % 2 === 0 ? "92%" : "68%"} />
            ))
          : null}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return <CardSkeleton lines={2} showMedia />;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="ui-table-skeleton" aria-hidden="true">
      {showHeader ? (
        <div className="ui-table-skeleton__header">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} variant="text" width={index === 0 ? "72%" : "48%"} />
          ))}
        </div>
      ) : null}
      <div className="ui-table-skeleton__body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="ui-table-skeleton__row">
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${columnIndex}`}
                variant="text"
                width={columnIndex === 0 ? "88%" : columnIndex === columns - 1 ? "56%" : "70%"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KpiSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="ui-kpi-skeleton-grid" aria-hidden="true">
      {Array.from({ length: items }).map((_, index) => (
        <div key={`kpi-${index}`} className="ui-kpi-skeleton-card">
          <div className="ui-kpi-skeleton-card__header">
            <Skeleton variant="circular" width={42} height={42} />
            <Skeleton variant="text" width="32%" />
          </div>
          <Skeleton variant="text" width="48%" height={28} />
          <Skeleton variant="text" width="74%" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
