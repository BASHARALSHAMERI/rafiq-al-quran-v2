import { HelpCircle } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";

export interface FieldTooltipProps {
  /** Tooltip content — can be a string or any ReactNode */
  content: ReactNode;
  /** Icon size in pixels (default 14) */
  size?: number;
  /** Preferred popup direction when space allows (default "top") */
  direction?: "top" | "bottom";
  /** Extra class on the root wrapper */
  className?: string;
}

/**
 * FieldTooltip
 * ------------
 * A small ⓘ icon that reveals an explanatory popup on hover or keyboard focus.
 * - Zero external dependencies (pure CSS + React state)
 * - RTL-aware via CSS [dir="rtl"] selectors
 * - Dark-mode aware via [data-theme="dark"]
 * - Accessible: role="tooltip", aria-describedby
 */
export function FieldTooltip({
  content,
  size = 14,
  direction = "top",
  className = ""
}: FieldTooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setVisible(true);
  };

  const hide = () => {
    // Small delay so moving between icon → popup doesn't dismiss it
    hideTimeout.current = setTimeout(() => setVisible(false), 80);
  };

  return (
    <span
      className={`field-tooltip ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className="field-tooltip__trigger"
        aria-describedby={visible ? tooltipId : undefined}
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
      >
        <HelpCircle size={size} aria-hidden="true" />
        <span className="sr-only">معلومات إضافية</span>
      </button>

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`field-tooltip__popup field-tooltip__popup--${direction}`}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export default FieldTooltip;
