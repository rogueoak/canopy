import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanStackTable,
  type TableOptions,
  type VisibilityState,
} from '@tanstack/react-table';
import { Button } from '../seeds/Button';
import { Checkbox } from '../seeds/Checkbox';
import { Empty, EmptyDescription, EmptyTitle } from '../twigs/Empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../twigs/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { cn } from '../lib/cn';

/**
 * DataTable (spec 0064) - the stateful data grid that Table (0059) deliberately left out of scope.
 * It splits into two layers, matching how shadcn ships its data table:
 *
 * - `useDataTable` - the HEADLESS layer: a thin wrapper over `@tanstack/react-table`'s
 *   `useReactTable` that pre-wires the core / sorted / filtered / paginated row models and applies
 *   canopy defaults. Every piece of state (sorting, column visibility, row selection, pagination,
 *   column + global filters) is UNCONTROLLED by default and controllable via a `state` + `on*Change`
 *   pair (TanStack's own contract), honouring the canopy learning that interactive components must
 *   work controlled AND uncontrolled. It returns the `table` instance so advanced callers can build
 *   their own chrome (toolbar, column menu, filter UI).
 * - `DataTable` - the STYLED layer: takes `columns` + `data`, calls `useDataTable` internally (or
 *   accepts an externally-created `table`), and renders TanStack's resolved header groups and rows
 *   straight into the 0059 `Table` parts, so it inherits the token borders, muted header, row hover,
 *   and `data-[state=selected]` styling for free rather than restyling `<table>`.
 *
 * Recipe (0005): the only chrome DataTable draws itself - the sortable header control, the spanned
 * empty row, and the pager layout - carries FULL LITERAL semantic-token utilities merged caller-wins
 * via `cn()`, with `forwardRef` + native prop spread and `React.ComponentRef` refs. There is NO
 * `dark:` on the common path; the composed primitives (Button, Checkbox, Pagination, Empty, Table)
 * carry their own tokens, so light/dark flips through the token layer (spec 0004).
 */

/* ------------------------------------------------------------------- sort glyph */

/**
 * SortGlyph - the directional caret beside a sortable header label. A hand-rolled `currentColor`
 * SVG (the Pagination / Breadcrumb precedent) so it inherits the Button's text colour and adds NO
 * new dependency. `direction` picks up/down chevrons for ascending/descending; when a column is
 * unsorted it renders the neutral up-down glyph so the affordance still reads as sortable.
 */
