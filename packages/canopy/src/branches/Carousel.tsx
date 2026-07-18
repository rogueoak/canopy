import * as React from 'react';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import { cn } from '../lib/cn';
import { Button } from '../seeds/Button';

/**
 * Carousel - the swipeable/keyboard-navigable content strip Branch (spec 0061), built on
 * `embla-carousel-react` and styled with the 0005 recipe (the shadcn-on-embla carousel,
 * canopy-tokened). Embla owns the hard parts - pointer/drag, snap points, wrap-around (`loop`),
 * and the `canScrollPrev` / `canScrollNext` / `scrollPrev` / `scrollNext` api - while every piece
 * of DOM and styling is ours: FULL LITERAL semantic-token/layout utilities on each part (so
 * Tailwind v4's scanner emits them), `cn()` merge with the caller's `className` winning,
 * `forwardRef` + native prop spread on each part, and NO `dark:` on the common path - the controls
 * inherit `Button`'s token-driven light/dark.
 *
 * The family:
 * - `Carousel` - the stateful root. Calls `useEmblaCarousel(opts, plugins)`, tracks
 *   `canScrollPrev` / `canScrollNext` from embla's `select` / `reInit` events, and provides them
 *   plus `scrollPrev` / `scrollNext` / `orientation` / the embla `api` through `CarouselContext`.
 *   Renders the labelled region (`role="region"`, `aria-roledescription="carousel"`), spreads
 *   native props, forwards `ref`, and attaches the orientation-aware `onKeyDown` arrow handler. An
 *   optional `setApi` callback hands the embla instance to the caller for autoplay/dots without the
 *   component owning them.
 * - `CarouselContent` - the embla viewport (`overflow-hidden`) wrapping the flex track, wired to
 *   embla's viewport `ref`; horizontal uses a `-ml-4` gutter (items `pl-4`), vertical `-mt-4`
 *   / `flex-col` (items `pt-4`).
 * - `CarouselItem` - one slide: `role="group"`, `aria-roledescription="slide"`, full-basis by
 *   default (callers override `basis-*` via `className` for multi-item layouts).
 * - `CarouselPrevious` / `CarouselNext` - canopy `Button`s (default `variant="outline"
 *   size="icon"` with a chevron + `sr-only` label), positioned per orientation, `disabled` bound
 *   to `!canScrollPrev` / `!canScrollNext`, calling `scrollPrev` / `scrollNext` on click.
 */

/* -------------------------------------------------------------------------- api types */

/**
 * CarouselApi - the embla instance handed to callers via `setApi` (or read from `useCarousel`),
 * so they can drive autoplay, dots, or programmatic scroll without the component owning those
 * features (the spec's escape hatch). Re-exported from `@rogueoak/canopy/branches`.
 */
export type CarouselApi = UseEmblaCarouselType[1];
type CarouselViewportRef = UseEmblaCarouselType[0];

/**
 * Pass-through of embla's option / plugin types so callers configure align, loop, etc. Derived
 * from `useEmblaCarousel`'s own parameters (rather than importing the transitive `embla-carousel`
 * core) so the only direct dependency stays `embla-carousel-react`.
 */
export type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;
export type CarouselPlugin = NonNullable<Parameters<typeof useEmblaCarousel>[1]>;

export type CarouselOrientation = 'horizontal' | 'vertical';

/* ---------------------------------------------------------------------------- context */

interface CarouselContextValue {
  viewportRef: CarouselViewportRef;
  api: CarouselApi;
  orientation: CarouselOrientation;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

/**
 * useCarousel - reads the nearest `Carousel` context (the embla api + scroll state). Throws when
 * used outside a `Carousel`, so a misplaced part fails loudly instead of silently doing nothing.
 */
export function useCarousel(): CarouselContextValue {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }
  return context;
}

/* ------------------------------------------------------------------------------- root */

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Track axis, item gutter axis, control placement, and arrow-key mapping. Default `horizontal`. */
  orientation?: CarouselOrientation;
  /** Embla options (align, loop, etc.) passed straight to `useEmblaCarousel`. */
  opts?: CarouselOptions;
  /** Embla plugins passed straight to `useEmblaCarousel`. */
  plugins?: CarouselPlugin;
  /**
   * Escape hatch - receives the embla instance once it exists (and again on re-init), so a caller
   * can drive autoplay, dots, or programmatic scroll without the component owning those features.
   */
  setApi?: (api: CarouselApi) => void;
}

/**
 * Carousel - the context root that owns the embla instance and the scroll state. Renders the
 * labelled `region` wrapper, forwards `ref` to it, spreads native props, and attaches the
 * orientation-aware arrow-key handler. `orientation` is folded into embla's `axis` so drag and
 * paging share one source of truth.
 */
