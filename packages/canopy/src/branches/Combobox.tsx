import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Badge } from '../seeds/Badge';
import { cn } from '../lib/cn';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from './Command';

/**
 * Combobox - the canopy filterable-select Branch (spec 0030), built on
 * `@radix-ui/react-popover` (the portalled, collision-aware popover shell) and `cmdk` (the
 * filterable listbox: search input, keyboard navigation, and the no-results slot) on the 0005
 * component recipe: semantic-token Tailwind utilities (FULL LITERAL strings so Tailwind v4's
 * scanner emits each one), `cn()` class merge, and `forwardRef` on every styled wrapper with a
 * full native prop spread. There is NO `dark:` on the common path - light/dark flips through the
 * token layer (spec 0004), and because the `.dark` class lives on `<html>`, the Radix-portalled
 * content (mounted under `<body>`) themes correctly too, exactly like `SelectContent`.
 *
 * It lives in the Branches tier (not Seeds): it owns interaction state and a portal, and it
 * composes the `Badge` Seed for its multi-select chips and the shared `Command` parts (spec 0066)
 * for the filterable list - all of which a Seed may not do (the tier rule is "branches import
 * seeds, never the reverse"), exactly like `Dialog`.
 *
 * The public surface is a single stateful root, `Combobox`, that owns open state, the search
 * text, and the selected value(s). One `multiple` prop discriminates the value shape (single
 * `string` vs `string[]`) and the field rendering. It takes an `options` list
 * (`{ label, value, disabled? }[]`) and standard field props (`value` / `onValueChange`,
 * `placeholder`, `disabled`, `aria-invalid`). Since spec 0066 the filterable listbox is the
 * shared `Command` family (`Command` / `CommandInput` / `CommandList` / `CommandEmpty` /
 * `CommandItem`), styled once and reused here; only the Popover shell, the selection state, the
 * chips, and the `ComboboxItem` check gutter remain module-internal composition details, not a
 * supported public contract.
 *
 * Single-select reads like `Select` (pick commits and closes) with a type-to-filter input at the
 * top of the list. Multi-select renders the chosen options as removable `Badge` (0008) chips in
 * the field, keeps the popover open across picks, toggles selection when an option is re-picked,
 * and drops the last chip when `Backspace` is pressed in the empty search input. Filtering is
 * client-side over the provided options for v1 (async/remote is a follow-up, spec 0030 Out).
 */

/* --------------------------------------------------------------- primitives */

const Combobox_Root = PopoverPrimitive.Root;

/**
 * ComboboxTrigger - the field button that opens the popover (`Popover.Trigger`). Class tokens
 * mirror the Input field (spec 0006) and `SelectTrigger` for visual parity: `border-border` +
 * `bg-surface` + `text-text`, the shared focus-visible ring, the `disabled:*` token pair (not
 * opacity), and the `aria-invalid:` danger overrides so an invalid Combobox reads identically to
 * an invalid Select or Input. A muted placeholder and a trailing chevron complete the field.
 */
const ComboboxTrigger = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDownIcon />
  </PopoverPrimitive.Trigger>
));
ComboboxTrigger.displayName = 'ComboboxTrigger';

/**
 * ComboboxContent - the portalled popover surface. Rendered through `Popover.Portal` (so it
 * escapes overflow/stacking contexts) onto a raised-surface card: `bg-surface-raised` +
 * `text-text` + `border border-border` + `rounded-md` + the primitive `shadow-md` (there is no
 * semantic elevation token yet - the closest default-elevation primitive, matched to
 * `SelectContent`). Width-synced to the trigger via Radix's `--radix-popover-trigger-width`.
 */
const ComboboxContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'relative z-50 max-h-96 w-[var(--radix-popover-trigger-width)] min-w-32 overflow-hidden rounded-md border border-border bg-surface-raised text-text shadow-md',
        className,
      )}
      {...props}
    >
      {/*
       * Selection is owned by the root; the shared `Command` (spec 0066) drives only filtering +
       * active-item highlight. `Command` already renders the `flex h-full w-full flex-col
       * overflow-hidden` list container on a `bg-surface-raised` card; the enclosing
       * `PopoverPrimitive.Content` above owns the raised card, border, and shadow, so `Command`
       * reads as the inner list here. `bg-transparent` lets the Popover surface show through.
       */}
      <Command className="bg-transparent">{children}</Command>
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
ComboboxContent.displayName = 'ComboboxContent';

/**
 * ComboboxItem - a selectable option, the shared `CommandItem` (spec 0066, `role="option"`) with
 * the Combobox check gutter. Highlight (keyboard or hover, via cmdk's `data-selected` active
 * state) uses the raised-surface `muted-raised` fill; `data-disabled` dims and drops pointer
 * events - all inherited from `CommandItem`. A leading check sits in the left gutter (`pl-8`) when
 * the option is part of the current selection (`selected`); `w-full pl-8 pr-2` overrides
 * `CommandItem`'s default `gap-2 px-2` for the gutter layout (caller className wins via `cn()`).
 */
