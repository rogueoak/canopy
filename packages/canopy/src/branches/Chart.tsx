import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '../lib/cn';

/**
 * Chart - the canopy data-visualization Branch (spec 0062), a thin themeable wrapper over
 * `recharts` (the same primitive shadcn's `chart` builds on). Canopy owns the themed shell - the
 * container, the styled tooltip, and the styled legend - and the CALLER composes the recharts
 * primitives (`Bar`, `Line`, `Area`, `Pie`, axes, grid) inside it, exactly as `Combobox` (0030)
 * composes cmdk. This lives in the Branches tier: it owns a React context and wraps a portalled /
 * layout-driven primitive.
 *
 * The family mirrors shadcn's chart surface, canopy-styled with the 0005 recipe (FULL LITERAL
 * semantic-token utility strings so Tailwind v4's scanner emits each one, `cn()` merge with the
 * caller `className` winning, `forwardRef` + native prop spread, `React.ComponentRef`):
 * - `ChartContainer` - the `forwardRef` root. Takes a `ChartConfig` and renders a
 *   `recharts.ResponsiveContainer`. It injects the resolved per-series colors as scoped
 *   `--color-<key>` CSS custom properties on its wrapper, so caller primitives read
 *   `fill="var(--color-<key>)"` / `stroke="var(--color-<key>)"` and stay theme-aware.
 * - `ChartTooltip` - a binding of recharts `Tooltip` so callers wire it like native recharts.
 * - `ChartTooltipContent` - a canopy-styled tooltip body (`bg-surface-raised`, `border-border`,
 *   `shadow-md`) that reads labels and colors from the `ChartConfig` via `useChart()`.
 * - `ChartLegend` - a binding of recharts `Legend`.
 * - `ChartLegendContent` - a canopy-styled legend row that reads labels / icons / colors from the
 *   `ChartConfig`.
 * - `useChart()` - the context hook; throws a clear error outside a `ChartContainer`.
 *
 * Theming is entirely token-driven: there is NO `dark:` on the common path. The default series
 * ramp resolves to existing semantic runtime tokens (`--color-primary`, `--color-info`,
 * `--color-success`, `--color-warning`, `--color-danger`), which the token layer (spec 0004)
 * already flips under `.dark`. Because the ramp is defined once on the container and `.dark` lives
 * on `<html>` (an ancestor), the whole chart re-themes with zero per-component code. A config entry
 * can override its color with any token-backed value (or a `theme` map for distinct light / dark
 * values), still with no `dark:` in source.
 *
 * RAMP DECISION (deliberate v1 divergence from spec 0062, recorded per Architect + Designer
 * review). Spec 0062 called for a NEW `--chart-1..--chart-5` categorical token ramp in the Roots
 * token layer. v1 instead ALIASES five existing semantic role tokens, on purpose: it ships the
 * component without a cross-package Roots token change, and still themes light/dark for free with
 * no `dark:`. The accepted trade-off is that these are intent colors (danger red / warning amber
 * read as meaningful, and primary/success are both greens), so multi-series contrast and
 * meaning-neutrality are weaker than a dedicated categorical ramp would give. Follow-up: add a
 * meaning-neutral `--chart-1..--chart-5` ramp to the Roots preset and repoint `CHART_RAMP` at it -
 * a token-layer task tracked for a later pass, kept out of this additive component PR so the Roots
 * package and its generated CSS are not touched here. Callers who need distinguishable categorical
 * hues today can pass explicit `color`/`theme` per series.
 */

/**
 * ChartConfig - maps each series key to its presentation. `label` is the human name shown in the
 * tooltip / legend; `icon` renders a leading glyph in the legend; `color` (or a `theme` map for
 * distinct light / dark values) supplies the token-backed color that becomes the `--color-<key>`
 * variable. Omit `color`/`theme` to fall back to the default series ramp by declaration order.
 */
export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

// The theme selectors the optional `theme` field maps onto. `light` is the default (no ancestor
// class needed); `dark` targets the `.dark` class the token layer toggles on `<html>`. This is the
// ONLY place a `.dark` selector is emitted, and only for callers who opt into per-theme colors -
// the common path (a plain `color`, or the default ramp) never touches it.
const THEMES = { light: '', dark: '.dark' } as const;

// The default 5-color series ramp. Each step resolves to an EXISTING semantic runtime token that
// the token layer already re-themes under `.dark`, so the ramp is theme-aware for free and needs
// no new token nor any `dark:` utility. A config entry that supplies its own `color`/`theme`
// overrides its step; entries without one take the ramp in declaration order. See the file header
// RAMP DECISION note: aliasing intent tokens is a deliberate v1 choice, with a dedicated
// meaning-neutral `--chart-1..--chart-5` ramp tracked as a token-layer follow-up.
const CHART_RAMP = [
  'var(--color-primary)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-danger)',
] as const;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

