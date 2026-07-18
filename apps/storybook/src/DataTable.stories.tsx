import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  DataTable,
  DataTableColumnHeader,
  createSelectionColumn,
  useDataTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@rogueoak/canopy/branches';
import { Button } from '@rogueoak/canopy/seeds';
import { SearchBar } from '@rogueoak/canopy/twigs';

/**
 * Branches/DataTable - the stateful data grid (spec 0064) that Table (0059) deliberately left out
 * of scope: sortable columns, toggleable column visibility, row selection with a header select-all,
 * client-side pagination, and filter hooks. It ships in two layers - a headless `useDataTable` hook
 * over `@tanstack/react-table` and a styled `DataTable` that renders through the 0059 `Table` parts,
 * composing `Pagination` (0047) / `Button` for the pager, `Empty` (0041) for the zero-rows state,
 * and `Checkbox` (0009) for selection.
 *
 * v1 is client-side only (in-memory `data`); async / server-side sources are a follow-up. There is
 * NO per-story theme code: toggle the toolbar Light / Dark control and every story re-themes through
 * the token layer (spec 0004) - borders, muted header, row hover, selected-row fill, the pager, and
 * the empty block all flip through their tokens.
 */

interface Invoice {
  id: string;
  status: 'Paid' | 'Pending' | 'Unpaid';
  method: string;
  amount: number;
}

const invoices: Invoice[] = [
  { id: 'INV-001', status: 'Paid', method: 'Credit Card', amount: 250 },
  { id: 'INV-002', status: 'Pending', method: 'PayPal', amount: 150 },
  { id: 'INV-003', status: 'Unpaid', method: 'Bank Transfer', amount: 350 },
  { id: 'INV-004', status: 'Paid', method: 'Credit Card', amount: 450 },
  { id: 'INV-005', status: 'Paid', method: 'PayPal', amount: 550 },
  { id: 'INV-006', status: 'Pending', method: 'Bank Transfer', amount: 200 },
  { id: 'INV-007', status: 'Unpaid', method: 'Credit Card', amount: 300 },
  { id: 'INV-008', status: 'Paid', method: 'PayPal', amount: 700 },
  { id: 'INV-009', status: 'Pending', method: 'Credit Card', amount: 125 },
  { id: 'INV-010', status: 'Paid', method: 'Bank Transfer', amount: 900 },
  { id: 'INV-011', status: 'Unpaid', method: 'PayPal', amount: 175 },
  { id: 'INV-012', status: 'Paid', method: 'Credit Card', amount: 400 },
];

const currency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const plainColumns: ColumnDef<Invoice>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'method', header: 'Method' },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => <div className="text-right font-medium">{currency(row.original.amount)}</div>,
  },
];

const sortableColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  },
  {
    accessorKey: 'method',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => <span className="font-medium">{currency(row.original.amount)}</span>,
  },
];

