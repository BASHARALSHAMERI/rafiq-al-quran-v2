import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
export type ButtonSize = "sm" | "md" | "lg";
export const BUTTON_VARIANTS = ["primary", "secondary", "ghost", "danger", "success", "warning"] as const;
export const BUTTON_SIZES = ["sm", "md", "lg"] as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "btn";

  const variantStyles: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    success: "btn-success",
    warning: "btn-warning"
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg"
  };

  const classes = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "btn-full" : "",
    isLoading ? "btn-loading" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      data-variant={variant}
      data-size={size}
      data-loading={isLoading ? "true" : "false"}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <span className="btn-spinner" aria-hidden="true" />}
      {!isLoading && leftIcon && <span className="btn-icon-left">{leftIcon}</span>}
      <span className="btn-text">{children}</span>
      {!isLoading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
}

export default Button;
