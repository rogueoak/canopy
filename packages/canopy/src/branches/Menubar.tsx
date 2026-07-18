import * as React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { cn } from '../lib/cn';

/**
 * Menubar - the canopy application menu-bar Branch (spec 0056), built on
 * `@radix-ui/react-menubar` and the 0005 component recipe: FULL LITERAL semantic-token Tailwind
 * utilities (so Tailwind v4's scanner emits each class), `cn()` class merge (caller `className`
 * wins), and `forwardRef` on every styled wrapper with a native prop spread. There is NO `dark:`
 * on the common path - light/dark flips through the token layer (spec 0004), and because the
 * `.dark` class lives on `<html>`, the Radix-portalled `MenubarContent` / `MenubarSubContent`
 * (mounted under `<body>`) theme correctly too.
 *
 * Where the navigation Branches (`TopNav`, `SideNav`) route between pages, Menubar is the
 * horizontal command strip a desktop-style app (editor, dashboard builder, admin console) puts
 * along the top of its frame: File / Edit / View menus with grouped items, checkbox / radio
 * toggles, shortcut hints, and nested sub-menus. Radix supplies roving focus across the triggers,
 * the open-sibling-on-hover behaviour, the portalled content / sub-content, and the full ARIA
 * contract (`menubar` / `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles, roving
 * `tabindex`, `aria-haspopup` / `aria-expanded` on triggers, type-ahead, and the Left/Right across
 * triggers + Up/Down within a menu + Right/Enter into a sub-menu + Left/Escape out keyboard model)
 * - so each canopy part is composition + token styling, not hand-rolled focus management.
 *
 * The portalled content reuses the established raised-surface pattern (the same as `Dialog`,
 * `Select`, and `Combobox`): the card sits on `bg-surface-raised` + `border` + the primitive
 * `shadow-md`, and item highlight uses the RAISED `bg-muted-raised` fill (not base `bg-muted`,
 * which would recede on the raised surface in dark). Enter/exit uses the existing `animate-pop-*`
 * keyframes gated with `motion-reduce:animate-none`; no new keyframes are introduced.
 *
 * The family mirrors the shadcn Menubar surface area:
 * - `Menubar` - the root horizontal bar (`MenubarPrimitive.Root`).
 * - `MenubarMenu` / `MenubarRadioGroup` - non-visual grouping primitives, re-exported as-is.
 * - `MenubarTrigger` - a top-level clickable menu label with the roving-focus highlight.
 * - `MenubarContent` / `MenubarSubContent` - the portalled menu / sub-menu surfaces.
 * - `MenubarItem` - a command row (`inset` reserves the leading indicator gutter).
 * - `MenubarCheckboxItem` / `MenubarRadioItem` - toggle rows with a leading check / dot indicator.
 * - `MenubarSub` / `MenubarSubTrigger` - a nested sub-menu and its trailing-chevron trigger.
 * - `MenubarSeparator` - a hairline divider; `MenubarLabel` - a muted group heading.
 * - `MenubarShortcut` - a plain right-aligned muted key hint (`<span>`, not a Radix part).
 *
 * Context menu (right-click) and a standalone dropdown menu are related but distinct primitives
 * (separate follow-up specs); Menubar covers the horizontal-bar case only.
 */
const Menubar = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      'flex h-10 items-center gap-1 rounded-md border border-border bg-surface p-1',
      className,
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

// These non-visual grouping primitives are re-exported as-is (no canopy styling). They carry
// explicit `React.FC<...>` annotations so the emitted `.d.ts` does not inline a reference to a
// deep pnpm-scoped `@radix-ui/react-context` path (TS2742, non-portable inferred type).
const MenubarMenu: React.FC<React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Menu>> =
  MenubarPrimitive.Menu;

const MenubarGroup: React.FC<React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group>> =
  MenubarPrimitive.Group;

const MenubarPortal: React.FC<React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Portal>> =
  MenubarPrimitive.Portal;

const MenubarRadioGroup: React.FC<
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup>
> = MenubarPrimitive.RadioGroup;

const MenubarSub: React.FC<React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Sub>> =
  MenubarPrimitive.Sub;

/**
 * MenubarTrigger - a top-level menu label. `text-label` on `text-text`, `rounded-sm` padding, and
 * the roving-focus highlight: `data-[state=open]:bg-muted` marks the open menu and
 * `focus:bg-muted` marks keyboard focus, both distinct from the surface. Disabled triggers drop to
 * the disabled-foreground token and go inert (Radix skips them in the roving order).
 */
const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex select-none items-center rounded-sm px-3 py-1.5 text-label text-text outline-none focus:bg-muted data-[state=open]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:text-disabled-foreground',
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