/**
 * useChart - read the nearest `ChartContainer`'s `ChartConfig`. Throws a clear error when called
 * outside a `ChartContainer` so a misplaced `ChartTooltipContent` / `ChartLegendContent` fails
 * loudly instead of silently rendering unconfigured.
 */
export function useChart(): ChartContextValue {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  /** Per-series config: label, optional icon, and token-backed color (or light/dark `theme` map). */
  config: ChartConfig;
  /** The recharts chart element (e.g. `<BarChart>`), rendered inside a `ResponsiveContainer`. */
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
}

/**
 * ChartContainer - the themed root. Renders an accessible figure region (`role="figure"`) that
 * frames a `recharts.ResponsiveContainer`, provides the `ChartConfig` via context, and injects the
 * resolved `--color-<key>` variables (see `ChartStyle`). The default styles size the recharts SVG
 * to `aspect-video`, tone down the cartesian grid / axis strokes to the border token, and render
 * text at `text-text-muted` - all FULL LITERAL token utilities, no `dark:`.
 */
export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          role="figure"
          className={cn(
            "flex aspect-video justify-center text-xs text-text-muted [&_.recharts-cartesian-axis-tick_text]:fill-text-muted [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className,
          )}
          {...props}
        >
          <ChartStyle id={chartId} config={config} />
          <RechartsPrimitive.ResponsiveContainer>
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = 'ChartContainer';

/**
 * ChartStyle - emits the scoped `--color-<key>` CSS variables for the container, one rule per
 * theme. It reads the `ChartConfig`, resolving each key's color from its `color`, its `theme` map,
 * or the default series ramp (by declaration order), and scopes the variables to
 * `[data-chart=<id>]` so sibling charts do not collide. Every value is a token-backed `var(--...)`
 * or caller-supplied token string - never a raw hex.
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const entries = Object.entries(config);
  const colorEntries = entries.filter(([, item]) => item.color || item.theme);

  const css = Object.entries(THEMES)
    .map(([theme, selector]) => {
      const prefix = selector ? `${selector} ` : '';
      const lines = entries
        .map(([key, item], index) => {
          const explicit =
            item.theme?.[theme as keyof typeof item.theme] || item.color;
          // Fall back to the ramp by declaration order for keys without an explicit color; wrap the
          // index so a config longer than the 5-step ramp cycles instead of dropping to unset.
          const color = explicit || CHART_RAMP[index % CHART_RAMP.length];
          return `  --color-${key}: ${color};`;
        })
        .join('\n');
      // Only the light block carries the full ramp fallback; the `.dark` block is emitted solely so
      // callers with a `theme` map get their dark overrides - so skip it when nobody opted in.
      if (selector && colorEntries.length === 0) {
        return null;
      }
      return `${prefix}[data-chart=${id}] {\n${lines}\n}`;
    })
    .filter(Boolean)
    .join('\n');

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

/**
 * ChartTooltip - a direct binding of recharts `Tooltip`, so a caller wires it like native recharts
 * (`<ChartTooltip content={<ChartTooltipContent />} />`).
 */
export const ChartTooltip = RechartsPrimitive.Tooltip;

type RechartsTooltipProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip>;

export interface ChartTooltipContentProps
  extends React.ComponentProps<'div'>,
    Pick<RechartsTooltipProps, 'active' | 'payload' | 'label' | 'labelFormatter'> {
  /** Hide the little color swatch beside each series row. */
  hideIndicator?: boolean;
  /** Hide the tooltip label (the shared category/axis value at the top). */
  hideLabel?: boolean;
  /** Override which config/payload field supplies the series name. Defaults to `dataKey`/`name`. */
  nameKey?: string;
  /** Override which field supplies the tooltip label. Defaults to the recharts `label`. */
  labelKey?: string;
}

/** Read the config entry for a payload item, honouring `nameKey`/`labelKey` overrides. */
function getPayloadConfig(
  config: ChartConfig,
  payloadItem: Record<string, unknown>,
  key: string,
): (ChartConfig[string] & { key: string }) | undefined {
  const payloadInner =
    typeof payloadItem.payload === 'object' && payloadItem.payload !== null
      ? (payloadItem.payload as Record<string, unknown>)
      : undefined;

  let configKey = key;
  if (typeof payloadItem[key] === 'string') {
    configKey = payloadItem[key] as string;
  } else if (payloadInner && typeof payloadInner[key] === 'string') {
    configKey = payloadInner[key] as string;
  }

  return configKey in config ? { ...config[configKey], key: configKey } : undefined;
}

