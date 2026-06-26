import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../lib/cn';

/**
 * Select — the canopy single-choice dropdown Seed (spec 0013), built on
 * `@radix-ui/react-select` and the 0005 component recipe: semantic-token Tailwind utilities
 * (FULL LITERAL strings so Tailwind v4's scanner emits each one), `cn()` class merge, and
 * `forwardRef` on every styled wrapper with a full native prop spread. There is NO `dark:` on
 * the common path — light/dark flips automatically through the token layer (spec 0004), and
 * because the `.dark` class lives on `<html>`, Radix-portalled `SelectContent` (mounted under
 * `<body>`) themes correctly too.
 *
 * The family mirrors the shadcn surface area:
 * - `Select` — the stateful root (`SelectPrimitive.Root`), owns `value` / `onValueChange`.
 * - `SelectGroup` / `SelectLabel` — group related options under a heading.
 * - `SelectValue` — renders the selected option's text (or the placeholder) in the trigger.
 * - `SelectTrigger` — the field button; styled for parity with the Input field
 *   (`border-border` / `bg-surface` / `text-text`, focus-visible ring, `disabled:*` token pair,
 *   and `aria-invalid:` danger overrides) plus a trailing chevron and a muted placeholder via
 *   `data-[placeholder]:text-text-muted`.
 * - `SelectContent` — the portalled popup (`surface-raised` + `border` + the primitive
 *   `shadow-md`; there is no semantic elevation token yet).
 * - `SelectItem` — a selectable option with a leading check `ItemIndicator`.
 * - `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton` — supporting parts.
 *
 * Single-select only; multi-select / combobox / async search are out of scope (spec 0013).
 */
const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

/**
 * SelectTrigger — the field button that opens the dropdown. Class tokens mirror the Input
 * field (spec 0006) for visual parity: `border-border` + `bg-surface` + `text-text`, the
 * shared focus-visible ring, the `disabled:*` token pair (not opacity), and the
 * `aria-invalid:` danger overrides so an invalid Select reads identically to an invalid Input.
 * The placeholder picks up `data-[placeholder]:text-text-muted`, and a chevron-down SVG sits
 * at the trailing edge.
 *
 * Single height (`h-10`) by design — it matches Input's default (`md`). A Select trigger sizing
 * to Input's `sm`/`lg` isn't a need yet; if it becomes one, lift the height into a cva `size`
 * variant mirroring `inputVariants` (deferred, not an oversight).
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger data-[placeholder]:text-text-muted [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
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
        className="ml-2 h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * SelectScrollUpButton — the affordance Radix shows when the option list overflows upward.
 * Inherits the content's text token; a chevron-up SVG centres it.
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
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
      className="h-4 w-4"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * SelectScrollDownButton — the downward overflow affordance (mirror of the up button).
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
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
      className="h-4 w-4"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/**
 * SelectContent — the portalled dropdown surface. Rendered through `SelectPrimitive.Portal`
 * (so it escapes overflow/stacking contexts) onto a raised-surface card: `bg-surface-raised`
 * + `text-text` + `border border-border` + `rounded-md` + the primitive `shadow-md` (there is
 * no semantic elevation token yet — chosen as the closest default-elevation primitive). When
 * `position="popper"` (the default here) the viewport is offset off the trigger and sized to
 * the trigger width via Radix's CSS vars.
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-surface-raised text-text shadow-md',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * SelectLabel — a non-interactive heading for a `SelectGroup`. Uses the muted text token and
 * matches the items' left padding so the heading aligns above their text (past the check gutter).
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-medium text-text-muted', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * SelectItem — a selectable option. Highlight (keyboard/hover via Radix's `focus` state) uses
 * the raised-surface `muted-raised` fill (feedback 0006): the popover sits on `surface-raised`,
 * where base `muted` would *recede* in dark (stone.900 darker than the stone.800 surface), so
 * the item lifts toward the foreground in BOTH themes instead. The `data-[disabled]` state dims
 * with opacity and drops pointer events. A leading check `ItemIndicator` sits in the left gutter
 * (`pl-8`) for the current value, and the option text renders through `ItemText`.
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text outline-none focus:bg-muted-raised focus:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
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
          className="h-4 w-4"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * SelectSeparator — a hairline divider between groups/items, tinted with the `border` token.
 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

export type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;
export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;
export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;
export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;
export type SelectValueProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;
export type SelectGroupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;
export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;
export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;
