import type { ReactNode } from "react";

export type BadgeVariant = 
  | "default" 
  | "primary" 
  | "secondary"
  | "success" 
  | "warning" 
  | "error" 
  | "info";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  pulse = false,
  className = ""
}: BadgeProps) {
  const classes = [
    "badge",
    `badge-${variant}`,
    `badge-${size}`,
    dot ? "badge-dot" : "",
    pulse ? "badge-pulse" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot && <span className="badge-dot-indicator" aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
