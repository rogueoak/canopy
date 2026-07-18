import type { Meta, StoryObj } from '@storybook/react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Carousel - the swipeable, keyboard-navigable content strip Branch (spec 0061), built on
 * `embla-carousel-react` and styled with the 0005 recipe (the shadcn-on-embla carousel,
 * canopy-tokened). Embla owns the drag / snap / wrap-around / `canScrollPrev` / `canScrollNext`
 * physics; every piece of DOM and styling is ours. The family is `Carousel` (the context root that
 * owns the embla instance) + `CarouselContent` (viewport + track) + `CarouselItem` (a slide) +
 * `CarouselPrevious` / `CarouselNext` (canopy `Button` paging controls, disabled at the ends).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004) - the controls inherit `Button`'s token-driven
 * light/dark with no `dark:` on the common path. Give the root an `aria-label` so the region has an
 * accessible name (shown below).
 */
const meta = {
  title: 'Branches/Carousel',
  component: Carousel,
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------------------- helpers */

/** A plain numbered slide face - a bordered token surface so the paging is easy to see. */
function SlideFace({ n }: { n: number }) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-surface-raised p-6">
      <span className="text-h2 text-text">{n}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------------- stories */

/**
 * Playground - a single-item horizontal carousel with prev/next controls. Focus the viewport and
 * use the arrow keys, drag with a pointer, or click the controls; the controls disable at the ends.
 */
export const Playground: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <Carousel {...args} aria-label="Playground carousel" className="w-64">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideFace n={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/** Horizontal - the default axis: Left / Right arrow keys page, controls flank the viewport. */
export const Horizontal: Story = {
  render: () => (
    <Carousel aria-label="Horizontal carousel" className="w-64">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideFace n={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * Vertical - `orientation="vertical"` flips the track to a column, the item gutter to the top
 * edge, the controls above/below the viewport, and the arrow-key mapping to Up / Down.
 */
export const Vertical: Story = {
  render: () => (
    <div className="py-14">
      <Carousel orientation="vertical" aria-label="Vertical carousel" className="w-64">
        <CarouselContent className="h-64">
          {Array.from({ length: 5 }).map((_, i) => (
            <CarouselItem key={i}>
              <SlideFace n={i + 1} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

/**
 * MultipleItems - callers set `basis-*` on `CarouselItem` (via `className`) to show more than one
 * slide at a time; the item still snaps and the negative gutter keeps the spacing even.
 */
export const MultipleItems: Story = {
  render: () => (
    <Carousel aria-label="Multiple items carousel" className="w-full max-w-sm">
      <CarouselContent>
        {Array.from({ length: 8 }).map((_, i) => (
          <CarouselItem key={i} className="basis-1/3">
            <SlideFace n={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * WithContent - richer slides: a bordered token card per item. The Carousel is presentation-only;
 * any content composes inside `CarouselItem`.
 */
export const WithContent: Story = {
  render: () => (
    <Carousel aria-label="With content carousel" className="w-72">
      <CarouselContent>
        {['Onboarding', 'Analytics', 'Billing', 'Settings'].map((title, i) => (
          <CarouselItem key={title}>
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-6">
              <span className="text-h4 text-text">{title}</span>
              <p className="text-body-sm text-text-muted">
                Slide {i + 1} of 4 - drag, arrow-key, or use the controls to page.
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * Loop - passing embla `opts={{ loop: true }}` wraps around, so the prev/next controls are never
 * disabled at the ends.
 */
export const Loop: Story = {
  render: () => (
    <Carousel opts={{ loop: true }} aria-label="Looping carousel" className="w-64">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideFace n={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

/**
 * DisabledAtEnds - without `loop`, `CarouselPrevious` is disabled at the start and `CarouselNext`
 * at the end (bound to embla's `canScrollPrev` / `canScrollNext`), using the shared `Button`
 * disabled tokens.
 */
export const DisabledAtEnds: Story = {
  render: () => (
    <Carousel aria-label="Disabled at ends carousel" className="w-64">
      <CarouselContent>
        {Array.from({ length: 4 }).map((_, i) => (
          <CarouselItem key={i}>
            <SlideFace n={i + 1} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};
