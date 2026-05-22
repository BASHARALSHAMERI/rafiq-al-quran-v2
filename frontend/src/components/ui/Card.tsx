/**
 * ═════════════════════════════════════════════════════════════════
 * CARD SYSTEM - Enterprise Grade
 * نظام بطاقات احترافي موحد
 * ═════════════════════════════════════════════════════════════════
 */

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =================================================================
// BASE CARD COMPONENT
// =================================================================

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: "default" | "metric" | "interactive" | "ghost";
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = "default",
  children,
  className = "",
  ...props
}: CardProps) {
  const baseClasses = "card-enterprise";
  const variantClasses = {
    default: "card-default",
    metric: "card-metric",
    interactive: "card-interactive",
    ghost: "card-ghost",
  };

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      whileHover={variant === "interactive" ? { y: -2, boxShadow: "var(--shadow-card-hover)" } : undefined}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// =================================================================
// CARD HEADER
// =================================================================

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, icon: Icon, action }: CardHeaderProps) {
  return (
    <div className="card-header-enterprise">
      <div className="card-header-content">
        {Icon && (
          <div className="card-header-icon">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="card-header-text">
          <h3 className="card-header-title">{title}</h3>
          {subtitle && <p className="card-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
}

// =================================================================
// CARD METRIC (KPI)
// =================================================================

interface CardMetricProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "info";
}

export function CardMetric({
  value,
  label,
  icon: Icon,
  trend,
  variant = "default",
}: CardMetricProps) {
  const variantClasses = {
    default: "metric-variant-default",
    success: "metric-variant-success",
    warning: "metric-variant-warning",
    info: "metric-variant-info",
  };

  return (
    <Card variant="metric" className={variantClasses[variant]}>
      <div className="card-metric-content">
        <div className="card-metric-icon-wrapper">
          <Icon className="card-metric-icon" />
        </div>
        <div className="card-metric-data">
          <span className="card-metric-value">{value}</span>
          <span className="card-metric-label">{label}</span>
        </div>
      </div>
      {trend && (
        <div className={`card-metric-trend ${trend.isPositive ? "trend-up" : "trend-down"}`}>
          {trend.isPositive ? (
            <TrendingUp className="trend-icon" />
          ) : (
            <TrendingDown className="trend-icon" />
          )}
          <span className="trend-value">{trend.value}%</span>
          {trend.label && <span className="trend-label">{trend.label}</span>}
        </div>
      )}
    </Card>
  );
}

// =================================================================
// CARD CONTENT
// =================================================================

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function CardContent({ children, className = "", noPadding = false }: CardContentProps) {
  return (
    <div className={`card-content ${noPadding ? "card-content-no-padding" : ""} ${className}`}>
      {children}
    </div>
  );
}

// =================================================================
// CARD FOOTER
// =================================================================

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

// =================================================================
// SKELETON CARD
// =================================================================

interface SkeletonCardProps {
  lines?: number;
  hasHeader?: boolean;
}

export function SkeletonCard({ lines = 3, hasHeader = true }: SkeletonCardProps) {
  return (
    <div className="card-enterprise card-default skeleton-card">
      {hasHeader && (
        <div className="skeleton-header">
          <div className="skeleton-circle w-[40px] h-[40px]" />
          <div className="skeleton-lines">
            <div className="skeleton-line w-[60%]" />
            <div className="skeleton-line w-[40%]" />
          </div>
        </div>
      )}
      <div className="skeleton-content">
        {Array.from({ length: lines }).map((_, i) => {
          const widthClasses = ["w-[75%]", "w-[90%]", "w-[65%]", "w-[80%]", "w-[70%]"];
          return <div key={i} className={`skeleton-line ${widthClasses[i % widthClasses.length]}`} />;
        })}
      </div>
    </div>
  );
}

// =================================================================
// EMPTY STATE CARD
// =================================================================

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyStateCard({ icon: Icon, title, description, action }: EmptyStateCardProps) {
  return (
    <div className="card-enterprise card-ghost empty-state-card">
      <div className="empty-state-icon-wrapper">
        <Icon className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default Card;
