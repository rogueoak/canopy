import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Table - the presentational tabular-data Branch (spec 0059): eight thin `forwardRef`
 * wrappers over the native semantic table elements (`Table` / `TableHeader` / `TableBody` /
 * `TableFooter` / `TableRow` / `TableHead` / `TableCell` / `TableCaption`), styled with the 0005
 * recipe. It is presentational only - no sorting, pagination, or selection (those arrive with the
 * future `DataTable` (0064), which composes these parts). `Table` wraps its `<table>` in an
 * `overflow-x-auto` container so wide tables scroll rather than break the layout.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004) - the borders, muted header, row hover, and muted
 * caption all flip through their tokens.
 */
const meta = {
  title: 'Branches/Table',
  component: Table,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const invoices = [
  { invoice: 'INV-001', status: 'Paid', method: 'Credit Card', amount: '$250.00' },
  { invoice: 'INV-002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
  { invoice: 'INV-003', status: 'Unpaid', method: 'Bank Transfer', amount: '$350.00' },
  { invoice: 'INV-004', status: 'Paid', method: 'Credit Card', amount: '$450.00' },
];

/* ------------------------------------------------------------------- Playground */

/** The basic table: a header row plus body rows. Hover a row to see the `bg-muted` affordance. */
export const Playground: Story = {
  render: () => (
    <Table className="w-[32rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/* ------------------------------------------------------- WithCaptionAndFooter */

/**
 * A table with a `TableCaption` (which names the table for assistive tech) and a muted
 * `TableFooter` totals band.
 */
export const WithCaptionAndFooter: Story = {
  render: () => (
    <Table className="w-[32rem]">
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row) => (
          <TableRow key={row.invoice}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.method}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$1,200.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

/* ---------------------------------------------------------------------- Selected */

/**
 * The `data-[state=selected]` hook: a row marked selected (the seam `DataTable` (0064) will drive)
 * paints with the `bg-muted` selected token.
 */
export const SelectedRow: Story = {
  render: () => (
    <Table className="w-[32rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((row, i) => (
          <TableRow key={row.invoice} data-state={i === 1 ? 'selected' : undefined}>
            <TableCell className="font-medium">{row.invoice}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell className="text-right">{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

/* ---------------------------------------------------------------------- Overflow */

/**
 * A wide table: with many columns the `overflow-x-auto` container scrolls horizontally inside a
 * constrained width rather than breaking the page layout.
 */
export const Overflow: Story = {
  render: () => {
    const columns = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`);
    const rows = Array.from({ length: 5 }, (_, r) => r);
    return (
      <div className="w-96">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="whitespace-nowrap">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r}>
                {columns.map((col) => (
                  <TableCell key={col} className="whitespace-nowrap">
                    {col} - row {r + 1}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  },
};
