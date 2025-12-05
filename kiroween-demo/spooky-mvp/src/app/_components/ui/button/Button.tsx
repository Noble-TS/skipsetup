import React from "react";
import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?:
    | "primary"
    | "outline"
    | "ghost"
    | "gold"
    | "maroon"
    | "t3-purple"
    | "glass";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium gap-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base font-semibold",
  };

  const variantClasses = {
    primary:
      "bg-brand-600 text-white shadow-lg hover:bg-brand-700 hover:shadow-brand-500/20 focus:ring-brand-500",
    outline:
      "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-white/5",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",

    gold: "bg-[#a68c5a] text-white shadow-md hover:bg-[#8B7500] hover:shadow-lg border border-amber-600/20",
    maroon:
      "bg-[#8B0000] text-white shadow-md hover:bg-[#700000] hover:shadow-lg border border-red-900/20",

    "t3-purple":
      "bg-[hsl(280,100%,70%)] text-[#2e026d] shadow-[0_0_20px_-5px_hsl(280,100%,70%,0.5)] hover:bg-[hsl(280,100%,75%)] hover:shadow-[0_0_25px_-5px_hsl(280,100%,70%,0.7)] border border-transparent font-bold",
    glass:
      "bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 hover:border-white/30 shadow-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={twMerge(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 -ml-1 h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {!isLoading && startIcon && (
        <span className="flex items-center">{startIcon}</span>
      )}
      {children}
      {!isLoading && endIcon && (
        <span className="flex items-center">{endIcon}</span>
      )}
    </button>
  );
};

export default Button;
