import * as React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { cn } from '../lib/cn';

/**
 * ContextMenu - the canopy right-click menu Branch (spec 0055), built on
 * `@radix-ui/react-context-menu` and the 0005 component recipe: semantic-token Tailwind utilities
 * (FULL LITERAL strings so Tailwind v4's scanner emits each one), `cn()` class merge, and
 * `forwardRef` on every styled wrapper with a full native prop spread. There is NO `dark:` on the
 * common path - light/dark flips automatically through the token layer (spec 0004), and because
 * the `.dark` class lives on `<html>`, the Radix-portalled `ContextMenuContent` (mounted under
 * `<body>`) themes correctly too.
 *
 * `ContextMenu` is the pointer-triggered sibling of `DropdownMenu` (0054): it exposes the SAME
 * menu part surface with the same canopy styling, but opens from the platform **contextmenu**
 * event (right-click / long-press) anchored at the pointer instead of from a trigger button.
 * Radix supplies the contextmenu-event trigger, pointer-anchored collision-aware positioning,
 * portalling, roving focus, type-ahead, submenu machinery, and the full
 * `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` role set - so this component is
 * composition + token styling, not hand-rolled menu semantics.
 *
 * The family mirrors the shadcn surface area:
 * - `ContextMenu` - the stateful root (`ContextMenuPrimitive.Root`), owns open state.
 * - `ContextMenuTrigger` - the region that captures the contextmenu gesture; `asChild` via the
 *   primitive so callers can attach it to any element (a row, card, canvas node).
 * - `ContextMenuContent` - the portalled, pointer-anchored surface on the raised-surface pattern.
 * - `ContextMenuItem` - a selectable row; highlight uses the raised `bg-muted-raised` fill.
 * - `ContextMenuCheckboxItem` / `ContextMenuRadioItem` (+ `ContextMenuRadioGroup`) - toggle rows
 *   with a leading check / dot indicator.
 * - `ContextMenuSub` / `ContextMenuSubTrigger` / `ContextMenuSubContent` - nested submenu (the
 *   trigger shows a trailing chevron and opens on hover / right-arrow).
 * - `ContextMenuLabel` (muted heading), `ContextMenuSeparator` (hairline), `ContextMenuGroup`
 *   (grouping wrapper), and `ContextMenuShortcut` (a right-aligned trailing-hint span).
 *
 * The token classes are copied verbatim from `DropdownMenu` so an item, submenu, separator, and
 * shortcut read identically across the two menus. Content motion uses the shared `animate-pop-*`
 * menu animation, gated with `motion-reduce:animate-none`. Flat single-level submenus only for v1
 * (spec 0055, Out of scope).
 */
const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSub = ContextMenuPrimitive.Sub;

/**
 * ContextMenuContent - the portalled menu surface. Rendered through `ContextMenuPrimitive.Portal`
 * (so it escapes overflow/stacking contexts) onto a raised-surface card: `bg-surface-raised` +
 * `text-text` + `border border-border` + `rounded-md` + the primitive `shadow-md` (there is no
 * semantic elevation token yet), `p-1`, `min-w-[8rem]`. Enter/exit uses the shared `animate-pop-*`
 * menu animation gated with `motion-reduce:animate-none`, matching `DropdownMenuContent` exactly.
 */
const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

/**
 * ContextMenuItem - a selectable menu row. Keyboard/hover highlight (Radix's `focus` state) uses
 * the raised-surface `bg-muted-raised` fill (the raised-surface rule): the menu sits on
 * `surface-raised`, where base `bg-muted` would recede in dark, so the item lifts toward the
 * foreground in BOTH themes. The `data-[disabled]` state dims with opacity and drops pointer
 * events. `inset` adds the left padding used to align items under a `Label` / past a check gutter.
 */
const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-text outline-none focus:bg-muted-raised focus:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

/**
 * ContextMenuCheckboxItem - a `menuitemcheckbox` row with a leading check indicator in the left
 * gutter (`pl-8`), shown only when checked via Radix's `ItemIndicator`. Same highlight / disabled
 * idiom as `ContextMenuItem`.
 */
const ContextMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text outline-none focus:bg-muted-raised focus:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
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
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

/**
 * ContextMenuRadioItem - a `menuitemradio` row with a leading filled-dot indicator in the left
 * gutter (`pl-8`), shown only for the selected item via Radix's `ItemIndicator`. Same highlight /
 * disabled idiom as `ContextMenuItem`.
 */
const ContextMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-text outline-none focus:bg-muted-raised focus:text-text data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="currentColor"
          aria-hidden="true"
          className="h-2 w-2"
        >
          <circle cx="4" cy="4" r="4" />
        </svg>
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

/**
 * ContextMenuLabel - a non-interactive heading for a group. Uses the muted text token (`text-text-
 * muted`) at `text-caption` scale. `inset` aligns it above items past the check gutter.
 */
const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-caption font-medium text-text-muted', inset && 'pl-8', className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

/**
 * ContextMenuSeparator - a hairline divider between groups/items, tinted with the `border` token
 * and pulled full-bleed past the content padding (`-mx-1`).
 */
const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

/**
 * ContextMenuSubTrigger - the row that opens a nested submenu on hover / right-arrow. Same row
 * styling as `ContextMenuItem` plus a `data-[state=open]:bg-muted-raised` open-state fill and a
 * trailing chevron pointing to where the submenu appears. `inset` aligns it past the check gutter.
 */
const ContextMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-text outline-none focus:bg-muted-raised focus:text-text data-[state=open]:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

/**
 * ContextMenuSubContent - the portalled nested submenu surface. Same raised-surface card + motion
 * as `ContextMenuContent`.
 */
const ContextMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

/**
 * ContextMenuShortcut - a plain right-aligned span for a trailing keyboard hint (e.g. `Cmd+C`).
 * Pushed to the trailing edge (`ml-auto`) in the subtle text token at `text-caption` scale. Not a
 * Radix part - a styled `span` the caller drops inside an item.
 */
const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-caption tracking-widest text-text-subtle', className)}
    {...props}
  />
);
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuGroup,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuShortcut,
};

export type ContextMenuProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Root>;
export type ContextMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Trigger
>;
export type ContextMenuGroupProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Group
>;
export type ContextMenuContentProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Content
>;
export type ContextMenuItemProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Item
> & { inset?: boolean };
export type ContextMenuCheckboxItemProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.CheckboxItem
>;
export type ContextMenuRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.RadioGroup
>;
export type ContextMenuRadioItemProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.RadioItem
>;
export type ContextMenuLabelProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Label
> & { inset?: boolean };
export type ContextMenuSeparatorProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.Separator
>;
export type ContextMenuSubProps = React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Sub>;
export type ContextMenuSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.SubTrigger
> & { inset?: boolean };
export type ContextMenuSubContentProps = React.ComponentPropsWithoutRef<
  typeof ContextMenuPrimitive.SubContent
>;
export type ContextMenuShortcutProps = React.HTMLAttributes<HTMLSpanElement>;