/**
 * MenubarSubTrigger - the row that opens a nested sub-menu. Shares the item chrome (raised
 * `bg-muted-raised` highlight) and adds a trailing chevron. Opens on hover / Right-arrow; when its
 * sub-menu is open it keeps the highlight (`data-[state=open]:bg-muted-raised`). `inset` reserves
 * the leading indicator gutter so sub-triggers align with checkbox / radio rows.
 */
const MenubarSubTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-body-sm text-text outline-none focus:bg-muted-raised data-[state=open]:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
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
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

/**
 * MenubarSubContent - the portalled nested sub-menu surface. Same raised-overlay chrome as
 * `MenubarContent` (`bg-surface-raised` + `border` + `shadow-md`), rendered through
 * `MenubarPrimitive.Portal`. Enter/exit via `animate-pop-*`, gated with `motion-reduce`.
 */
const MenubarSubContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.SubContent
      ref={ref}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

/**
 * MenubarContent - the portalled menu surface. Rendered through `MenubarPrimitive.Portal` (so it
 * escapes overflow / stacking contexts) onto the raised-surface card: `bg-surface-raised` +
 * `text-text` + `border border-border` + `rounded-md` + the primitive `shadow-md`, `min-w-[12rem]`.
 * `align="start"` and small offsets anchor it under its trigger. Enter/exit uses the existing
 * `animate-pop-*` keyframes gated with `motion-reduce:animate-none`.
 */
const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', alignOffset = -4, sideOffset = 8, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

/**
 * MenubarItem - a command row. Highlight (keyboard focus / hover, both surfaced by Radix as the
 * `focus` state) uses the RAISED `bg-muted-raised` fill per the raised-surface rule - base
 * `bg-muted` would recede on the raised popup in dark. `data-[disabled]` dims with opacity and
 * drops pointer events (Radix also skips it in the keyboard order and suppresses its `onSelect`).
 * `inset` reserves the leading indicator gutter so plain items align with checkbox / radio rows.
 */
const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-body-sm text-text outline-none focus:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

/**
 * MenubarCheckboxItem - a toggle row. Reserves a leading indicator gutter (`pl-8`); when checked,
 * Radix renders the `ItemIndicator` and this draws a check into that gutter. Manages `checked`
 * through Radix (controlled via `checked` / `onCheckedChange`, or uncontrolled). Same raised
 * highlight and disabled dimming as `MenubarItem`.
 */
const MenubarCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-body-sm text-text outline-none focus:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
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
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

/**
 * MenubarRadioItem - a single-choice row within a `MenubarRadioGroup`. Reserves a leading gutter;
 * the selected item renders a filled dot indicator. Selection is managed by the enclosing group's
 * `value` / `onValueChange` (Radix). Same raised highlight and disabled dimming as `MenubarItem`.
 */
const MenubarRadioItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-body-sm text-text outline-none focus:bg-muted-raised data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-2 w-2">
          <circle cx="12" cy="12" r="12" />
        </svg>
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

/**
 * MenubarLabel - a non-interactive group heading. Muted caption token; `inset` aligns it above the
 * items' text (past the indicator gutter).
 */
const MenubarLabel = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-caption text-text-muted', inset && 'pl-8', className)}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

/**
 * MenubarSeparator - a hairline divider between item groups, tinted with the `border` token.
 */
const MenubarSeparator = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

/**
 * MenubarShortcut - a right-aligned muted key hint (e.g. a keyboard shortcut). A plain `<span>`
 * (not a Radix part): `ml-auto` pushes it to the trailing edge, `text-caption` on the subtle text
 * token with wide tracking reads it as a secondary hint.
 */
const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-caption text-text-subtle tracking-widest', className)}
    {...props}
  />
);
MenubarShortcut.displayName = 'MenubarShortcut';

export {
  Menubar,
  MenubarMenu,
  MenubarGroup,
  MenubarPortal,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarSeparator,
  MenubarLabel,
  MenubarShortcut,
};

export type MenubarProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>;
export type MenubarMenuProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Menu>;
export type MenubarGroupProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Group>;
export type MenubarTriggerProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>;
export type MenubarContentProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>;
export type MenubarItemProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
  inset?: boolean;
};
export type MenubarCheckboxItemProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.CheckboxItem
>;
export type MenubarRadioGroupProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.RadioGroup
>;
export type MenubarRadioItemProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.RadioItem
>;
export type MenubarSubProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Sub>;
export type MenubarSubTriggerProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.SubTrigger
> & {
  inset?: boolean;
};
export type MenubarSubContentProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.SubContent
>;
export type MenubarSeparatorProps = React.ComponentPropsWithoutRef<
  typeof MenubarPrimitive.Separator
>;
export type MenubarLabelProps = React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
  inset?: boolean;
};
export type MenubarShortcutProps = React.HTMLAttributes<HTMLSpanElement>;
