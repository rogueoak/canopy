import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../lib/cn';

/**
 * Tabs - the in-place panel switcher Branch (spec 0051), built on `@radix-ui/react-tabs`.
 * Where `Dialog`/`Combobox` own a portal, Tabs owns only interaction state - the selected tab and
 * roving focus - and renders entirely in place, so there is no portal theming caveat: the whole
 * tree inherits `.dark` from `<html>` like any in-page component (spec 0004).
 *
 * Radix supplies the whole accessible machine: the `tablist`/`tab`/`tabpanel` roles, roving
 * tabindex, arrow/Home/End navigation, `orientation` handling, and the `aria-selected` /
 * `aria-controls` / `aria-orientation` wiring between parts - so canopy only styles it and never
 * overrides the semantics. The family mirrors the shadcn surface, canopy-styled:
 * - `Tabs` - the stateful root over `TabsPrimitive.Root`. Uncontrolled via `defaultValue` or
 *   controlled via `value` + `onValueChange`; passes `orientation` ("horizontal" default,
 *   "vertical").
 * - `TabsList` - `TabsPrimitive.List` (`role="tablist"`): an inline flex row of triggers for
 *   horizontal, a flex column for vertical, sitting on a `border-border` rail that the active
 *   underline aligns to.
 * - `TabsTrigger` - `TabsPrimitive.Trigger` (`role="tab"`): the tab button; `text-text-muted` when
 *   inactive, `text-text` with an active underline via the `data-[state=active]:` variant when
 *   selected; the shared focus-visible ring; the toggle-style `disabled:opacity-50
 *   disabled:cursor-not-allowed` (the tab has no fill to preserve); `cursor-pointer` on the base,
 *   matching the Button idiom.
 * - `TabsContent` - `TabsPrimitive.Content` (`role="tabpanel"`): the panel region, with the
 *   focus-visible ring so it is reachable/visible when focused after selection.
 *
 * Active/inactive is driven purely by Radix's `data-state="active"` through Tailwind
 * `data-[state=active]:` variants (no custom prop, no imperative class toggling), matching the
 * data-driven styling learning. Full literal semantic-token class strings so Tailwind v4's scanner
 * emits each; `cn()` merges the caller `className` last (caller wins); `forwardRef` + native prop
 * spread + `React.ComponentRef` typing on every part. No motion in v1 (panels swap instantly).
 */
const Tabs = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn(
      'flex flex-col gap-4 data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-6',
      className,
    )}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

/**
 * TabsList - the roving `role="tablist"`. Horizontal: an inline flex row of triggers sitting on a
 * bottom `border-border` rail that the active underline aligns to. Vertical
 * (`data-[orientation=vertical]:`): a flex column with a trailing (right) rail instead.
 */
const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex items-center gap-1 border-b border-border data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-r',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * TabsTrigger - one `role="tab"` button. `text-label` on `text-text-muted` when inactive; on
 * `data-state="active"` it goes `text-text` with a `border-primary` underline (a transparent
 * bottom border in the resting state keeps the label from shifting when the underline appears; the
 * vertical variant moves the accent to the trailing edge). The shared focus-visible ring, and the
 * toggle-style `disabled:opacity-50 disabled:cursor-not-allowed` (no fill to preserve).
 * `cursor-pointer` on the base matches the Button idiom.
 */
const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center whitespace-nowrap border-b-2 border-transparent px-3 py-1.5 text-label text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-text data-[orientation=vertical]:justify-start data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-r-2 data-[orientation=vertical]:-mr-px',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * TabsContent - one `role="tabpanel"`. The panel body, with the shared focus-visible ring so the
 * panel is visible/reachable when Radix moves focus to it after selection.
 */
const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'flex-1 text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

export type TabsProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>;
export type TabsListProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>;
export type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>;
export type TabsContentProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>;
