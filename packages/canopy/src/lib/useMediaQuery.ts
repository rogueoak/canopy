import * as React from 'react';

/**
 * useMediaQuery - subscribe to a CSS media query and return whether it currently matches.
 *
 * A tiny `matchMedia` wrapper: SSR/first render returns `false` (no `window`), then an effect reads
 * `.matches` and tracks the `change` event so the boolean stays live as the viewport crosses the
 * query. Returning one boolean (rather than rendering both forms behind `md:` visibility utilities)
 * is what lets a caller mount a SINGLE form per breakpoint - keeping accessibility landmarks single
 * (the SideNav `<nav>`, the ResponsiveDialog `role="dialog"`) instead of duplicating them.
 *
 * `query` is read once on mount (it is not expected to change across renders, matching how the
 * design system fixes a component's breakpoint); pass a stable string literal.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/** The design system's mobile breakpoint: everything below Tailwind's `md` (768px). */
export const MOBILE_QUERY = '(max-width: 767px)';

/**
 * useIsMobile - `useMediaQuery(MOBILE_QUERY)`: `true` below 768px. The single breakpoint the design
 * system flips its responsive organisms at (SideNav's rail↔drawer, ResponsiveDialog's dialog↔sheet).
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
