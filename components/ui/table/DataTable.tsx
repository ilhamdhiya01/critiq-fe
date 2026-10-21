"use client";

import type { ReactTable, RowData } from "@tanstack/react-table";
import classNames from "classnames";
import React from "react";

import Icon from "@/components/ui/icon/Icon";
import type { sortableFeatures } from "@/lib/helpers/table.helper";

type DataTableFeatures = typeof sortableFeatures;

interface DataTableProps<TData extends RowData> {
  table: ReactTable<DataTableFeatures, TData>;
  // Needed for the empty-state row's colSpan; pass table.getAllColumns().length.
  columnCount: number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
  colgroup?: React.ReactNode;
  // Caps the table body height and makes it scrollable with a sticky header,
  // e.g. "480px" or "28rem". Omit for an unbounded, non-scrolling table.
  maxHeight?: string;
  // Minimum table width in px. Narrower containers scroll horizontally
  // instead of squeezing the flexible (title) column to nothing on phones.
  minWidth?: number;
}

// Tighter on phones; sm and up keep the original 18px.
const CELL_X = "px-3 sm:px-4.5";

const DataTable = <TData extends RowData>({
  table,
  columnCount,
  onRowClick,
  emptyMessage,
  className,
  colgroup,
  maxHeight,
  minWidth,
}: DataTableProps<TData>) => {
  const rows = table.getRowModel().rows;

  const tableEl = (
    <table
      className={classNames("w-full table-fixed border-collapse", className)}
      // Rows only: the empty state should stay centred in the visible width.
      style={minWidth && rows.length > 0 ? { minWidth } : undefined}
    >
      {colgroup}
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="border-b border-border-default">
            {headerGroup.headers.map((header) => {
              const align = header.column.columnDef.meta?.align;
              const canSort = header.column.getCanSort();
              const sortDirection = header.column.getIsSorted();

              return (
                <th
                  key={header.id}
                  className={classNames(
                    CELL_X,
                    "py-3 text-left font-mono text-[10.5px] tracking-[.06em] text-text-muted uppercase",
                    { "text-right": align === "right" },
                    { "sticky top-0 z-10 bg-surface": maxHeight },
                  )}
                >
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className={classNames(
                        "inline-flex cursor-pointer items-center gap-1 uppercase hover:text-text-secondary",
                        { "flex-row-reverse": align === "right" },
                      )}
                    >
                      <table.FlexRender header={header} />
                      <Icon
                        icon={
                          sortDirection === "asc"
                            ? "TbChevronUp"
                            : sortDirection === "desc"
                              ? "TbChevronDown"
                              : "TbSelector"
                        }
                        size={12}
                        className={classNames({ "opacity-40": !sortDirection })}
                      />
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={classNames(
              "border-b border-border-row last:border-b-0",
              { "cursor-pointer hover:bg-surface-hover": onRowClick },
            )}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          >
            {row.getAllCells().map((cell) => (
              <td key={cell.id} className={classNames(CELL_X, "py-3.5")}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && emptyMessage && (
          <tr>
            <td
              colSpan={columnCount}
              // A node (e.g. EmptyState) brings its own spacing and type.
              className={
                typeof emptyMessage === "string"
                  ? classNames(
                      CELL_X,
                      "py-10 text-center text-[12.5px] text-text-secondary",
                    )
                  : "p-0"
              }
            >
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  // Always a horizontal scroll box: callers sit in overflow-hidden cards,
  // which would otherwise clip a table wider than its container.
  return (
    <div
      className={classNames("overflow-x-auto", {
        "overflow-y-auto": maxHeight,
      })}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {tableEl}
    </div>
  );
};

export default DataTable;
