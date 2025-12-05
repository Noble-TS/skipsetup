import type React from "react";
import Link from "next/link";

interface DropdownItemProps {
  tag?: "a" | "button";
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  onItemClick?: () => void;
  baseClassName?: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  href,
  onClick,
  onItemClick,
  baseClassName = "block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors",
  className = "",
  disabled = false,
  children,
}) => {
  const combinedClasses =
    `${baseClassName} ${className} ${disabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`.trim();

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (tag === "button") {
      event.preventDefault();
    }

    if (onClick) {
      onClick(event);
    }

    if (onItemClick) {
      onItemClick();
    }
  };

  if (tag === "a" && href) {
    return (
      <Link
        href={disabled ? "#" : href}
        className={combinedClasses}
        onClick={handleClick}
        aria-disabled={disabled}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={combinedClasses}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
