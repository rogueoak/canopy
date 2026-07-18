import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/cn';

/**
 * DropdownMenu - the canopy actions-menu Branch (spec 0054), built on
 * `@radix-ui/react-dropdown-menu` and the 0005 component recipe: full literal semantic-token
 * Tailwind utilities (so Tailwind v4's scanner emits each class), `cn()` class merge (caller
 * `className` wins), and `forwardRef` + native prop spread on every styled part with
 * `React.ComponentRef` typing. There is NO `dark:` on the common path - light/dark flips through
 * the token layer (spec 0004), and because `.dark` lives on `<html>`, the Radix-portalled content
 * (mounted under `<body>`) themes correctly too (same note as `DialogContent` 0021 /
 * `SelectContent` 0013).
 *
 * A Branch owns interaction state and a portal: Radix supplies the open/close state machine, the
 * `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles with `aria-checked`, roving
 * focus + full keyboard navigation, typeahead, controlled + uncontrolled state (open, checkbox,
 * radio), submenu positioning, and focus-return-to-trigger - so this component is composition +
 * token styling, not hand-rolled focus management.
 *
 * The family mirrors the shadcn dropdown-menu surface area:
 * - `DropdownMenu` - the stateful root (`open` / `onOpenChange`; controlled or uncontrolled).
 * - `DropdownMenuTrigger` - opens the menu; `asChild` to wrap a canopy `Button` (no nested button).
 * - `DropdownMenuContent` - the portalled, collision-aware menu surface (raised-surface pattern).
 * - `DropdownMenuItem` - a focusable action row; fires and closes.
 * - `DropdownMenuCheckboxItem` - a toggle row with a leading check; stays open on activate.
 * - `DropdownMenuRadioGroup` / `DropdownMenuRadioItem` - a single-choice group with a leading dot.
 * - `DropdownMenuLabel` - a non-interactive section heading; `DropdownMenuSeparator` a divider;
 *   `DropdownMenuShortcut` a muted trailing hint (a plain styled `span`, not a Radix part).
 * - `DropdownMenuGroup` - groups related items; `DropdownMenuSub` / `SubTrigger` / `SubContent`
 *   nest a submenu that opens on hover / right-arrow.
 *
 * Item highlight (Radix `data-[highlighted]`) uses the raised-surface `bg-muted-raised` fill: the
 * menu sits on `surface-raised`, where base `muted` would recede in dark, so the row lifts toward
 * the foreground in BOTH themes. Disabled items use the toggle disabled pair
 * (`opacity-50` + `cursor-not-allowed`) so a disabled checkbox/radio item keeps its fill. The
 * `cursor-pointer` idiom follows Button. Enter/exit motion reuses the existing `animate-pop-*`
 * presets gated with `motion-reduce:animate-none` - no new keyframes.
 */
const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/**
 * DropdownMenuContent - the portalled menu surface. Rendered through
 * `DropdownMenuPrimitive.Portal` (so it escapes overflow/stacking contexts) onto the raised-surface
 * card (`bg-surface-raised` + `text-text` + `border border-border` + `rounded-md` + the primitive
 * `shadow-md`), `p-1`, `min-w-[8rem]`, with a default `sideOffset`. Collision avoidance and side
 * flipping come from Radix. Enter/exit pop is gated with `motion-reduce:animate-none`.
 */
const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * DropdownMenuItem - a focusable action row. Radix marks the keyboard/hover-highlighted item via
 * `data-[highlighted]`, styled with the raised-surface `bg-muted-raised` fill; `data-[disabled]`
 * dims with opacity and drops pointer events. `inset` adds left padding to align a plain item under
 * check/radio rows.
 */
const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm text-text outline-none data-[highlighted]:bg-muted-raised data-[highlighted]:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/**
 * DropdownMenuCheckboxItem - a toggle row. Same row styling as `DropdownMenuItem` plus a left
 * gutter (`pl-8`) for a leading check `ItemIndicator`; it stays open on activate (the wrapper
 * `preventDefault`s the close-on-select so a toggle can be flipped repeatedly - the canonical
 * shadcn menu behaviour) and exposes `aria-checked` from Radix. A disabled checked item keeps its
 * check fill (opacity-only disable). A caller may still call `event.preventDefault()` (a no-op
 * here) or read the event in their own `onSelect`.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, onSelect, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    checked={checked}
    onSelect={(event) => {
      // Keep the menu open so the toggle can be flipped repeatedly (spec 0054: "stays open").
      event.preventDefault();
      onSelect?.(event);
    }}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-body-sm text-text outline-none data-[highlighted]:bg-muted-raised data-[highlighted]:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
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
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/**
 * DropdownMenuRadioItem - a single-choice row inside a `DropdownMenuRadioGroup`. Same row styling
 * with a left gutter (`pl-8`) for a leading filled-dot `ItemIndicator`; exposes `aria-checked` from
 * Radix and stays in the `menuitemradio` role. It stays open on activate (the wrapper
 * `preventDefault`s close-on-select, matching the checkbox item and spec 0054's "stays open") so a
 * choice can be changed without reopening. A disabled selected item keeps its dot fill.
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, onSelect, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    onSelect={(event) => {
      // Keep the menu open so the selection can be changed in place (spec 0054: "stays open").
      event.preventDefault();
      onSelect?.(event);
    }}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-body-sm text-text outline-none data-[highlighted]:bg-muted-raised data-[highlighted]:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-2 w-2">
          <circle cx="12" cy="12" r="12" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/**
 * DropdownMenuLabel - a non-interactive section heading. Uses the muted text token in the `label`
 * role; `inset` aligns it above check/radio rows (past the indicator gutter).
 */
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-label text-text-muted', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/**
 * DropdownMenuSeparator - a hairline divider between groups/items, tinted with the `border` token.
 */
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * DropdownMenuShortcut - a plain styled `span` (not a Radix part) for a trailing shortcut hint,
 * pushed to the right edge (`ml-auto`) in the subtle text token with wide tracking.
 */
const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('ml-auto text-caption text-text-subtle tracking-widest', className)} {...props} />
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

/**
 * DropdownMenuSubTrigger - the row that opens a submenu on hover / right-arrow. Item row styling
 * plus a trailing chevron and `data-[state=open]:bg-muted-raised` so the parent row stays lit while
 * its submenu is open. `inset` aligns it under check/radio rows.
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm text-text outline-none data-[highlighted]:bg-muted-raised data-[highlighted]:text-text data-[state=open]:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
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
      className="ml-auto h-4 w-4"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/**
 * DropdownMenuSubContent - the portalled submenu surface. Same raised-surface styling as
 * `DropdownMenuContent`; Radix positions it beside its `SubTrigger` with collision avoidance.
 * Enter/exit pop is gated with `motion-reduce:animate-none`.
 */
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

export type DropdownMenuProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>;
export type DropdownMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Trigger
>;
export type DropdownMenuContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
>;
export type DropdownMenuItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> & { inset?: boolean };
export type DropdownMenuCheckboxItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.CheckboxItem
>;
export type DropdownMenuRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioGroup
>;
export type DropdownMenuRadioItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.RadioItem
>;
export type DropdownMenuLabelProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Label
> & { inset?: boolean };
export type DropdownMenuSeparatorProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
>;
export type DropdownMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;
export type DropdownMenuGroupProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Group
>;
export type DropdownMenuSubProps = React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Sub>;
export type DropdownMenuSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubTrigger
> & { inset?: boolean };
export type DropdownMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.SubContent
>;