export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    { orientation = 'horizontal', opts, plugins, setApi, className, children, onKeyDown, ...props },
    ref,
  ) => {
    const [viewportRef, api] = useEmblaCarousel(
      { ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' },
      plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((embla: NonNullable<CarouselApi>) => {
      setCanScrollPrev(embla.canScrollPrev());
      setCanScrollNext(embla.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
      api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
        const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
        if (event.key === prevKey) {
          event.preventDefault();
          scrollPrev();
        } else if (event.key === nextKey) {
          event.preventDefault();
          scrollNext();
        }
      },
      [orientation, scrollPrev, scrollNext, onKeyDown],
    );

    // Hand the embla instance to the caller (and on every re-init) - the autoplay/dots escape hatch.
    React.useEffect(() => {
      if (api) {
        setApi?.(api);
      }
    }, [api, setApi]);

    // Track the disabled-at-ends state from embla's own select / reInit events.
    React.useEffect(() => {
      if (!api) {
        return;
      }
      onSelect(api);
      api.on('reInit', onSelect);
      api.on('select', onSelect);
      return () => {
        api.off('reInit', onSelect);
        api.off('select', onSelect);
      };
    }, [api, onSelect]);

    const contextValue = React.useMemo<CarouselContextValue>(
      () => ({
        viewportRef,
        api,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }),
      [viewportRef, api, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          className={cn('relative', className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = 'Carousel';

/* ---------------------------------------------------------------------------- content */

export type CarouselContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * CarouselContent - the embla viewport (`overflow-hidden`, focusable so arrow keys work) wrapping
 * the flex track. Horizontal lays the track in a row with a `-ml-4` negative gutter (items add
 * `pl-4`); vertical stacks it (`flex-col`) with a `-mt-4` gutter. `ref` forwards to the track; the
 * viewport carries embla's own ref.
 */
export const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ className, ...props }, ref) => {
    const { viewportRef, orientation } = useCarousel();
    return (
      <div ref={viewportRef} className="overflow-hidden" tabIndex={0}>
        <div
          ref={ref}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = 'CarouselContent';

/* ------------------------------------------------------------------------------- item */

export type CarouselItemProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * CarouselItem - one slide. `role="group"` + `aria-roledescription="slide"` for per-item
 * semantics, `min-w-0 shrink-0 grow-0 basis-full` so it fills the viewport by default (callers
 * override `basis-*` via `className` for multi-item layouts). Adds the orientation-matched gutter
 * padding (`pl-4` horizontal, `pt-4` vertical) that pairs with `CarouselContent`'s negative margin.
 */
export const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();
    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'pl-4' : 'pt-4',
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = 'CarouselItem';

/* --------------------------------------------------------------------------- controls */

export type CarouselControlProps = React.ComponentPropsWithoutRef<typeof Button>;

/**
 * CarouselPrevious - the paging control to the previous slide. A canopy `Button` (default
 * `variant="outline" size="icon"`) with a chevron glyph and an `sr-only` "Previous slide" label,
 * positioned per orientation, `disabled` bound to `!canScrollPrev` (inert at the start unless embla
 * `loop` is on), calling `scrollPrev` on click.
 */
export const CarouselPrevious = React.forwardRef<
  React.ComponentRef<typeof Button>,
  CarouselControlProps
>(({ className, variant = 'outline', size = 'icon', onClick, children, ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        'absolute rounded-full',
        orientation === 'horizontal'
          ? '-left-12 top-1/2 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2',
        className,
      )}
      disabled={!canScrollPrev}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          scrollPrev();
        }
      }}
      {...props}
    >
      {children ?? <PreviousIcon orientation={orientation} />}
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = 'CarouselPrevious';

/**
 * CarouselNext - the paging control to the next slide. Mirror of `CarouselPrevious`: canopy
 * `Button` with a chevron + `sr-only` "Next slide" label, positioned per orientation, `disabled`
 * bound to `!canScrollNext`, calling `scrollNext` on click.
 */
export const CarouselNext = React.forwardRef<
  React.ComponentRef<typeof Button>,
  CarouselControlProps
>(({ className, variant = 'outline', size = 'icon', onClick, children, ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        'absolute rounded-full',
        orientation === 'horizontal'
          ? '-right-12 top-1/2 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2',
        className,
      )}
      disabled={!canScrollNext}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          scrollNext();
        }
      }}
      {...props}
    >
      {children ?? <NextIcon orientation={orientation} />}
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = 'CarouselNext';

/* ------------------------------------------------------------------------------ glyphs */
/* Inline SVGs, matching the Combobox/Select recipe (no icon dependency). */

function PreviousIcon({ orientation }: { orientation: CarouselOrientation }) {
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
      {orientation === 'horizontal' ? <path d="m15 18-6-6 6-6" /> : <path d="m18 15-6-6-6 6" />}
    </svg>
  );
}

function NextIcon({ orientation }: { orientation: CarouselOrientation }) {
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
      {orientation === 'horizontal' ? <path d="m9 18 6-6-6-6" /> : <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}
