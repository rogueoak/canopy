import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, DataTableColumnHeader, createSelectionColumn, useDataTable } from './DataTable';
import type { ColumnDef, RowSelectionState, SortingState } from './DataTable';

interface Person {
  id: number;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: 1, name: 'Ada', age: 36 },
  { id: 2, name: 'Grace', age: 45 },
  { id: 3, name: 'Alan', age: 41 },
];

const basicColumns: ColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

const sortableColumns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: 'age',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
  },
];

describe('DataTable', () => {
  it('renders rows and columns through the 0059 parts with native table roles', () => {
    render(<DataTable columns={basicColumns} data={people} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    // 3 data rows + 1 header row.
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Grace' })).toBeInTheDocument();
  });

  it('forwards ref to the underlying table element', () => {
    const ref = React.createRef<HTMLTableElement>();
    render(<DataTable ref={ref} columns={basicColumns} data={people} />);
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('merges caller className onto the table (caller wins)', () => {
    const ref = React.createRef<HTMLTableElement>();
    render(
      <DataTable ref={ref} columns={basicColumns} data={people} className="custom-table-class" />,
    );
    expect(ref.current).toHaveClass('custom-table-class');
    // Base 0059 class still present.
    expect(ref.current).toHaveClass('w-full');
  });

  describe('sorting', () => {
    it('a sortable header renders an activatable control and reflects aria-sort (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={sortableColumns} data={people} enablePagination={false} />);

      const nameHeader = screen.getAllByRole('columnheader')[0];
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');

      const nameButton = within(nameHeader).getByRole('button', { name: /name/i });
      await user.click(nameButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      await user.click(nameButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

      await user.click(nameButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    });

    it('sorts by keyboard activation', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={sortableColumns} data={people} enablePagination={false} />);

      const nameHeader = screen.getAllByRole('columnheader')[0];
      const nameButton = within(nameHeader).getByRole('button', { name: /name/i });
      nameButton.focus();
      await user.keyboard('{Enter}');
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      await user.keyboard(' ');
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('actually reorders rows ascending on sort', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={sortableColumns} data={people} enablePagination={false} />);

      const nameButton = within(screen.getAllByRole('columnheader')[0]).getByRole('button');
      await user.click(nameButton);

      const bodyRows = screen.getAllByRole('row').slice(1);
      const firstCell = within(bodyRows[0]).getAllByRole('cell')[0];
      expect(firstCell).toHaveTextContent('Ada');
      const secondCell = within(bodyRows[1]).getAllByRole('cell')[0];
      expect(secondCell).toHaveTextContent('Alan');
    });

    it('supports controlled sorting via useDataTable + table prop', async () => {
      const user = userEvent.setup();
      const onSortingChange = vi.fn();

      function Controlled() {
        const [sorting, setSorting] = React.useState<SortingState>([]);
        const { table } = useDataTable({
          columns: sortableColumns,
          data: people,
          enablePagination: false,
          sorting,
          onSortingChange: (updater) => {
            onSortingChange();
            setSorting(updater as SortingState);
          },
        });
        return <DataTable table={table} />;
      }

      render(<Controlled />);
      const nameButton = within(screen.getAllByRole('columnheader')[0]).getByRole('button');
      await user.click(nameButton);

      expect(onSortingChange).toHaveBeenCalled();
      expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  describe('column visibility', () => {
    it('drops a hidden column from both header and body', () => {
      function Hidden() {
        const { table } = useDataTable({
          columns: basicColumns,
          data: people,
          enablePagination: false,
          columnVisibility: { age: false },
        });
        return <DataTable table={table} />;
      }
      render(<Hidden />);

      expect(screen.getAllByRole('columnheader')).toHaveLength(1);
      expect(screen.getByRole('columnheader')).toHaveTextContent('Name');
      // The Age values are gone from the body.
      expect(screen.queryByRole('cell', { name: '36' })).not.toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
    });
  });

  describe('row selection', () => {
    const selectableColumns: ColumnDef<Person>[] = [
      createSelectionColumn<Person>(),
      ...basicColumns,
    ];

    it('renders labelled select-all and per-row checkboxes', () => {
      render(<DataTable columns={selectableColumns} data={people} enablePagination={false} />);
      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3);
    });

    it('select-all toggles every row and marks rows selected', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={selectableColumns} data={people} enablePagination={false} />);

      const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });
      await user.click(selectAll);

      for (const rowBox of screen.getAllByRole('checkbox', { name: 'Select row' })) {
        expect(rowBox).toBeChecked();
      }
      const bodyRows = screen.getAllByRole('row').slice(1);
      for (const row of bodyRows) {
        expect(row).toHaveAttribute('data-state', 'selected');
      }
    });

    it('select-all is indeterminate when only some rows are selected', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={selectableColumns} data={people} enablePagination={false} />);
      await user.click(screen.getAllByRole('checkbox', { name: 'Select row' })[0]);
      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveAttribute(
        'aria-checked',
        'mixed',
      );
    });

    it('per-row selection toggles one row and exposes it', async () => {
      const user = userEvent.setup();
      const onRowSelectionChange = vi.fn();

      function Controlled() {
        const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
        const { table } = useDataTable({
          columns: selectableColumns,
          data: people,
          enablePagination: false,
          rowSelection,
          onRowSelectionChange: (updater) => {
            onRowSelectionChange();
            setRowSelection(updater as RowSelectionState);
          },
        });
        return (
          <>
            <DataTable table={table} />
            <output data-testid="count">{table.getSelectedRowModel().rows.length}</output>
          </>
        );
      }

      render(<Controlled />);
      const firstRowBox = screen.getAllByRole('checkbox', { name: 'Select row' })[0];
      await user.click(firstRowBox);

      expect(onRowSelectionChange).toHaveBeenCalled();
      expect(firstRowBox).toBeChecked();
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      // Only the first body row is selected.
      const bodyRows = screen.getAllByRole('row').slice(1);
      expect(bodyRows[0]).toHaveAttribute('data-state', 'selected');
      expect(bodyRows[1]).not.toHaveAttribute('data-state', 'selected');
    });
  });

  describe('pagination', () => {
    const many: Person[] = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      age: 20 + i,
    }));

    it('advances and retreats pages and clamps at the ends', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={basicColumns} data={many} pageSize={10} />);

      // Page 1 of 3, 10 rows.
      expect(screen.getByTestId('datatable-page-indicator')).toHaveTextContent('Page 1 of 3');
      expect(screen.getAllByRole('row')).toHaveLength(11);
      // Previous is disabled at the first page.
      const prev = screen.getByRole('button', { name: /previous/i });
      expect(prev).toBeDisabled();

      const next = screen.getByRole('button', { name: /next/i });
      await user.click(next);
      expect(screen.getByTestId('datatable-page-indicator')).toHaveTextContent('Page 2 of 3');

      await user.click(next);
      expect(screen.getByTestId('datatable-page-indicator')).toHaveTextContent('Page 3 of 3');
      // Clamps: Next disabled at the last page, only 5 rows.
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(screen.getAllByRole('row')).toHaveLength(6);

      await user.click(screen.getByRole('button', { name: /previous/i }));
      expect(screen.getByTestId('datatable-page-indicator')).toHaveTextContent('Page 2 of 3');
    });

    it('renders no pager when pagination is disabled', () => {
      render(<DataTable columns={basicColumns} data={many} enablePagination={false} />);
      expect(screen.queryByTestId('datatable-page-indicator')).not.toBeInTheDocument();
      // All 25 rows plus header render.
      expect(screen.getAllByRole('row')).toHaveLength(26);
    });

    it('accepts a custom pager slot', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={many}
          pager={() => <div data-testid="custom-pager">custom</div>}
        />,
      );
      expect(screen.getByTestId('custom-pager')).toBeInTheDocument();
      expect(screen.queryByTestId('datatable-page-indicator')).not.toBeInTheDocument();
    });
  });

  describe('global filter', () => {
    it('narrows the visible rows', () => {
      function Filtered() {
        const { table } = useDataTable({
          columns: basicColumns,
          data: people,
          enablePagination: false,
          globalFilter: 'Ada',
        });
        return <DataTable table={table} />;
      }
      render(<Filtered />);
      expect(screen.getByRole('cell', { name: 'Ada' })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'Grace' })).not.toBeInTheDocument();
      // header + 1 matching row.
      expect(screen.getAllByRole('row')).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('renders the Empty block in a single spanned row when there is no data', () => {
      render(<DataTable columns={basicColumns} data={[]} />);
      expect(screen.getByText('No results')).toBeInTheDocument();
      // header row + one spanned empty row.
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2);
      const emptyCell = within(rows[1]).getByRole('cell');
      expect(emptyCell).toHaveAttribute('colspan', '2');
    });

    it('renders a custom emptyState slot', () => {
      render(
        <DataTable
          columns={basicColumns}
          data={[]}
          emptyState={<span data-testid="none">Nothing here</span>}
        />,
      );
      expect(screen.getByTestId('none')).toBeInTheDocument();
      expect(screen.queryByText('No results')).not.toBeInTheDocument();
    });
  });
});