interface ComboboxItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem> {
  /** Whether the option is part of the current selection - renders the leading check. */
  selected?: boolean;
}

const ComboboxItem = React.forwardRef<
  React.ComponentRef<typeof CommandItem>,
  ComboboxItemProps
>(({ className, children, selected = false, ...props }, ref) => (
  <CommandItem ref={ref} className={cn('w-full gap-0 px-0 py-1.5 pl-8 pr-2', className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {selected ? <CheckIcon /> : null}
    </span>
    {children}
  </CommandItem>
));
ComboboxItem.displayName = 'ComboboxItem';

/* --------------------------------------------------------------------- root */

/** A single selectable option in a {@link Combobox}. */
export interface ComboboxOption {
  /** The visible label; what the search filters against and what a chip shows. */
  label: string;
  /** The stable value emitted through `onValueChange`. */
  value: string;
  /** Render the option inert (non-selectable, dimmed). */
  disabled?: boolean;
}

interface ComboboxBaseProps {
  /** The options to filter and pick from (client-side filtering over this list, v1). */
  options: ComboboxOption[];
  /** Placeholder shown in the field when nothing is selected. */
  placeholder?: string;
  /** Placeholder for the type-to-filter search input. */
  searchPlaceholder?: string;
  /** Content for the no-results state (defaults to "No results found."). */
  emptyMessage?: React.ReactNode;
  /** Render the whole field inert with the shared disabled tokens. */
  disabled?: boolean;
  /** Apply the danger border/ring, exactly like an invalid Input/Select. */
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  /** Accessible name for the field trigger (pair with `Label` via `id`/`htmlFor` instead). */
  'aria-label'?: string;
  /** Id of a labelling element for the field trigger. */
  'aria-labelledby'?: string;
  /** Id forwarded to the field trigger (for `Label htmlFor` association). */
  id?: string;
  /** Extra classes merged onto the field trigger. */
  className?: string;
}

/** Single-select Combobox: `value` is a `string`. */
export interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  /** The controlled selected value. */
  value?: string;
  /** The initial value when uncontrolled. */
  defaultValue?: string;
  /** Fired with the newly selected value. */
  onValueChange?: (value: string) => void;
}

/** Multi-select Combobox: `value` is a `string[]`; picks render as removable chips. */
export interface ComboboxMultipleProps extends ComboboxBaseProps {
  multiple: true;
  /** The controlled selected values. */
  value?: string[];
  /** The initial values when uncontrolled. */
  defaultValue?: string[];
  /** Fired with the full new selection whenever a chip is added or removed. */
  onValueChange?: (value: string[]) => void;
}

/**
 * The public `Combobox` props. `multiple` discriminates the value shape: omit it (or pass
 * `false`) for a single `string`; pass `true` for a `string[]` with removable `Badge` chips.
 */
export type ComboboxProps = ComboboxSingleProps | ComboboxMultipleProps;

/**
 * Combobox - the stateful root. Composes `Popover` + `cmdk` and owns open state, the search
 * text, and the selection. Controlled (`value` + `onValueChange`) or uncontrolled
 * (`defaultValue`). See the module header for the full behaviour contract.
 */
const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>((props, ref) => {
  const {
    options,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyMessage = 'No results found.',
    disabled = false,
    multiple = false,
    className,
    id,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  // Controllable selection, normalized internally to a string[] regardless of mode. Latch
  // controlledness once on mount so a controlled single-select parent holding `undefined` is
  // not misread as uncontrolled on later renders (React's controlled/uncontrolled contract).
  const isControlledRef = React.useRef(props.value !== undefined);
  const isControlled = isControlledRef.current;
  const [internal, setInternal] = React.useState<string[]>(() => {
    if (multiple) return (props.defaultValue as string[] | undefined) ?? [];
    const dv = props.defaultValue as string | undefined;
    return dv != null ? [dv] : [];
  });

  const selected = React.useMemo<string[]>(() => {
    if (!isControlled) return internal;
    if (multiple) return (props.value as string[] | undefined) ?? [];
    const v = props.value as string | undefined;
    return v != null ? [v] : [];
  }, [isControlled, internal, multiple, props.value]);

  const emit = React.useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal(next);
      if (multiple) {
        (props.onValueChange as ((value: string[]) => void) | undefined)?.(next);
      } else {
        (props.onValueChange as ((value: string) => void) | undefined)?.(next[0] ?? '');
      }
    },
    [isControlled, multiple, props.onValueChange],
  );

  const optionByValue = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>();
    for (const option of options) map.set(option.value, option);
    return map;
  }, [options]);

  const toggle = React.useCallback(
    (value: string) => {
      if (multiple) {
        const next = selected.includes(value)
          ? selected.filter((v) => v !== value)
          : [...selected, value];
        emit(next);
        setSearch('');
        // Popover stays open across picks in multiple mode.
      } else {
        emit([value]);
        setSearch('');
        setOpen(false);
      }
    },
    [emit, multiple, selected],
  );

  const removeChip = React.useCallback(
    (value: string) => {
      emit(selected.filter((v) => v !== value));
    },
    [emit, selected],
  );

  const handleInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      // Backspace on an empty search input drops the last chip (the tag-input idiom).
      if (multiple && event.key === 'Backspace' && search === '' && selected.length > 0) {
        const last = selected[selected.length - 1];
        if (last !== undefined) {
          event.preventDefault();
          removeChip(last);
        }
      }
    },
    [multiple, removeChip, search, selected],
  );

  const handleOpenChange = React.useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setSearch('');
  }, []);

  const singleLabel =
    !multiple && selected[0] !== undefined ? optionByValue.get(selected[0])?.label : undefined;

  const list = (
    <ComboboxContent>
      <CommandInput
        placeholder={searchPlaceholder}
        value={search}
        onValueChange={setSearch}
        onKeyDown={handleInputKeyDown}
      />
      <CommandList aria-multiselectable={multiple || undefined}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {options.map((option) => (
          <ComboboxItem
            key={option.value}
            value={option.value}
            keywords={[option.label]}
            disabled={option.disabled}
            selected={selected.includes(option.value)}
            onSelect={() => toggle(option.value)}
          >
            {option.label}
          </ComboboxItem>
        ))}
      </CommandList>
    </ComboboxContent>
  );

  if (!multiple) {
    return (
      <Combobox_Root open={open} onOpenChange={handleOpenChange}>
        <ComboboxTrigger
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={className}
        >
          <span
            className={cn('line-clamp-1 text-left', singleLabel ? undefined : 'text-text-muted')}
          >
            {singleLabel ?? placeholder}
          </span>
        </ComboboxTrigger>
        {list}
      </Combobox_Root>
    );
  }

  // Multiple mode: a field container (Popover.Anchor) holding the removable chips and a trigger
  // button for the empty area, so each chip's remove control is a real, sibling button rather
  // than an (invalid) nested button.
  return (
    <Combobox_Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Anchor asChild>
        <div
          aria-invalid={ariaInvalid}
          data-disabled={disabled || undefined}
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text has-[>button:focus-visible]:ring-2 has-[>button:focus-visible]:ring-ring has-[>button:focus-visible]:ring-offset-2 has-[>button:focus-visible]:ring-offset-ring-offset aria-invalid:border-danger aria-invalid:ring-danger data-[disabled]:cursor-not-allowed data-[disabled]:bg-disabled data-[disabled]:text-disabled-foreground',
            className,
          )}
        >
          {selected.map((value) => {
            const label = optionByValue.get(value)?.label ?? value;
            return (
              <Badge key={value} variant="neutral" className="gap-1 pr-1">
                {label}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  disabled={disabled}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeChip(value);
                  }}
                  className="-mr-0.5 ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-ring-offset disabled:pointer-events-none"
                >
                  <XIcon />
                </button>
              </Badge>
            );
          })}
          <PopoverPrimitive.Trigger asChild>
            <button
              ref={ref}
              id={id}
              type="button"
              disabled={disabled}
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledby}
              className="flex h-7 flex-1 items-center justify-between gap-1 bg-transparent px-1 text-left outline-none disabled:cursor-not-allowed"
            >
              {selected.length === 0 ? (
                <span className="text-text-muted">{placeholder}</span>
              ) : (
                <span className="sr-only">Add more</span>
              )}
              <ChevronDownIcon />
            </button>
          </PopoverPrimitive.Trigger>
        </div>
      </PopoverPrimitive.Anchor>
      {list}
    </Combobox_Root>
  );
});
Combobox.displayName = 'Combobox';

/* ------------------------------------------------------------------- glyphs */
/* Inline SVGs, matching the Select recipe (no new icon dependency). */

function ChevronDownIcon() {
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
      className="ml-2 h-4 w-4 shrink-0 opacity-50"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
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
      className="h-4 w-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
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
      className="h-3 w-3"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Only the stateful root and its option/prop types are public. The part wrappers above stay
// module-internal: the root owns the whole composition via `options`, so they are not a
// supported public contract (architect review, PR #42). `ComboboxOption`, `ComboboxProps`,
// `ComboboxSingleProps`, and `ComboboxMultipleProps` are exported inline at their declarations.
export { Combobox };