/**
 * ChartTooltipContent - the canopy-styled tooltip body. Rendered by recharts with the hovered
 * `payload`; it reads each series' label and color from the `ChartConfig` via `useChart()` and
 * lays them out on a raised-surface card (`bg-surface-raised border border-border shadow-md`),
 * with a per-series color swatch driven by the `--color-<key>` variable. Returns `null` when the
 * tooltip is inactive or the payload is empty, so nothing renders off-hover.
 */
export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      label,
      labelFormatter,
      hideIndicator = false,
      hideLabel = false,
      nameKey,
      labelKey,
      ...props
    },
    ref,
  ) => {
    const { config } = useChart();

    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const items = payload as unknown as Array<Record<string, unknown>>;

    const tooltipLabel = (() => {
      if (hideLabel) {
        return null;
      }
      const first = items[0];
      if (!first) {
        return null;
      }
      const key = labelKey || (first.dataKey as string) || (first.name as string) || 'value';
      const itemConfig = getPayloadConfig(config, first, key);
      const value =
        !labelKey && typeof label === 'string'
          ? config[label]?.label || label
          : itemConfig?.label;
      if (labelFormatter && value !== undefined) {
        return (
          <div className="text-label text-text">{labelFormatter(value, payload ?? [])}</div>
        );
      }
      if (value === undefined || value === null) {
        return null;
      }
      return <div className="text-label text-text">{value}</div>;
    })();

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-text shadow-md',
          className,
        )}
        {...props}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {items.map((item, index) => {
            const key = nameKey || (item.name as string) || (item.dataKey as string) || 'value';
            const itemConfig = getPayloadConfig(config, item, key);
            const indicatorColor =
              (item.color as string) || `var(--color-${itemConfig?.key ?? key})`;
            return (
              <div
                key={(item.dataKey as string) || String(index)}
                className="flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-text-muted"
              >
                {!hideIndicator ? (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: indicatorColor }}
                  />
                ) : null}
                <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                  <span className="text-text-muted">{itemConfig?.label || (item.name as string)}</span>
                  {item.value !== undefined && item.value !== null ? (
                    <span className="text-label font-mono text-text">
                      {typeof item.value === 'number'
                        ? item.value.toLocaleString()
                        : String(item.value)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

/**
 * ChartLegend - a direct binding of recharts `Legend`, so a caller wires it like native recharts
 * (`<ChartLegend content={<ChartLegendContent />} />`).
 */
export const ChartLegend = RechartsPrimitive.Legend;

type RechartsLegendProps = React.ComponentProps<typeof RechartsPrimitive.Legend>;

export interface ChartLegendContentProps
  extends React.ComponentProps<'div'>,
    Pick<RechartsLegendProps, 'payload' | 'verticalAlign'> {
  /** Hide the little color swatch beside each legend entry. */
  hideIcon?: boolean;
  /** Override which payload field supplies the series name. Defaults to `dataKey`. */
  nameKey?: string;
}

/**
 * ChartLegendContent - the canopy-styled legend row. Rendered by recharts with the series
 * `payload`; it reads each entry's label, icon, and color from the `ChartConfig` via `useChart()`
 * and renders a horizontal row of token-styled entries, each with a `--color-<key>` swatch (or the
 * config `icon`). Returns `null` when the payload is empty.
 */
export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey, ...props }, ref) => {
    const { config } = useChart();

    if (!payload || payload.length === 0) {
      return null;
    }

    const items = payload as unknown as Array<Record<string, unknown>>;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className,
        )}
        {...props}
      >
        {items.map((item, index) => {
          const key = nameKey || (item.dataKey as string) || (item.value as string) || 'value';
          const itemConfig = getPayloadConfig(config, item, key);
          const Icon = itemConfig?.icon;
          return (
            <div
              key={(item.value as string) || String(index)}
              className="flex items-center gap-1.5 text-text-muted [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-text-muted"
            >
              {itemConfig?.icon && !hideIcon && Icon ? (
                <Icon />
              ) : !hideIcon ? (
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: (item.color as string) || `var(--color-${itemConfig?.key ?? key})` }}
                />
              ) : null}
              {itemConfig?.label || (item.value as string)}
            </div>
          );
        })}
      </div>
    );
  },
);
ChartLegendContent.displayName = 'ChartLegendContent';
