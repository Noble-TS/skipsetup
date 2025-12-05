"use client";
import type React from "react";
import { useEffect, useRef, useCallback } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right" | "center";
  width?: "sm" | "md" | "lg" | "full";
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  position = "right",
  width = "md",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const positionClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 transform -translate-x-1/2",
  };

  const widthClasses = {
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    full: "w-full",
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    },
    [onClose],
  );

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);

      // Prevent body scroll when dropdown is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, handleClickOutside, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`shadow-theme-lg absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${positionClasses[position]} ${widthClasses[width]} ${className}`}
    >
      {children}
    </div>
  );
};
