import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@rogueoak/canopy/seeds';

/**
 * Seeds/Tooltip — the hover/focus hint Seed (spec 0014), built on `@radix-ui/react-tooltip`.
 *
 * Styled entirely with semantic-token utilities: the portalled content sits on a raised-surface
 * card (`bg-surface-raised` + `border` + `shadow-md`) with terse `text-xs`, and the arrow is
 * filled with `fill-surface-raised` to match. There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story — including the portalled hint — re-themes via the
 * token layer (spec 0004).
 *
 * Wrap the examples in a `TooltipProvider` (shared open delay). The tooltip opens on hover AND
 * keyboard focus, and closes on blur or Escape (Radix).
 */
const meta = {
  title: 'Seeds/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------- Basic */

/**
 * A basic tooltip on a `Button` trigger (`asChild` so the Button stays the real element). Hover
 * the button or Tab to it — the hint appears after the provider's delay and points at the trigger.
 */
export const Basic: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Add to library</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

/* ----------------------------------------------------------------- Sides */

/**
 * The same tooltip placed on each side via the `side` passthrough (top · right · bottom · left).
 * Each card carries the matching arrow, themed identically in light and dark.
 */
export const Sides: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline">{side}</Button>
            </TooltipTrigger>
            <TooltipContent side={side}>On the {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
};
