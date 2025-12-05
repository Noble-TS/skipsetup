import React from "react";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  success?: boolean;
  error?: boolean;
  hint?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input: FC<InputProps> = ({
  id,
  className = "",
  disabled = false,
  success = false,
  error = false,
  hint,
  startIcon,
  endIcon,
  ...props
}) => {
  // Base classes with Glassmorphism readiness
  const baseStyles =
    "w-full h-11 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50";

  // State-based Styling
  const stateStyles = error
    ? "border-red-500 text-red-900 placeholder:text-red-300 focus:ring-2 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10 dark:text-red-200 dark:border-red-500/50"
    : success
      ? "border-emerald-500 text-emerald-900 placeholder:text-emerald-300 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/10 dark:text-emerald-200 dark:border-emerald-500/50"
      : "border-gray-200 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20";

  // Padding adjustment if icons are present
  const paddingStyles = twMerge(
    startIcon ? "pl-11" : "",
    endIcon ? "pr-11" : "",
  );

  return (
    <div className="w-full">
      <div className="relative">
        {startIcon && (
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {startIcon}
          </div>
        )}

        <input
          id={id}
          disabled={disabled}
          className={twMerge(baseStyles, stateStyles, paddingStyles, className)}
          {...props}
        />

        {endIcon && (
          <div className="absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            {endIcon}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {hint && (
        <p
          className={twMerge(
            "animate-in slide-in-from-top-1 fade-in-0 mt-1.5 text-xs font-medium",
            error
              ? "text-red-500"
              : success
                ? "text-emerald-500"
                : "text-gray-500 dark:text-gray-400",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
