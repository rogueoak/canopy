import * as React from 'react';
import { cn } from '../lib/cn';
import { Button, Input, Keyboard } from '../seeds';

/**
 * SearchIcon - the leading magnifier. No icon library: a hand-rolled inline SVG that inherits the
 * surrounding `text-text-muted` through `currentColor`, so it re-themes for free (spec 0021).
 */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/**
 * ClearIcon - the inline cross for the clear affordance, mirroring SearchIcon's `currentColor` so
 * it inherits the ghost Button's text colour and theming.
 */
function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export interface SearchBarProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'size'
> {
  /** Controlled value. Pair with `onValueChange`; omit for an uncontrolled SearchBar. */
  value?: string;
  /** Initial value when uncontrolled. Ignored once `value` is supplied. */
  defaultValue?: string;
  /** Fired whenever the value changes - on typing and when the clear button empties it. */
  onValueChange?: (value: string) => void;
  /** Fired on Enter / form submit with the current value (the input sits in a `<form role="search">`). */
  onSearch?: (value: string) => void;
  /**
   * Optional shortcut hint rendered as a display-only `Keyboard` at the trailing edge (e.g. `⌘K`).
   * Purely visual - SearchBar binds no key. Hidden while there is a value (the clear button takes
   * that slot).
   */
  shortcutHint?: React.ReactNode;
}

/**
 * SearchBar - the canopy search-input Twig (spec 0021), following the 0020 composition recipe: it
 * COMPOSES the Input, Button and Keyboard Seeds into one accessible search control styled with
 * semantic tokens only (no `dark:`, no new token). The input is `type="search"` with an accessible
 * name (`aria-label`, default "Search") inside a `<form role="search">` so Enter submits.
 *
 * Controlled / uncontrolled: it mirrors the native input contract. Pass `value` + `onValueChange`
 * to control it, or `defaultValue` (or nothing) to let it own the value internally; `onValueChange`
 * fires on every change, including the clear. The leading magnifier, the clear Button (a ghost icon
 * Button that appears only with a value and not when disabled, clears the value and refocuses the
 * input), and the optional `shortcutHint` are absolutely positioned, with the Input's horizontal
 * padding widened to clear them. `ref` forwards to the underlying `<input>`; native input props
 * spread onto it (the managed `value` / `defaultValue` / `onChange` / `type` are omitted).
 */
export const SearchBar = React.forwardRef<React.ComponentRef<typeof Input>, SearchBarProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onSearch,
      shortcutHint,
      disabled = false,
      className,
      'aria-label': ariaLabel = 'Search',
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? '');
    const currentValue = isControlled ? value : internalValue;

    // Own ref to the input so the clear button can refocus it; forward the same node to the caller.
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

    const setValue = (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearch?.(currentValue);
    };

    const handleClear = () => {
      setValue('');
      inputRef.current?.focus();
    };

    const hasValue = currentValue.length > 0;
    const showClear = hasValue && !disabled;
    const showHint = shortcutHint != null && !hasValue;

    return (
      <form role="search" className="relative w-full" onSubmit={handleSubmit}>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          ref={inputRef}
          type="search"
          aria-label={ariaLabel}
          value={currentValue}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          // Suppress the browser's native search-cancel (x) so it does not double up with the
          // custom clear Button (WebKit/Chrome render their own on type="search").
          className={cn('pl-9 pr-12 [&::-webkit-search-cancel-button]:appearance-none', className)}
          {...props}
        />
        {showClear && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
          >
            <ClearIcon className="h-4 w-4" />
          </Button>
        )}
        {showHint && (
          <Keyboard className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
            {shortcutHint}
          </Keyboard>
        )}
      </form>
    );
  },
);
SearchBar.displayName = 'SearchBar';
