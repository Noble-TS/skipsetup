import type React from "react";
import { twMerge } from "tailwind-merge";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  labelClassName?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  labelClassName = "",
  disabled = false,
}) => {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label
      htmlFor={checkboxId}
      className={twMerge(
        "group flex cursor-pointer items-center space-x-3 select-none",
        disabled ? "cursor-not-allowed opacity-60" : "",
      )}
    >
      <div className="relative h-5 w-5 flex-shrink-0">
        <input
          id={checkboxId}
          type="checkbox"
          className={twMerge(
            "peer h-5 w-5 appearance-none rounded-md border transition-all duration-200",
            // Light Mode Defaults
            "border-gray-300 bg-white checked:border-transparent checked:bg-emerald-600",
            // Dark Mode / Glass Defaults
            "dark:border-white/20 dark:bg-black/20 dark:checked:bg-emerald-500",
            // Hover states
            !disabled &&
              "group-hover:border-emerald-400 dark:group-hover:border-emerald-400",
            // Custom overrides
            className,
          )}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />

        {/* Checkmark Icon */}
        <svg
          className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 transform opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white dark:text-white"
          />
        </svg>
      </div>

      {label && (
        <span
          className={twMerge(
            "text-sm font-medium transition-colors",
            "text-gray-700 dark:text-gray-300",
            disabled
              ? "text-gray-400"
              : "group-hover:text-gray-900 dark:group-hover:text-white",
            labelClassName,
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
