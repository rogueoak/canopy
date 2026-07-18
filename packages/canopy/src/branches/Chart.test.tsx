import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { BarChart, Bar, Line, LineChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  useChart,
  type ChartConfig,
} from './Chart';

// recharts' ResponsiveContainer measures itself with a ResizeObserver (shimmed in vitest.setup)
// and renders nothing until it has a non-zero size. jsdom reports 0x0, so we force the observed
// dimensions by stubbing the client rect getters the container reads on mount. This lets the SVG
// chart mount so we can assert observable output (children present, accessible region, injected
// CSS variables) rather than a library internal.
function stubLayout() {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 400,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 300,
  });
}

const DATA = [
  { month: 'Jan', desktop: 120, mobile: 80 },
  { month: 'Feb', desktop: 200, mobile: 140 },
];

const CONFIG = {
  desktop: { label: 'Desktop', color: 'var(--color-primary)' },
  mobile: { label: 'Mobile', color: 'var(--color-info)' },
} satisfies ChartConfig;

describe('ChartContainer', () => {
  it('renders an accessible figure region with its children', () => {
    stubLayout();
    render(
      <ChartContainer config={CONFIG}>
        <BarChart data={DATA} accessibilityLayer>
          <Bar dataKey="desktop" fill="var(--color-desktop)" />
        </BarChart>
      </ChartContainer>,
    );
    // The container exposes an accessible figure region.
    expect(screen.getByRole('figure')).toBeInTheDocument();
  });

  it('injects scoped --color-<key> CSS variables from the config', () => {
    stubLayout();
    const { container } = render(
      <ChartContainer config={CONFIG}>
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    const style = container.querySelector('style');
    expect(style).not.toBeNull();
    const css = style?.innerHTML ?? '';
    expect(css).toContain('--color-desktop: var(--color-primary);');
    expect(css).toContain('--color-mobile: var(--color-info);');
    // The variables are scoped to the container's data-chart id, not leaked globally.
    const figure = screen.getByRole('figure');
    const chartId = figure.getAttribute('data-chart');
    expect(chartId).toBeTruthy();
    expect(css).toContain(`[data-chart=${chartId}]`);
  });

  it('falls back to the default ramp for keys without an explicit color', () => {
    stubLayout();
    const config = {
      a: { label: 'A' },
      b: { label: 'B' },
    } satisfies ChartConfig;
    const { container } = render(
      <ChartContainer config={config}>
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    const css = container.querySelector('style')?.innerHTML ?? '';
    expect(css).toContain('--color-a: var(--color-primary);');
    expect(css).toContain('--color-b: var(--color-info);');
  });

  it('wraps the ramp past its 5th step so a 6th un-colored series cycles back to the start', () => {
    stubLayout();
    const config = {
      a: { label: 'A' },
      b: { label: 'B' },
      c: { label: 'C' },
      d: { label: 'D' },
      e: { label: 'E' },
      f: { label: 'F' },
    } satisfies ChartConfig;
    const { container } = render(
      <ChartContainer config={config}>
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    const css = container.querySelector('style')?.innerHTML ?? '';
    // Index 5 (the 6th key) wraps to index 0 - the ramp's first step - rather than dropping to unset.
    expect(css).toContain('--color-e: var(--color-danger);');
    expect(css).toContain('--color-f: var(--color-primary);');
  });

  it('emits a .dark override block when a config entry uses a theme map', () => {
    stubLayout();
    const config = {
      desktop: {
        label: 'Desktop',
        theme: { light: 'var(--color-primary)', dark: 'var(--color-info)' },
      },
    } satisfies ChartConfig;
    const { container } = render(
      <ChartContainer config={config}>
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    const css = container.querySelector('style')?.innerHTML ?? '';
    expect(css).toContain('.dark [data-chart=');
    expect(css).toContain('--color-desktop: var(--color-info);');
  });

  it('merges the caller className (caller wins) on the wrapper', () => {
    stubLayout();
    render(
      <ChartContainer config={CONFIG} className="aspect-square custom-chart">
        <LineChart data={DATA}>
          <Line dataKey="desktop" />
        </LineChart>
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toHaveClass('custom-chart');
    // tailwind-merge drops the default aspect-video in favour of the caller's aspect-square.
    expect(figure).toHaveClass('aspect-square');
    expect(figure).not.toHaveClass('aspect-video');
  });

  it('forwards its ref to the wrapper div', () => {
    stubLayout();
    const ref = createRef<HTMLDivElement>();
    render(
      <ChartContainer config={CONFIG} ref={ref}>
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('role', 'figure');
  });

  it('spreads native props onto the wrapper', () => {
    stubLayout();
    render(
      <ChartContainer config={CONFIG} data-testid="my-chart" aria-label="Revenue">
        <BarChart data={DATA}>
          <Bar dataKey="desktop" />
        </BarChart>
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toHaveAttribute('data-testid', 'my-chart');
    expect(figure).toHaveAttribute('aria-label', 'Revenue');
  });
});

describe('useChart', () => {
  it('throws a clear error when used outside a ChartContainer', () => {
    const Probe = () => {
      useChart();
      return null;
    };
    expect(() => render(<Probe />)).toThrow(/must be used within a <ChartContainer/);
  });
});

// The styled content parts (ChartTooltipContent / ChartLegendContent) are normally rendered by
// recharts via a Tooltip/Legend `content` prop on hover - which jsdom cannot drive. To test the
// parts in isolation we render them as the single child of a ChartContainer: ResponsiveContainer
// clones its lone child with measured width/height and renders it, so the part mounts as a React
// descendant of the ChartContext provider (so useChart resolves) with no recharts interaction.
function renderInChart(node: React.ReactElement) {
  stubLayout();
  return render(<ChartContainer config={CONFIG}>{node}</ChartContainer>);
}

describe('ChartTooltipContent', () => {
  const payload = [
    { name: 'desktop', dataKey: 'desktop', value: 120, color: 'var(--color-desktop)', payload: DATA[0] },
    { name: 'mobile', dataKey: 'mobile', value: 80, color: 'var(--color-mobile)', payload: DATA[0] },
  ];

  it('renders the configured labels and values for a payload', () => {
    renderInChart(<ChartTooltipContent active payload={payload} label="Jan" />);
    // The shared label heading renders at the top of the tooltip card.
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('runs the label through labelFormatter when provided', () => {
    renderInChart(
      <ChartTooltipContent
        active
        payload={payload}
        label="Jan"
        labelFormatter={(value) => `Month: ${value as string}`}
      />,
    );
    expect(screen.getByText('Month: Jan')).toBeInTheDocument();
    // The raw label is replaced by the formatted heading.
    expect(screen.queryByText('Jan')).toBeNull();
  });

  it('omits the label heading when hideLabel is set', () => {
    renderInChart(<ChartTooltipContent active payload={payload} label="Jan" hideLabel />);
    expect(screen.queryByText('Jan')).toBeNull();
    // The series rows still render.
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('renders a color swatch per series driven by --color-<key>', () => {
    const { container } = renderInChart(
      <ChartTooltipContent active payload={payload} label="Jan" />,
    );
    const swatches = container.querySelectorAll('span[style*="background-color"]');
    expect(swatches.length).toBe(2);
    expect((swatches[0] as HTMLElement).style.backgroundColor).toBe('var(--color-desktop)');
  });

  it('renders nothing when inactive or the payload is empty', () => {
    const { container } = renderInChart(<ChartTooltipContent active={false} payload={payload} />);
    // No tooltip card rows render when inactive.
    expect(container.querySelector('span[style*="background-color"]')).toBeNull();
  });

  it('hides the indicator swatch when hideIndicator is set', () => {
    const { container } = renderInChart(
      <ChartTooltipContent active payload={payload} label="Jan" hideIndicator />,
    );
    expect(container.querySelector('span[style*="background-color"]')).toBeNull();
    // Labels still render.
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('merges the caller className on the tooltip card (caller wins)', () => {
    const { container } = renderInChart(
      <ChartTooltipContent active payload={payload} label="Jan" className="rounded-none custom-tip" />,
    );
    const card = container.querySelector('.custom-tip');
    expect(card).not.toBeNull();
    expect(card).toHaveClass('rounded-none');
    expect(card).not.toHaveClass('rounded-lg');
  });

  it('forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    renderInChart(<ChartTooltipContent ref={ref} active payload={payload} label="Jan" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('ChartLegendContent', () => {
  const payload = [
    { value: 'desktop', dataKey: 'desktop', color: 'var(--color-desktop)' },
    { value: 'mobile', dataKey: 'mobile', color: 'var(--color-mobile)' },
  ];

  it('renders the configured labels', () => {
    renderInChart(<ChartLegendContent payload={payload} />);
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  it('renders a swatch per entry by default', () => {
    const { container } = renderInChart(<ChartLegendContent payload={payload} />);
    const swatches = container.querySelectorAll('span[style*="background-color"]');
    expect(swatches.length).toBe(2);
  });

  it('renders the config icon instead of a swatch when provided', () => {
    stubLayout();
    const Dot = () => <svg data-testid="legend-icon" />;
    const config = {
      desktop: { label: 'Desktop', color: 'var(--color-primary)', icon: Dot },
    } satisfies ChartConfig;
    render(
      <ChartContainer config={config}>
        <ChartLegendContent payload={[{ value: 'desktop', dataKey: 'desktop' }]} />
      </ChartContainer>,
    );
    expect(screen.getByTestId('legend-icon')).toBeInTheDocument();
  });

  it('hides swatches when hideIcon is set', () => {
    const { container } = renderInChart(<ChartLegendContent payload={payload} hideIcon />);
    expect(container.querySelector('span[style*="background-color"]')).toBeNull();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('renders nothing when the payload is empty', () => {
    const { container } = renderInChart(<ChartLegendContent payload={[]} />);
    expect(container.querySelector('span[style*="background-color"]')).toBeNull();
  });

  it('merges the caller className (caller wins) and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderInChart(
      <ChartLegendContent ref={ref} payload={payload} className="custom-legend gap-8" />,
    );
    const legend = container.querySelector('.custom-legend');
    expect(legend).not.toBeNull();
    expect(legend).toHaveClass('gap-8');
    expect(legend).not.toHaveClass('gap-4');
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
