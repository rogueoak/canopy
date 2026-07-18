import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Table - the presentational tabular-data Branch (spec 0059). A family of thin `forwardRef`
 * wrappers over the native semantic table elements (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`,
 * `<tr>`, `<th>`, `<td>`, `<caption>`), styled with the 0005 recipe. Because the parts render
 * real table elements, the native `table` / `rowgroup` / `row` / `columnheader` / `cell` roles
 * and screen-reader table navigation come for free - no ARIA is invented on top.
 *
 * This is presentational ONLY: there is no data logic (no sorting, pagination, selection, or
 * virtualization). Those belong to the future stateful `DataTable` (0064), which composes these
 * parts rather than restyling `<table>` from scratch. The `data-[state=selected]` hook on
 * `TableRow` is the seam `DataTable` will drive selection through, using the same token.
 *
 * Every part carries FULL LITERAL token-utility strings so Tailwind v4's scanner emits each
 * class, merges caller `className` via `cn()` (caller wins), spreads native props, and forwards
 * `ref`. There is NO `dark:` on the common path - light/dark flips through the token layer
 * (spec 0004). Row hover uses `bg-muted` (inline content, not a portalled raised surface).
 */

export type TableProps = React.HTMLAttributes<HTMLTableElement>;

/**
 * Table - the `<table>` root, wrapped in a `relative w-full overflow-x-auto` `<div>` so wide
 * tables scroll horizontally rather than breaking the surrounding layout. The `ref` forwards to
 * the inner `<table>`, and native table attributes spread onto it.
 */
export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-body-sm text-text', className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = 'Table';

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

/**
 * TableHeader - the `<thead>` group. Its rows carry a bottom border so the header separates from
 * the body.
 */
export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />
  ),
);
TableHeader.displayName = 'TableHeader';

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

/**
 * TableBody - the `<tbody>` group. Drops the trailing row's border so the last row sits flush
 * against a footer or the table edge.
 */
export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

/**
 * TableFooter - the `<tfoot>` group. A muted band (`bg-muted`, medium weight) with a top border,
 * for totals / summary rows.
 */
export const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t border-border bg-muted font-medium text-text [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  ),
);
TableFooter.displayName = 'TableFooter';

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

/**
 * TableRow - a `<tr>`. Bottom-bordered with a `transition-colors` `hover:bg-muted` affordance and
 * a `data-[state=selected]:bg-muted` hook so a future `DataTable` can mark selected rows through
 * the same token without a new API here.
 */
export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors hover:bg-muted data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface (not a type alias) is required for react/prop-types to resolve the spread `className` through `extends`
export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

/**
 * TableHead - a `<th>` column header. Left-aligned, muted `label`-role text (whose token already
 * carries medium weight) with cell padding, plus the checkbox-column spacing helper so a leading
 * checkbox cell aligns.
 */
export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-2 text-left align-middle text-label text-text-muted [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface (not a type alias) is required for react/prop-types to resolve the spread `className` through `extends`
export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

/**
 * TableCell - a `<td>` body cell. Middle-aligned with padding matching the header, on the default
 * text token.
 */
export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-2 py-2 align-middle text-text [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  ),
);
TableCell.displayName = 'TableCell';

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

/**
 * TableCaption - the `<caption>`. Provides the table's accessible name; rendered as muted
 * `caption`-role text with top margin (the table is `caption-bottom`, so it sits under the table).
 */
export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-caption text-text-muted', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';
