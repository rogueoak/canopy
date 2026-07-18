import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '../lib/cn';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  type DialogProps,
  type DialogContentProps,
} from './Dialog';

/**
 * Command - the canopy command-palette Branch (spec 0066), built on `cmdk` (the filterable
 * listbox primitive canopy already vendors for `Combobox`) and, for its Cmd+K overlay, on the
 * `Dialog` Branch (spec 0034). It follows the 0005 component recipe: semantic-token Tailwind
 * utilities (FULL LITERAL strings so Tailwind v4's scanner emits each one), `cn()` class merge
 * (caller `className` wins), and `forwardRef` on every styled wrapper with a full native prop
 * spread and `React.ComponentRef` refs. There is NO `dark:` on the common path - light/dark flips
 * through the token layer (spec 0004), and because `.dark` lives on `<html>`, the Radix-portalled
 * `CommandDialog` (mounted under `<body>`) themes correctly too, exactly like `DialogContent`.
 *
 * It lives in the Branches tier: it owns interaction state (search text + active-descendant
 * highlight, via cmdk) and, for `CommandDialog`, a portal (through `Dialog`), and it may compose
 * lower Seeds (`Keyboard` for shortcut hints) - the tier rule is "branches import seeds, never the
 * reverse".
 *
 * The family mirrors the shadcn Command surface, canopy-styled:
 * - `Command` - `Command.Root`, the stateful filterable list container.
 * - `CommandInput` - `Command.Input` with a leading magnifier glyph and a hairline underline.
 * - `CommandList` - `Command.List`, the scrollable listbox region.
 * - `CommandEmpty` - `Command.Empty`, the no-results slot.
 * - `CommandGroup` - `Command.Group` with a muted heading.
 * - `CommandItem` - `Command.Item`, a selectable option; highlight uses the raised-surface fill.
 * - `CommandSeparator` - `Command.Separator`, a `border`-tone rule.
 * - `CommandShortcut` - a plain styled `span` for a trailing key hint (accepts `Keyboard` kids).
 * - `CommandDialog` - a `Dialog` (0034) wrapping a `Command` for the Cmd+K overlay.
 *
 * Filtering is client-side over the rendered items for v1 (async/remote is a follow-up, spec
 * 0066 Out of scope). `Combobox` (0030) consumes these same parts internally.
 */

/**
 * Command - `Command.Root`, the stateful list container. Styled as the same raised-surface card
 * the Combobox popover uses (`bg-surface-raised` + `text-text`) so inline and in-dialog read
 * identically.
 */
const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-surface-raised text-text',
      className,
    )}
    {...props}
  />
));
Command.displayName = 'Command';

/**
 * CommandInput - `Command.Input`, the type-to-filter search box, with a leading magnifier glyph
 * and a `border-b border-border` underline. It carries cmdk's `role="combobox"` and drives the
 * client-side filtering of the list.
 */
const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div {...{ 'cmdk-input-wrapper': '' }} className="flex items-center border-b border-border px-3">
    <SearchIcon />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-text outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = 'CommandInput';

/**
 * CommandList - `Command.List`, the scrollable listbox region (`role="listbox"`).
 */
const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-1', className)}
    {...props}
  />
));
CommandList.displayName = 'CommandList';

/**
 * CommandEmpty - `Command.Empty`, the no-results slot, shown only when the current filter matches
 * nothing. Muted, centred text on the raised surface.
 */
const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn('py-6 text-center text-sm text-text-muted', className)}
    {...props}
  />
));
CommandEmpty.displayName = 'CommandEmpty';

/**
 * CommandGroup - `Command.Group` with a muted heading rendered via cmdk's `[cmdk-group-heading]`
 * hook.
 */
const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden p-1 text-text [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-text-muted',
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = 'CommandGroup';

/**
 * CommandItem - `Command.Item`, a selectable option (`role="option"`). Highlight (keyboard or
 * hover, via cmdk's `data-selected` active state) uses the raised-surface `muted-raised` fill
 * (raised-surface learning), which lifts toward the foreground on the `surface-raised` card in
 * BOTH themes; `data-disabled` dims with opacity and drops pointer events.
 */
const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-text outline-none data-[selected=true]:bg-muted-raised data-[selected=true]:text-text data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = 'CommandItem';

/**
 * CommandSeparator - `Command.Separator`, a hairline `border`-tone rule between items or groups.
 */
const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 h-px bg-border', className)}
    {...props}
  />
));
CommandSeparator.displayName = 'CommandSeparator';

/**
 * CommandShortcut - a plain styled `span` for the trailing key hint on a `CommandItem`. Pushed to
 * the far right (`ml-auto`), muted and letter-spaced. Callers may pass `Keyboard` (0021) children
 * for rendered key-caps, or plain text (e.g. a raw shortcut string).
 */
export type CommandShortcutProps = React.HTMLAttributes<HTMLSpanElement>;

const CommandShortcut = React.forwardRef<HTMLSpanElement, CommandShortcutProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('ml-auto text-caption tracking-widest text-text-muted', className)}
      {...props}
    />
  ),
);
CommandShortcut.displayName = 'CommandShortcut';

/**
 * CommandDialog - the Cmd+K overlay composition: a `Command` mounted inside `Dialog` (0034). A
 * visually hidden `DialogTitle` gives the overlay an accessible name so it is announced, the
 * `DialogContent` is sized for a palette (`overflow-hidden p-0`, no default padding), and the
 * `Command` fills it. `open` / `onOpenChange` pass through to `Dialog`, so the app owns the Cmd+K
 * keydown listener that flips it (a built-in shortcut hook is deferred, spec 0066 Out of scope).
 */
export interface CommandDialogProps extends DialogProps {
  /** Accessible name for the overlay (visually hidden by default). Defaults to "Command palette". */
  title?: React.ReactNode;
  /** Extra classes merged onto the palette `DialogContent`. */
  className?: string;
  /** Props forwarded to the inner `DialogContent`. */
  contentProps?: DialogContentProps;
  /** The `Command` parts (input, list, items) to render inside the palette. */
  children?: React.ReactNode;
}

const CommandDialog = ({
  title = 'Command palette',
  className,
  contentProps,
  children,
  ...props
}: CommandDialogProps) => (
  <Dialog {...props}>
    <DialogContent
      {...contentProps}
      className={cn('overflow-hidden p-0', className, contentProps?.className)}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <Command className="[&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5">
        {children}
      </Command>
    </DialogContent>
  </Dialog>
);
CommandDialog.displayName = 'CommandDialog';

/* ------------------------------------------------------------------- glyphs */
/* Inline SVG, matching the Combobox/Select recipe (no new icon dependency). */

function SearchIcon() {
  return (
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
      className="mr-2 h-4 w-4 shrink-0 opacity-50"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandDialog,
};

export type CommandProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;
export type CommandInputProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;
export type CommandListProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>;
export type CommandEmptyProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;
export type CommandGroupProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>;
export type CommandItemProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;
export type CommandSeparatorProps = React.ComponentPropsWithoutRef<
  typeof CommandPrimitive.Separator
>;
