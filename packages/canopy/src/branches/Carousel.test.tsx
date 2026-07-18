import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './Carousel';

// embla probes `matchMedia` (for reduced-motion / breakpoint options) on init; jsdom omits it.
// Stub a static no-match implementation so the engine mounts. embla does not perform real layout
// in jsdom (all element boxes are 0), so we assert the observable wiring - roles, labelled
// controls, the axis/gutter class mapping, the arrow-key -> scroll path (spied through the embla
// api handed to `setApi`), className merge, and ref forwarding - not embla's internal snap math.
beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  // embla's SlidesInView tracker constructs an IntersectionObserver on init; jsdom omits it.
  // A no-op shim lets the engine mount (nothing here relies on observed intersection).
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = class IntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  }
});

function Basic({ orientation }: { orientation?: 'horizontal' | 'vertical' } = {}) {
  return (
    <Carousel orientation={orientation} aria-label="Photos">
      <CarouselContent>
        <CarouselItem>Slide 1</CarouselItem>
        <CarouselItem>Slide 2</CarouselItem>
        <CarouselItem>Slide 3</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe('Carousel', () => {
  it('renders the region / group / slide ARIA roles', () => {
    render(<Basic />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(region).toHaveAccessibleName('Photos');
    const slides = screen.getAllByRole('group');
    expect(slides).toHaveLength(3);
    slides.forEach((slide) => {
      expect(slide).toHaveAttribute('aria-roledescription', 'slide');
    });
  });

  it('gives the focusable viewport the shared focus-visible ring', () => {
    render(
      <Carousel>
        <CarouselContent data-testid="track">
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    // The viewport is the focusable (tabIndex) parent of the track.
    const viewport = screen.getByTestId('track').parentElement;
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(viewport).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('exposes prev/next as labelled <button>s', () => {
    render(<Basic />);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(prev.tagName).toBe('BUTTON');
    expect(next.tagName).toBe('BUTTON');
  });

  it('hands the embla instance to setApi', () => {
    const setApi = vi.fn();
    render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(setApi).toHaveBeenCalled();
    const api = setApi.mock.calls.at(-1)?.[0] as CarouselApi;
    expect(api).toBeDefined();
    expect(typeof api?.scrollNext).toBe('function');
    expect(typeof api?.scrollPrev).toBe('function');
  });

  // With embla `loop` on, both ends can always scroll (so the control is enabled in jsdom, where
  // there is no layout to derive the ends from) - this exercises the click -> scroll wiring.
  it('clicking next calls embla scrollNext', async () => {
    const user = userEvent.setup();
    let api: CarouselApi;
    render(
      <Carousel opts={{ loop: true }} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
          <CarouselItem>Slide 3</CarouselItem>
        </CarouselContent>
        <CarouselNext />
      </Carousel>,
    );
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(next).toBeEnabled();
    const spy = vi.spyOn(api!, 'scrollNext');
    await user.click(next);
    expect(spy).toHaveBeenCalled();
  });

  it('clicking previous calls embla scrollPrev', async () => {
    const user = userEvent.setup();
    let api: CarouselApi;
    render(
      <Carousel opts={{ loop: true }} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
          <CarouselItem>Slide 3</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
      </Carousel>,
    );
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    expect(prev).toBeEnabled();
    const spy = vi.spyOn(api!, 'scrollPrev');
    await user.click(prev);
    expect(spy).toHaveBeenCalled();
  });

  it('runs a caller onKeyDown before paging', () => {
    let api: CarouselApi;
    const onKeyDown = vi.fn();
    render(
      <Carousel onKeyDown={onKeyDown} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    const nextSpy = vi.spyOn(api!, 'scrollNext');
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('lets a caller onKeyDown preventDefault suppress paging', () => {
    let api: CarouselApi;
    render(
      <Carousel onKeyDown={(event) => event.preventDefault()} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    const nextSpy = vi.spyOn(api!, 'scrollNext');
    const prevSpy = vi.spyOn(api!, 'scrollPrev');
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' });
    expect(nextSpy).not.toHaveBeenCalled();
    expect(prevSpy).not.toHaveBeenCalled();
  });

  it('runs a caller control onClick before scrolling', async () => {
    const user = userEvent.setup();
    let api: CarouselApi;
    const onClick = vi.fn();
    render(
      <Carousel opts={{ loop: true }} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselNext onClick={onClick} />
      </Carousel>,
    );
    const spy = vi.spyOn(api!, 'scrollNext');
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('lets a caller control onClick preventDefault suppress scrolling', async () => {
    const user = userEvent.setup();
    let api: CarouselApi;
    render(
      <Carousel opts={{ loop: true }} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselNext onClick={(event) => event.preventDefault()} />
      </Carousel>,
    );
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(next).toBeEnabled();
    const spy = vi.spyOn(api!, 'scrollNext');
    await user.click(next);
    expect(spy).not.toHaveBeenCalled();
  });

  it('maps arrow keys to scrollPrev/scrollNext in horizontal orientation', () => {
    let api: CarouselApi;
    render(
      <Carousel setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    const nextSpy = vi.spyOn(api!, 'scrollNext');
    const prevSpy = vi.spyOn(api!, 'scrollPrev');
    const region = screen.getByRole('region');
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(nextSpy).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(prevSpy).toHaveBeenCalledTimes(1);
    // Vertical arrows are inert on the horizontal axis.
    fireEvent.keyDown(region, { key: 'ArrowDown' });
    fireEvent.keyDown(region, { key: 'ArrowUp' });
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('maps arrow keys to the vertical axis when orientation="vertical"', () => {
    let api: CarouselApi;
    render(
      <Carousel orientation="vertical" setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    const nextSpy = vi.spyOn(api!, 'scrollNext');
    const prevSpy = vi.spyOn(api!, 'scrollPrev');
    const region = screen.getByRole('region');
    fireEvent.keyDown(region, { key: 'ArrowDown' });
    expect(nextSpy).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region, { key: 'ArrowUp' });
    expect(prevSpy).toHaveBeenCalledTimes(1);
    // Horizontal arrows are inert on the vertical axis.
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('switches the track/item gutter axis with orientation', () => {
    const { rerender } = render(
      <Carousel>
        <CarouselContent data-testid="track">
          <CarouselItem data-testid="slide">Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(screen.getByTestId('track')).toHaveClass('-ml-4');
    expect(screen.getByTestId('track')).not.toHaveClass('flex-col');
    expect(screen.getByTestId('slide')).toHaveClass('pl-4');

    rerender(
      <Carousel orientation="vertical">
        <CarouselContent data-testid="track">
          <CarouselItem data-testid="slide">Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(screen.getByTestId('track')).toHaveClass('-mt-4', 'flex-col');
    expect(screen.getByTestId('slide')).toHaveClass('pt-4');
  });

  it('disables prev at the start (no layout means neither end can scroll)', () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('does not call scroll when a disabled control is clicked (inert)', async () => {
    const user = userEvent.setup();
    let api: CarouselApi;
    render(
      <Carousel setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
        <CarouselNext />
      </Carousel>,
    );
    const spy = vi.spyOn(api!, 'scrollNext');
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(next).toBeDisabled();
    await user.click(next);
    expect(spy).not.toHaveBeenCalled();
  });

  it('passes opts through to embla', () => {
    let api: CarouselApi;
    render(
      <Carousel opts={{ loop: true, align: 'start' }} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    const opts = api!.internalEngine().options;
    expect(opts.loop).toBe(true);
    expect(opts.align).toBe('start');
  });

  it('passes plugins through to embla', () => {
    let api: CarouselApi;
    const init = vi.fn();
    // A trivial embla plugin - the engine calls `init` on mount and exposes it by `name` from
    // `api.plugins()`, so both prove the `plugins` argument reached `useEmblaCarousel`.
    const probe = () => ({ name: 'probe', options: {}, init, destroy: vi.fn() });
    render(
      <Carousel plugins={[probe()]} setApi={(a) => (api = a)}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(api!.plugins()).toHaveProperty('probe');
    expect(init).toHaveBeenCalled();
  });

  it('throws when a part is used outside <Carousel>', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <CarouselContent>
          <CarouselItem>Orphan</CarouselItem>
        </CarouselContent>,
      ),
    ).toThrow(/useCarousel must be used within a <Carousel \/>/);
    spy.mockRestore();
  });

  describe('className merge (caller wins)', () => {
    it('root', () => {
      render(
        <Carousel className="relative custom-root">
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      expect(screen.getByRole('region')).toHaveClass('custom-root');
    });

    it('content track', () => {
      render(
        <Carousel>
          <CarouselContent className="custom-track" data-testid="track">
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      expect(screen.getByTestId('track')).toHaveClass('custom-track');
    });

    it('item (basis override wins)', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem className="basis-1/2" data-testid="slide">
              Slide 1
            </CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      const slide = screen.getByTestId('slide');
      expect(slide).toHaveClass('basis-1/2');
      expect(slide).not.toHaveClass('basis-full');
    });

    it('controls', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="custom-prev" />
          <CarouselNext className="custom-next" />
        </Carousel>,
      );
      expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveClass('custom-prev');
      expect(screen.getByRole('button', { name: 'Next slide' })).toHaveClass('custom-next');
    });
  });

  describe('ref forwarding', () => {
    it('root', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Carousel ref={ref}>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('aria-roledescription', 'carousel');
    });

    it('content track', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Carousel>
          <CarouselContent ref={ref}>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('flex');
    });

    it('item', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem ref={ref}>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute('aria-roledescription', 'slide');
    });

    it('controls', () => {
      const prevRef = createRef<HTMLButtonElement>();
      const nextRef = createRef<HTMLButtonElement>();
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious ref={prevRef} />
          <CarouselNext ref={nextRef} />
        </Carousel>,
      );
      expect(prevRef.current).toBeInstanceOf(HTMLButtonElement);
      expect(nextRef.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
