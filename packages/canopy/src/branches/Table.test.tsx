import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';

/**
 * A complete table used across the a11y / role assertions. The native elements are expected to
 * supply the implicit ARIA roles (`table` / `rowgroup` / `row` / `columnheader` / `cell`) and the
 * caption is expected to name the table - both proven as observable outcomes here, not by class
 * assertions.
 */
function renderTable() {
  return render(
    <Table>
      <TableCaption>Recent invoices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV-001</TableCell>
          <TableCell>Paid</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>1</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
}

describe('Table', () => {
  it('renders the native table role', () => {
    renderTable();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders rowgroup roles for the head, body, and footer groups', () => {
    renderTable();
    // thead + tbody + tfoot each expose the native `rowgroup` role.
    expect(screen.getAllByRole('rowgroup')).toHaveLength(3);
  });

  it('renders row roles for every tr', () => {
    renderTable();
    // header row + body row + footer row.
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('renders TableHead as a columnheader and TableCell as a cell', () => {
    renderTable();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Invoice' })).toBeInTheDocument();
    // Body + footer td elements all expose the native `cell` role.
    expect(screen.getAllByRole('cell').length).toBeGreaterThanOrEqual(4);
  });

  it('names the table via TableCaption', () => {
    renderTable();
    expect(screen.getByRole('table', { name: 'Recent invoices' })).toBeInTheDocument();
  });

  it('wraps the table in an overflow-x-auto scroll container so wide tables scroll', () => {
    renderTable();
    const table = screen.getByRole('table');
    // The Table root wraps its <table> in a scrollable <div>; the ref/table lives inside it.
    const wrapper = table.parentElement;
    expect(wrapper?.tagName).toBe('DIV');
    expect(wrapper).toHaveClass('overflow-x-auto');
  });

  it('applies data-[state=selected] on a selected row', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-state="selected">
            <TableCell>Selected</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('row')).toHaveAttribute('data-state', 'selected');
  });
});

describe('Table recipe (ref forwarding, prop spread, className merge)', () => {
  it('forwards ref to the underlying <table>', () => {
    const ref = createRef<HTMLTableElement>();
    render(<Table ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTableElement);
  });

  it('forwards ref to each section, row, and cell part', () => {
    const headerRef = createRef<HTMLTableSectionElement>();
    const bodyRef = createRef<HTMLTableSectionElement>();
    const footerRef = createRef<HTMLTableSectionElement>();
    const rowRef = createRef<HTMLTableRowElement>();
    const headRef = createRef<HTMLTableCellElement>();
    const cellRef = createRef<HTMLTableCellElement>();
    const captionRef = createRef<HTMLTableCaptionElement>();
    render(
      <Table>
        <TableCaption ref={captionRef}>Caption</TableCaption>
        <TableHeader ref={headerRef}>
          <TableRow ref={rowRef}>
            <TableHead ref={headRef}>Head</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={bodyRef}>
          <TableRow>
            <TableCell ref={cellRef}>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter ref={footerRef}>
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    expect(headerRef.current?.tagName).toBe('THEAD');
    expect(bodyRef.current?.tagName).toBe('TBODY');
    expect(footerRef.current?.tagName).toBe('TFOOT');
    expect(rowRef.current?.tagName).toBe('TR');
    expect(headRef.current?.tagName).toBe('TH');
    expect(cellRef.current?.tagName).toBe('TD');
    expect(captionRef.current?.tagName).toBe('CAPTION');
  });

  it('spreads native props onto each part', () => {
    render(
      <Table data-testid="tbl" aria-describedby="hint">
        <TableBody data-testid="tbody">
          <TableRow data-testid="tr">
            <TableCell data-testid="td" colSpan={2}>
              Cell
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByTestId('tbl')).toHaveAttribute('aria-describedby', 'hint');
    expect(screen.getByTestId('tbody')).toBeInTheDocument();
    expect(screen.getByTestId('tr')).toBeInTheDocument();
    expect(screen.getByTestId('td')).toHaveAttribute('colspan', '2');
  });

  it('merges className with the caller winning', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="text-text-muted" data-testid="cell">
              Cell
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cell = screen.getByTestId('cell');
    // Caller's colour token wins over the part's default `text-text`.
    expect(cell).toHaveClass('text-text-muted');
    expect(cell).not.toHaveClass('text-text');
    // Non-conflicting part classes survive the merge.
    expect(cell).toHaveClass('align-middle');
  });
});
