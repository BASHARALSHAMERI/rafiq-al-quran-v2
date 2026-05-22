import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";

export type CreatableComboboxProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  dir?: "rtl" | "ltr";
  className?: string;
};

export default function CreatableCombobox({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  dir,
  className = "",
}: CreatableComboboxProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate = search.trim() && !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (val: string) => {
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
        className={`flex items-center border rounded-lg transition-colors ${
          open ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200"
        } ${disabled ? "opacity-50 pointer-events-none bg-slate-50" : "bg-white"}`}
      >
        <input
          ref={inputRef}
          id={uid}
          type="text"
          required={required && !value}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-transparent outline-none text-sm"
          placeholder={value || placeholder}
          value={open ? search : value}
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
              inputRef.current?.blur();
            }
            if (e.key === "Enter" && open) {
              e.preventDefault();
              if (showCreate && search.trim()) {
                select(search.trim());
              } else if (filtered.length > 0) {
                select(filtered[0]);
              }
            }
          }}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          className="px-2 text-slate-400 hover:text-slate-600"
          onClick={() => {
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }}
        >
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`w-full text-start px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                opt === value ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-700"
              }`}
              onClick={() => select(opt)}
            >
              {opt === value && <Check size={14} className="text-brand-600 shrink-0" />}
              <span className={opt === value ? "" : "ms-[22px]"}>{opt}</span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              className="w-full text-start px-3 py-2 text-sm hover:bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-2 border-t border-slate-100"
              onClick={() => select(search.trim())}
            >
              <Plus size={14} className="shrink-0" />
              <span>{search.trim()}</span>
            </button>
          )}
          {!filtered.length && !showCreate && (
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
        value={value}
        onChange={() => {}}
        className="sr-only"
        aria-hidden
      />
    </div>
  );
}