function SortGlyph({ direction }: { direction: 'asc' | 'desc' | false }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="ml-2 h-4 w-4 shrink-0"
    >
      {direction === 'asc' ? (
        <path d="m18 15-6-6-6 6" />
      ) : direction === 'desc' ? (
        <path d="m6 9 6 6 6-6" />
      ) : (
        <>
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------- column helpers */

export interface DataTableColumnHeaderProps<TData, TValue> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** The TanStack column this header controls; drives the sort toggle and current direction. */
  column: Column<TData, TValue>;
  /** The visible header label. */
  title: React.ReactNode;
}

/**
 * DataTableColumnHeader - the sortable header control for a column. Renders a `ghost` `Button`
 * (inheriting the canopy Button focus ring, so click AND keyboard activation come for free) that
 * calls `column.toggleSorting()` to cycle ascending -> descending -> unsorted, with a directional
 * `SortGlyph`. `aria-sort` is set on the `<th>` by `DataTable`, not here, so the semantics land on
 * the real column header element. If the column is not sortable it renders the plain title.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn('text-label text-text-muted', className)} {...props}>
        {title}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn('flex items-center', className)} {...props}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 px-2 text-label text-text-muted"
        onClick={() => column.toggleSorting()}
      >
        {title}
        <SortGlyph direction={sorted} />
      </Button>
    </div>
  );
}

export interface SelectionColumnLabels {
  /** Accessible label for the header select-all checkbox. Defaults to `Select all rows`. */
  all?: string;
  /** Accessible label for a per-row checkbox. Defaults to `Select row`. */
  row?: string;
}

/**
 * createSelectionColumn - a ready-made `ColumnDef` for an opt-in leading selection column. Its
 * header cell is a select-all `Checkbox` bound to the table's all-rows toggle (indeterminate when
 * only some rows are selected); each body cell is a per-row `Checkbox` bound to that row's toggle.
 * Both checkboxes are real, labelled canopy `Checkbox` controls, and selected rows are marked by
 * `DataTable` with `data-state="selected"` so the 0059 selected-row token styling applies.
 */
export function createSelectionColumn<TData>(labels: SelectionColumnLabels = {}): ColumnDef<TData> {
  const allLabel = labels.all ?? 'Select all rows';
  const rowLabel = labels.row ?? 'Select row';
  return {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={allLabel}
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={rowLabel}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  };
}

/* ------------------------------------------------------------------- headless hook */

export interface UseDataTableOptions<TData, TValue = unknown> extends Pick<
  TableOptions<TData>,
  'columns' | 'data'
> {
  /** Extra columns type carrier - never used directly; keeps the generic inferable. */
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Enable client-side pagination (core + pagination row models). Defaults to `true`. */
  enablePagination?: boolean;
  /** Initial page size when pagination is enabled. Defaults to `10`. */
  pageSize?: number;
  /** Controlled sorting state; pair with `onSortingChange`. Uncontrolled when omitted. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Controlled column-visibility state; pair with `onColumnVisibilityChange`. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /** Controlled row-selection state; pair with `onRowSelectionChange`. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Controlled column-filters state; pair with `onColumnFiltersChange`. */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  /** Controlled global-filter value; pair with `onGlobalFilterChange`. */
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  /** Controlled pagination state; pair with `onPaginationChange`. */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  /** Escape hatch for any other TanStack option not surfaced here. */
  tableOptions?: Partial<TableOptions<TData>>;
}

export interface UseDataTableResult<TData> {
  /** The underlying TanStack table instance - the single source of truth for chrome. */
  table: TanStackTable<TData>;
}

/**
 * useDataTable - the headless layer. Wraps `useReactTable` with the core / sorted / filtered /
 * paginated row models pre-wired and canopy defaults applied. Each slice of state is uncontrolled
 * until you pass BOTH its `state` value and its `on*Change` handler; omit either and that slice stays
 * driven by TanStack's internal state, so callers get the standard controlled/uncontrolled contract.
 * The returned `table` is the source of truth for both the styled `DataTable` and any custom chrome.
 */
export function useDataTable<TData, TValue = unknown>(
  options: UseDataTableOptions<TData, TValue>,
): UseDataTableResult<TData> {
  const {
    columns,
    data,
    enablePagination = true,
    pageSize = 10,
    sorting,
    onSortingChange,
    columnVisibility,
    onColumnVisibilityChange,
    rowSelection,
    onRowSelectionChange,
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    pagination,
    onPaginationChange,
    tableOptions,
  } = options;

  // Only the pieces the caller controls are forwarded as `state`; anything omitted stays
  // uncontrolled and is driven by TanStack's own internal state (the standard controlled /
  // uncontrolled contract). Building the object conditionally keeps uncontrolled state truly
  // internal - passing e.g. an empty `pagination` slot would otherwise pin the page.
  const controlledState = {
    ...(tableOptions?.state ?? {}),
    ...(sorting !== undefined ? { sorting } : {}),
    ...(columnVisibility !== undefined ? { columnVisibility } : {}),
    ...(rowSelection !== undefined ? { rowSelection } : {}),
    ...(columnFilters !== undefined ? { columnFilters } : {}),
    ...(globalFilter !== undefined ? { globalFilter } : {}),
    ...(pagination !== undefined ? { pagination } : {}),
  };

  const table = useReactTable<TData>({
    data,
    columns: columns as ColumnDef<TData>[],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    // Only forward an on*Change handler when the caller supplied one: passing the key as an
    // explicit `undefined` overrides TanStack's default internal-state updater and freezes that
    // slice, so an uncontrolled DataTable would never re-page or re-select.
    ...(onSortingChange ? { onSortingChange } : {}),
    ...(onColumnVisibilityChange ? { onColumnVisibilityChange } : {}),
    ...(onRowSelectionChange ? { onRowSelectionChange } : {}),
    ...(onColumnFiltersChange ? { onColumnFiltersChange } : {}),
    ...(onGlobalFilterChange ? { onGlobalFilterChange } : {}),
    ...(onPaginationChange ? { onPaginationChange } : {}),
    initialState: {
      ...(enablePagination ? { pagination: { pageIndex: 0, pageSize } } : {}),
    },
    ...tableOptions,
    ...(Object.keys(controlledState).length > 0 ? { state: controlledState } : {}),
  });

  return { table };
}

/* ------------------------------------------------------------------- default pager */

export interface DataTablePagerProps<TData> {
  /** The table instance whose pagination state drives the pager. */
  table: TanStackTable<TData>;
}

/**
 * DataTablePager - the default pager, composed from `Pagination` (0047) + `Button`. It reads
 * `table.getState().pagination` for the page indicator and drives `previousPage()` / `nextPage()`,
 * disabling the ends via `table.getCanPreviousPage()` / `getCanNextPage()` so paging clamps at the
 * first and last page. Callers can replace the whole pager via the `pager` slot on `DataTable`.
 */
export function DataTablePager<TData>({ table }: DataTablePagerProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <p className="text-caption text-text-muted" data-testid="datatable-page-indicator">
        Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              asChild
              aria-disabled={!canPrevious}
              className={cn(!canPrevious && 'pointer-events-none opacity-50')}
            >
              <button type="button" disabled={!canPrevious} onClick={() => table.previousPage()}>
                Previous
              </button>
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              asChild
              aria-disabled={!canNext}
              className={cn(!canNext && 'pointer-events-none opacity-50')}
            >
              <button type="button" disabled={!canNext} onClick={() => table.nextPage()}>
                Next
              </button>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

/* ------------------------------------------------------------------- styled DataTable */

interface DataTableBaseProps<TData> extends Omit<
  React.HTMLAttributes<HTMLTableElement>,
  'children'
> {
  /** Enable client-side pagination and render the default pager. Defaults to `true`. */
  enablePagination?: boolean;
  /** Initial page size when `DataTable` owns the table. Defaults to `10`. */
  pageSize?: number;
  /**
   * Replace the default pager. Receives the table instance. Pass `null` to render no pager even
   * when pagination is enabled (e.g. a caller-owned pager rendered elsewhere).
   */
  pager?: ((table: TanStackTable<TData>) => React.ReactNode) | null;
  /**
   * Replace the zero-rows placeholder. Rendered inside a single full-width spanned `TableCell`.
   * Defaults to an `Empty` (0041) block.
   */
  emptyState?: React.ReactNode;
}

/**
 * The two ways to feed `DataTable`, expressed as a discriminated union so `columns`/`data` and a
 * pre-built `table` never coexist (which would let the two drift and pay for a second, discarded
 * table instance):
 * - the common path: pass `columns` + `data` (+ the pagination options) and `DataTable` builds the
 *   table internally via `useDataTable`;
 * - the advanced path: pass a pre-built `table` from `useDataTable` and omit `columns`/`data`.
 */
export type DataTableProps<TData, TValue = unknown> = DataTableBaseProps<TData> &
  (
    | {
        /** The column definitions (TanStack `ColumnDef[]`, with canopy header/selection helpers). */
        columns: ColumnDef<TData, TValue>[];
        /** The in-memory data rows. */
        data: TData[];
        table?: never;
      }
    | {
        /** A pre-built table instance from `useDataTable` for advanced control. */
        table: TanStackTable<TData>;
        columns?: never;
        data?: never;
      }
  );

// The permissive shape the inner render function receives - the public `DataTableProps` union above
// guarantees callers pass exactly one of (`columns` + `data`) or `table`.
interface DataTableInnerProps<TData, TValue = unknown> extends DataTableBaseProps<TData> {
  columns?: ColumnDef<TData, TValue>[];
  data?: TData[];
  table?: TanStackTable<TData>;
}

/**
 * DataTable - the styled grid. Renders TanStack's resolved header groups and rows into the 0059
 * `Table` parts. Sortable `<th>`s carry `aria-sort` reflecting the column's current direction;
 * selected rows carry `data-state="selected"` so the 0059 token styling lights up. When there are no
 * rows to show, the body renders a single spanned row holding the `emptyState` (an `Empty` block by
 * default) instead of an empty grid. `forwardRef` forwards to the underlying `<table>`; native table
 * props spread; `className` merges caller-wins.
 */
function DataTableInner<TData, TValue = unknown>(
  {
    columns,
    data,
    table: externalTable,
    enablePagination = true,
    pageSize = 10,
    pager,
    emptyState,
    className,
    ...props
  }: DataTableInnerProps<TData, TValue>,
  ref: React.ForwardedRef<HTMLTableElement>,
) {
  // Rules of hooks force the internal hook to run every render, but when the caller hands in a
  // pre-built `table` we feed it EMPTY inputs so no second table is ever built over the real
  // `columns`/`data` (no discarded row models, and no `columns`/`data` living in two places to
  // drift). The public prop union guarantees `columns`/`data` are present on the internal path.
  const { table: internalTable } = useDataTable<TData, TValue>({
    columns: externalTable ? [] : (columns ?? []),
    data: externalTable ? [] : (data ?? []),
    enablePagination,
    pageSize,
  });
  const table = externalTable ?? internalTable;

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const defaultEmpty = (
    <Empty>
      <EmptyTitle>No results</EmptyTitle>
      <EmptyDescription>There are no rows to display.</EmptyDescription>
    </Empty>
  );

  const renderPager = () => {
    if (pager === null) return null;
    // For a caller-owned `table` the DataTable-level `enablePagination` prop configured the
    // discarded internal instance only, so derive pager visibility from the external table itself
    // (its pagination row model is present only when pagination was enabled on it). On the internal
    // path the prop is the source of truth.
    const paginationEnabled = externalTable
      ? externalTable.options.getPaginationRowModel !== undefined
      : enablePagination;
    if (!paginationEnabled) return null;
    if (pager) return pager(table);
    return <DataTablePager table={table} />;
  };

  return (
    <div className="w-full">
      <div className="rounded-md border border-border">
        <Table ref={ref} className={cn(className)} {...props}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const ariaSort = !header.column.getCanSort()
                    ? undefined
                    : sorted === 'asc'
                      ? 'ascending'
                      : sorted === 'desc'
                        ? 'descending'
                        : 'none';
                  return (
                    <TableHead key={header.id} aria-sort={ariaSort} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount || 1} className="h-24 text-center">
                  {emptyState ?? defaultEmpty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row: Row<TData>) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {renderPager()}
    </div>
  );
}

/**
 * DataTable - `forwardRef` wrapper preserving the generic `TData` / `TValue` inference. The cast on
 * `forwardRef` is the standard idiom for keeping generics through `React.forwardRef`.
 */
export const DataTable = React.forwardRef(DataTableInner) as <TData, TValue = unknown>(
  props: DataTableProps<TData, TValue> & { ref?: React.ForwardedRef<HTMLTableElement> },
) => React.ReactElement;

// forwardRef's returned object loses displayName under the generic cast; set it on the inner fn.
(DataTableInner as React.FunctionComponent).displayName = 'DataTable';

export type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
