import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const uniqueId = useId();
    const inputId = id || `input-${uniqueId}`;
    const hasError = Boolean(error);
    const isDisabled = Boolean(props.disabled);

    const wrapperClasses = [
      "input-wrapper",
      fullWidth ? "input-full" : "",
      leftIcon ? "input-has-left-icon" : "",
      rightIcon ? "input-has-right-icon" : "",
      hasError ? "input-error" : "",
      className
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={wrapperClasses}
        data-invalid={hasError ? "true" : "false"}
        data-disabled={isDisabled ? "true" : "false"}
      >
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <div className="input-container">
          {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className="input-field"
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightIcon && <span className="input-icon input-icon-right">{rightIcon}</span>}
        </div>
        {helperText && !hasError && (
          <span id={`${inputId}-helper`} className="input-helper">
            {helperText}
          </span>
        )}
        {hasError && (
          <span id={`${inputId}-error`} className="input-error-text" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
