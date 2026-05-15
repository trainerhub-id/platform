/**
 * DataTable Component for Tool UI
 * Based on tool-ui.com documentation
 * Renders structured table data from AI tool responses
 */

import React, { useState, useMemo } from 'react';

export interface Column<T = any> {
  key: string;
  label: string;
  priority?: 'primary' | 'secondary';
  truncate?: boolean;
  nowrap?: boolean; // Prevent text wrapping (useful for codes like R.90PEM00.015.1)
  align?: 'left' | 'center' | 'right';
  width?: string; // Column width (e.g., '160px', 'auto')
  format?: {
    kind: 'text' | 'number' | 'date' | 'currency' | 'status' | 'link';
    dateFormat?: 'relative' | 'short' | 'long';
    currency?: string;
    decimals?: number;
    statusMap?: Record<string, { tone: string; label: string }>;
  };
}

export interface DataTableProps<T = any> {
  rowIdKey: string;
  columns: Column<T>[];
  data: T[];
  defaultSort?: { by: string; direction: 'asc' | 'desc' };
  onRowClick?: (row: T) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  rowIdKey,
  columns,
  data,
  defaultSort,
  onRowClick,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(defaultSort?.by || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortBy || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortDirection]);

  // Handle column sort
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortBy(null);
        setSortDirection(null);
      }
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  // Format cell value
  const formatValue = (value: any, column: Column<T>) => {
    if (value == null) return '-';

    const format = column.format;
    if (!format) return String(value);

    switch (format.kind) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'currency':
        return typeof value === 'number'
          ? new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: format.currency || 'IDR',
              minimumFractionDigits: format.decimals ?? 0,
            }).format(value)
          : value;
      case 'date':
        if (format.dateFormat === 'relative') {
          const date = new Date(value);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays === 0) return 'Today';
          if (diffDays === 1) return 'Yesterday';
          if (diffDays < 7) return `${diffDays} days ago`;
          return date.toLocaleDateString('id-ID');
        }
        return new Date(value).toLocaleDateString('id-ID');
      case 'status':
        if (format.statusMap && format.statusMap[value]) {
          const status = format.statusMap[value];
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                status.tone === 'danger'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : status.tone === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {status.label}
            </span>
          );
        }
        return value;
      case 'link':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {value}
          </a>
        );
      default:
        return String(value);
    }
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    column.align === 'right' ? 'text-right' : ''
                  } ${column.nowrap ? 'whitespace-nowrap' : ''}`}
                  style={column.width ? { width: column.width, minWidth: column.width } : undefined}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row[rowIdKey]}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${
                      column.truncate ? 'truncate max-w-xs' : ''
                    } ${column.nowrap ? 'whitespace-nowrap' : ''} ${column.align === 'right' ? 'text-right' : ''}`}
                    style={column.width ? { width: column.width, minWidth: column.width } : undefined}
                  >
                    {formatValue(row[column.key], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((row) => (
          <div
            key={row[rowIdKey]}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column) => (
              <div key={column.key} className="mb-2 last:mb-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {column.label}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {formatValue(row[column.key], column)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sort indicator */}
      {sortBy && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Sorted by {columns.find((c) => c.key === sortBy)?.label},{' '}
          {sortDirection === 'asc' ? 'ascending' : 'descending'}
        </div>
      )}
    </div>
  );
}
