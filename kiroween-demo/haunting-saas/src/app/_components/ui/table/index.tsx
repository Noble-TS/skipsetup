import React from "react";
import type { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

const Table: React.FC<TableProps> = ({ children, className = "" }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`.trim()}
      >
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = "",
}) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`.trim()}>
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className = "" }) => {
  return (
    <tbody
      className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`.trim()}
    >
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({
  children,
  className = "",
  onClick,
}) => {
  return (
    <tr
      className={`${onClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
  colSpan,
  rowSpan,
}) => {
  const CellTag = isHeader ? "th" : "td";

  const baseStyles = "px-6 py-4 whitespace-nowrap text-sm";
  const headerStyles =
    "text-left font-medium text-gray-900 dark:text-white uppercase tracking-wider";
  const cellStyles = "text-gray-700 dark:text-gray-300";

  const styles = isHeader ? headerStyles : cellStyles;

  return (
    <CellTag
      className={`${baseStyles} ${styles} ${className}`.trim()}
      colSpan={colSpan}
      rowSpan={rowSpan}
      scope={isHeader ? "col" : undefined}
    >
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