const meta = {
  title: 'Branches/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataTable<Invoice>>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------- Playground */

/**
 * The default grid: plain columns, client-side pagination with the default `Pagination` (0047)
 * pager. Hover a row for the `bg-muted` affordance.
 */
export const Playground: Story = {
  render: () => (
    <div className="w-[44rem]">
      <DataTable columns={plainColumns} data={invoices} pageSize={5} />
    </div>
  ),
};

/* ------------------------------------------------------------------- Sortable */

/**
 * Sortable columns: each header is a `ghost` `Button` that cycles ascending / descending / unsorted
 * on click or keyboard, with a directional glyph, and sets `aria-sort` on the `<th>`.
 */
export const Sortable: Story = {
  render: () => (
    <div className="w-[44rem]">
      <DataTable columns={sortableColumns} data={invoices} pageSize={5} />
    </div>
  ),
};

/* ------------------------------------------------------------------- Selectable */

/**
 * Row selection: an opt-in leading column with a labelled header select-all `Checkbox`
 * (indeterminate when partial) and labelled per-row `Checkbox`es. Selected rows carry
 * `data-[state=selected]` so the 0059 selected-row token fill applies, and the selected set is
 * surfaced for bulk actions.
 */
export const Selectable: Story = {
  render: function SelectableStory() {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const columns = React.useMemo<ColumnDef<Invoice>[]>(
      () => [createSelectionColumn<Invoice>(), ...sortableColumns],
      [],
    );
    const { table } = useDataTable({
      columns,
      data: invoices,
      pageSize: 5,
      rowSelection,
      onRowSelectionChange: setRowSelection,
    });
    const selectedCount = table.getSelectedRowModel().rows.length;
    return (
      <div className="w-[48rem] space-y-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={selectedCount === 0}
            onClick={() => setRowSelection({})}
          >
            Clear selection
          </Button>
          <span className="text-body-sm text-text-muted">{selectedCount} selected</span>
        </div>
        <DataTable columns={columns} data={invoices} table={table} />
      </div>
    );
  },
};

/* ------------------------------------------------------------------- Paginated */

/**
 * Pagination: the default pager (from `Pagination` (0047) / `Button`) advances and retreats the page
 * and clamps at the first and last page. A larger dataset makes the paging obvious.
 */
export const Paginated: Story = {
  render: () => (
    <div className="w-[44rem]">
      <DataTable columns={plainColumns} data={invoices} pageSize={4} />
    </div>
  ),
};

/* ------------------------------------------------------------------- ColumnVisibility */

/**
 * Column visibility: `useDataTable` exposes the visibility state and setters, so a caller can drive
 * a show/hide menu. Toggling a column drops it from both the header and the body.
 */
export const ColumnVisibility: Story = {
  render: function ColumnVisibilityStory() {
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const { table } = useDataTable({
      columns: plainColumns,
      data: invoices,
      pageSize: 5,
      columnVisibility,
      onColumnVisibilityChange: setColumnVisibility,
    });
    return (
      <div className="w-[48rem] space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {table.getAllLeafColumns().map((column) => (
            <Button
              key={column.id}
              size="sm"
              variant={column.getIsVisible() ? 'secondary' : 'outline'}
              onClick={() => column.toggleVisibility()}
            >
              {column.id}
            </Button>
          ))}
        </div>
        <DataTable columns={plainColumns} data={invoices} table={table} />
      </div>
    );
  },
};

/* ------------------------------------------------------------------- GlobalFilter */

/**
 * Global filter: `useDataTable` surfaces TanStack's global-filter state and setter (the wiring, not
 * a UI), so a caller can attach a `SearchBar` (0033). Typing narrows the visible rows across all
 * columns; an empty result falls through to the `Empty` (0041) block.
 */
export const GlobalFilter: Story = {
  render: function GlobalFilterStory() {
    const [globalFilter, setGlobalFilter] = React.useState('');
    const { table } = useDataTable({
      columns: plainColumns,
      data: invoices,
      pageSize: 5,
      globalFilter,
      onGlobalFilterChange: setGlobalFilter as (value: string) => void,
    });
    return (
      <div className="w-[48rem] space-y-3">
        <SearchBar
          className="max-w-xs"
          placeholder="Filter invoices..."
          value={globalFilter}
          onValueChange={setGlobalFilter}
        />
        <DataTable columns={plainColumns} data={invoices} table={table} />
      </div>
    );
  },
};

/* ------------------------------------------------------------------- Empty */

/**
 * Empty state: with no rows to show, the body renders an `Empty` (0041) block in a single full-width
 * spanned row (`colSpan` across the visible columns) instead of an empty grid.
 */
export const Empty: Story = {
  render: () => (
    <div className="w-[44rem]">
      <DataTable columns={plainColumns} data={[]} />
    </div>
  ),
};

/* ------------------------------------------------------------------- ControlledSorting */

/**
 * Controlled sorting: the caller owns the `SortingState`, so external UI (here a reset button) can
 * read and drive it. Sorting also works uncontrolled - just omit the `sorting` / `onSortingChange`
 * pair, as the Sortable story does.
 */
export const ControlledSorting: Story = {
  render: function ControlledSortingStory() {
    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'amount', desc: true }]);
    const { table } = useDataTable({
      columns: sortableColumns,
      data: invoices,
      pageSize: 5,
      sorting,
      onSortingChange: setSorting,
    });
    return (
      <div className="w-[48rem] space-y-3">
        <Button size="sm" variant="outline" onClick={() => setSorting([])}>
          Reset sort
        </Button>
        <DataTable columns={sortableColumns} data={invoices} table={table} />
      </div>
    );
  },
};
