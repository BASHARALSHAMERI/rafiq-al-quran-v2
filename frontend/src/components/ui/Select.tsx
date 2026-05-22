import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  type SelectHTMLAttributes,
  useId
} from "react";

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  placeholder?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      fullWidth = true,
      placeholder,
      options,
      className = "",
      id,
      children,
      ...props
    },
    ref
  ) => {
    const uniqueId = useId();
    const selectId = id || `select-${uniqueId}`;
    const hasError = Boolean(error);
    const isDisabled = Boolean(props.disabled);

    const wrapperClasses = [
      "select-wrapper",
      fullWidth ? "select-full" : "",
      leftIcon ? "select-has-left-icon" : "",
      hasError ? "select-error" : "",
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
        {label ? (
          <label htmlFor={selectId} className="input-label">
            {label}
          </label>
        ) : null}

        <div className="select-container">
          {leftIcon ? <span className="select-icon select-icon-left">{leftIcon}</span> : null}
          <select
            ref={ref}
            id={selectId}
            className="select-field"
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={
              hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options
              ? options.map((option) => (
                  <option key={String(option.value)} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <span className="select-icon select-icon-chevron" aria-hidden="true">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {helperText && !hasError ? (
          <span id={`${selectId}-helper`} className="input-helper">
            {helperText}
          </span>
        ) : null}

        {hasError ? (
          <span id={`${selectId}-error`} className="input-error-text" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
