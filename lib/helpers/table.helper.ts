import {
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

// Column-level styling hints shared across DataTable consumers, e.g. right-
// aligning a numeric/date column's header and cells.
export interface DataTableColumnMeta {
  align?: "left" | "right";
}

// Shared feature set for tables that need column sorting. Kept at module
// scope (per TanStack's v9 guidance) so every consumer reuses the same
// reference instead of re-registering the feature on every render.
export const sortableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: {} as DataTableColumnMeta,
});
