import type { Meta, StoryObj } from '@storybook/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Chart - the data-visualization Branch (spec 0062), a themeable wrapper over `recharts`
 * (the same primitive shadcn's `chart` builds on). Canopy owns the themed shell - the container,
 * the styled tooltip, and the styled legend - and the CALLER composes the recharts primitives
 * (`Bar`, `Line`, `Area`, `Pie`, axes, grid) inside `ChartContainer`, wiring `fill` / `stroke` to
 * `var(--color-<key>)`.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every chart -
 * including its axes, grid, tooltip, and legend - re-themes through the token layer (spec 0004).
 * The default series ramp resolves to existing semantic tokens (primary / info / success / warning
 * / danger), which flip under `.dark` for free.
 */
const meta = {
  title: 'Branches/Chart',
  component: ChartContainer,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Shared monthly series used across the cartesian stories. */
const MONTHLY = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 214, mobile: 140 },
];

const CONFIG = {
  desktop: { label: 'Desktop', color: 'var(--color-primary)' },
  mobile: { label: 'Mobile', color: 'var(--color-info)' },
} satisfies ChartConfig;

/* A single-series breakdown for the pie story; each slice takes a ramp color by config order. */
const BROWSERS = [
  { browser: 'chrome', visitors: 275 },
  { browser: 'safari', visitors: 200 },
  { browser: 'firefox', visitors: 187 },
  { browser: 'edge', visitors: 173 },
  { browser: 'other', visitors: 90 },
];

const BROWSER_CONFIG = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', color: 'var(--color-primary)' },
  safari: { label: 'Safari', color: 'var(--color-info)' },
  firefox: { label: 'Firefox', color: 'var(--color-success)' },
  edge: { label: 'Edge', color: 'var(--color-warning)' },
  other: { label: 'Other', color: 'var(--color-danger)' },
} satisfies ChartConfig;

export const Bar_: Story = {
  name: 'Bar',
  render: () => (
    <ChartContainer config={CONFIG} className="min-h-[280px] w-[520px]">
      <BarChart data={MONTHLY} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const Line_: Story = {
  name: 'Line',
  render: () => (
    <ChartContainer config={CONFIG} className="min-h-[280px] w-[520px]">
      <LineChart data={MONTHLY} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line dataKey="desktop" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
        <Line dataKey="mobile" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  ),
};

export const Area_: Story = {
  name: 'Area',
  render: () => (
    <ChartContainer config={CONFIG} className="min-h-[280px] w-[520px]">
      <AreaChart data={MONTHLY} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="desktop"
          type="natural"
          fill="var(--color-desktop)"
          fillOpacity={0.4}
          stroke="var(--color-desktop)"
        />
        <Area
          dataKey="mobile"
          type="natural"
          fill="var(--color-mobile)"
          fillOpacity={0.4}
          stroke="var(--color-mobile)"
        />
      </AreaChart>
    </ChartContainer>
  ),
};

export const Pie_: Story = {
  name: 'Pie',
  render: () => (
    <ChartContainer config={BROWSER_CONFIG} className="min-h-[280px] w-[400px]">
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="browser" hideIndicator={false} />} />
        <Pie data={BROWSERS} dataKey="visitors" nameKey="browser">
          {BROWSERS.map((entry) => (
            <Cell key={entry.browser} fill={`var(--color-${entry.browser})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  ),
};

export const WithTooltip: Story = {
  render: () => (
    <ChartContainer config={CONFIG} className="min-h-[280px] w-[520px]">
      <BarChart data={MONTHLY} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const WithLegend: Story = {
  render: () => (
    <ChartContainer config={CONFIG} className="min-h-[280px] w-[520px]">
      <BarChart data={MONTHLY} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
