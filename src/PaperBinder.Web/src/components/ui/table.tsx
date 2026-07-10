import type { ReactNode } from "react";

export type DataTableColumn = {
  key: string;
  header: string;
};

export type DataTableRow = {
  key: string;
  cells: ReactNode[];
};

type DataTableProps = {
  caption: string;
  columns: readonly DataTableColumn[];
  rows: readonly DataTableRow[];
  emptyMessage: string;
  loadingLabel?: string;
  isLoading?: boolean;
};

export function DataTable({
  caption,
  columns,
  rows,
  emptyMessage,
  loadingLabel,
  isLoading = false
}: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,252,255,0.96))] shadow-[var(--pb-shadow-card)]">
      <table className="min-w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--pb-border-subtle)] bg-[rgba(231,238,246,0.82)]">
            {columns.map((column) => (
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--pb-text-subtle)]"
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                className="px-4 py-5 text-sm text-[var(--pb-color-text-muted)]"
                colSpan={columns.length}
              >
                {loadingLabel ?? "Loading..."}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-5 text-sm text-[var(--pb-color-text-muted)]"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                className="border-b border-[var(--pb-border-subtle)] transition hover:bg-[rgba(238,244,250,0.76)] last:border-b-0"
                key={row.key}
              >
                {row.cells.map((cell, index) => (
                  <td className="px-4 py-3.5 text-sm text-[var(--pb-color-text)]" key={`${row.key}-${index}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
