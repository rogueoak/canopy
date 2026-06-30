import * as React from 'react';
import { IconContext, type IconBaseProps, type IconType } from 'react-icons';

/**
 * `IconProvider` - set defaults (size, color, className) for every Canopy/react-icons glyph in a
 * subtree. A thin alias of react-icons' `IconContext.Provider`; every curated icon reads this
 * context, so wrapping an app once styles all icons under it.
 *
 * ```tsx
 * <IconProvider value={{ size: '1.25rem', className: 'text-muted-foreground' }}>
 *   <Home />
 *   <Search />
 * </IconProvider>
 * ```
 */
export const IconProvider = IconContext.Provider;
export type IconProviderProps = React.ComponentProps<typeof IconProvider>;

/** The default icon size - `1em`, so an icon scales with the surrounding font-size by default. */
const DEFAULT_SIZE = '1em';

export interface IconProps extends IconBaseProps {
  /** The icon component to render - any `@rogueoak/icons` export (or a raw `react-icons` glyph). */
  icon: IconType;
}

/**
 * `Icon` - the size + accessibility wrapper for a single glyph, for one-off use without an
 * `IconProvider`. It renders the given `icon` at the system default size (`1em`, overridable via
 * `size` or a `className` like `size-4`), in `currentColor` (react-icons' default - so the icon
 * inherits its text colour and themes for free), and handles accessibility:
 *
 * - **Decorative by default** - with no `title`, the icon is `aria-hidden` (react-icons does not
 *   hide it on its own), so screen readers skip purely visual glyphs.
 * - **Labelled when meaningful** - pass a `title` and the icon becomes `role="img"` with the title
 *   as its accessible name (react-icons emits the `<title>`; the role is what makes it perceivable).
 *
 * An incoming `className` is merged onto react-icons' own (last-wins), so callers can always size or
 * recolour: `<Icon icon={Home} className="size-5 text-primary" />`.
 */
export function Icon({ icon: Glyph, title, size = DEFAULT_SIZE, ...props }: IconProps) {
  const decorative = title === undefined;
  return (
    <Glyph
      title={title}
      size={size}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      {...props}
    />
  );
}

export type { IconBaseProps, IconType };
