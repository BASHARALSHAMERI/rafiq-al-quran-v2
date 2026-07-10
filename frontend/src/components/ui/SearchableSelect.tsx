import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SearchableSelectOption = {
  value: string | number;
  label: string;
};

export type SearchableSelectProps = {
  label?: string;
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  dir?: "rtl" | "ltr";
  className?: string;
  allowClear?: boolean;
};

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  dir = "rtl",
  className = "",
  allowClear = false,
}: SearchableSelectProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch(""); // Reset search when clicking outside
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (val: string | number | null) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`} dir={dir}>
      {label && (
        <label htmlFor={uid} className="text-sm font-semibold block mb-1">
          {label}
        </label>
      )}
      <div
        className={`flex items-center ctr-form-input glass-input transition-colors p-0 overflow-hidden ${
          open ? "ring-2 ring-emerald-500/50 border-emerald-500" : ""
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          id={uid}
          type="text"
          required={required && !value}
          disabled={disabled}
          className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm w-full text-slate-800 dark:text-slate-200"
          placeholder={displayValue || placeholder}
          value={open ? search : displayValue}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
              inputRef.current?.blur();
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (filtered.length > 0) {
                select(filtered[0].value);
              }
            }
          }}
          autoComplete="off"
        />
        {allowClear && value && !open && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            className="px-2 py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            onClick={(e) => {
              e.stopPropagation();
              select(null);
            }}
          >
            &times;
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          className="px-2 py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-s border-slate-200 dark:border-slate-700/50"
          onClick={() => {
            if (disabled) return;
            setOpen(!open);
            if (!open) {
              setSearch("");
              inputRef.current?.focus();
            }
          }}
        >
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {allowClear && (
            <button
              type="button"
              className={`w-full text-start px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-500`}
              onClick={() => select(null)}
            >
              <span className="ms-[22px] italic">{dir === "rtl" ? "بدون تحديد" : "None"}</span>
            </button>
          )}
          {filtered.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              className={`w-full text-start px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${
                opt.value === value ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold" : "text-slate-700 dark:text-slate-200"
              }`}
              onClick={() => select(opt.value)}
            >
              {opt.value === value && <Check size={14} className="text-primary-600 dark:text-primary-400 shrink-0" />}
              <span className={opt.value === value ? "" : "ms-[22px]"}>{opt.label}</span>
            </button>
          ))}
          {!filtered.length && (
            <div className="px-3 py-3 text-sm text-slate-400 text-center">
              {dir === "rtl" ? "لا توجد نتائج" : "No results"}
            </div>
          )}
        </div>
      )}

      {/* Hidden native input for form validation */}
      <input
        type="text"
        tabIndex={-1}
        required={required}
        value={value || ""}
        onChange={() => {}}
        className="sr-only"
        aria-hidden
      />
    </div>
  );
}
