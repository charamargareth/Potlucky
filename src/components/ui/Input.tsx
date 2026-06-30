import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-11 rounded-xl border border-pink-soft bg-glass px-4 text-[15px] text-ink placeholder:text-ink-soft/60 outline-none focus:border-pink-strong transition-colors ${
            error ? "border-amber" : ""
          } ${className}`}
          {...props}
        />
        {hint && !error && (
          <span className="text-xs text-ink-soft">{hint}</span>
        )}
        {error && <span className="text-xs text-amber font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
