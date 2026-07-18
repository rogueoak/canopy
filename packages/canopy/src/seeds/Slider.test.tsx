import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

// Radix Slider measures its track through `react-use-size`, which calls `ResizeObserver` - a
// browser API jsdom does not implement, so rendering the slider throws without it. A no-op stub
// satisfies the measurement and lets the real Radix keyboard interaction run under jsdom (the
// only stub the Slider needs; keyboard-driven tests need no pointer/scroll stubs).
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  }
});

describe('Slider', () => {
  it('renders a single thumb with role="slider" for a single value', () => {
    render(<Slider defaultValue={[40]} aria-label="Volume" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(1);
    expect(thumbs[0]).toBeInTheDocument();
  });

  it('renders two thumbs for a range (two-entry value)', () => {
    render(<Slider defaultValue={[20, 80]} aria-label="Price range" />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('reflects aria-valuenow / aria-valuemin / aria-valuemax from value/min/max', () => {
    render(<Slider defaultValue={[30]} min={10} max={90} aria-label="Level" />);
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('aria-valuenow', '30');
    expect(thumb).toHaveAttribute('aria-valuemin', '10');
    expect(thumb).toHaveAttribute('aria-valuemax', '90');
  });

  it('derives one thumb when neither value nor defaultValue is given (falls back to [min])', () => {
    render(<Slider min={5} max={50} aria-label="Setting" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(1);
    // The fallback thumb sits at `min`.
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '5');
  });

  it('normalizes an empty value array to a single thumb (boundary: Radix would render none)', () => {
    // Radix keys thumbs off the array length, so an empty array would leave a track with no
    // `role="slider"`. The Seed clamps to one thumb so the ARIA and visuals never disagree.
    render(<Slider defaultValue={[]} min={0} max={100} aria-label="Empty" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(1);
  });

  it('normalizes a controlled empty value array to a single thumb (controlled boundary)', () => {
    // The controlled `value={[]}` path is normalized the same as the uncontrolled one: without the
    // clamp Radix keys its thumbs off the raw `[]` and renders zero `role="slider"` while the Seed
    // emits one - the ARIA/visual mismatch the normalization exists to prevent. The clamped array
    // is handed to Radix, so exactly one thumb, sitting at `min`, is rendered.
    render(<Slider value={[]} min={5} max={100} aria-label="Empty controlled" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(1);
    expect(thumbs[0]).toHaveAttribute('aria-valuenow', '5');
  });

  it('moves the value by step with ArrowRight / ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[50]} step={5} aria-label="Volume" />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    expect(thumb).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowLeft}');
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('jumps to min / max with Home / End', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await user.keyboard('{End}');
    expect(thumb).toHaveAttribute('aria-valuenow', '100');
    await user.keyboard('{Home}');
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  it('fires onValueChange with the next value (controlled path)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider value={[50]} onValueChange={onValueChange} step={10} aria-label="Volume" />,
    );
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith([60]);
    // Controlled: stays put until the parent updates `value`.
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('supports a controlled range that updates when the parent re-renders', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [val, setVal] = useState([20, 80]);
      return <Slider value={val} onValueChange={setVal} aria-label="Range" />;
    }

    render(<Controlled />);
    const [lower] = screen.getAllByRole('slider');
    lower.focus();
    await user.keyboard('{ArrowRight}');
    expect(lower).toHaveAttribute('aria-valuenow', '21');
  });

  it('works uncontrolled via defaultValue (updates without an onValueChange)', async () => {
    const user = userEvent.setup();
    render(<Slider defaultValue={[10]} aria-label="Volume" />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await user.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '11');
  });

  it('is inert when disabled (keyboard does not move the value, onValueChange never fires)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider disabled defaultValue={[50]} onValueChange={onValueChange} aria-label="Volume" />,
    );
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('applies the disabled treatment classes on the root (opacity + not-allowed)', () => {
    const { container } = render(<Slider disabled defaultValue={[50]} aria-label="Volume" />);
    const root = container.firstChild;
    expect(root).toHaveClass('data-[disabled]:cursor-not-allowed', 'data-[disabled]:opacity-50');
    // The disabled root carries the Radix disabled markers that drive those variants.
    expect(root).toHaveAttribute('data-disabled', '');
    expect(root).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not share the control name across range thumbs (each thumb needs a distinct name)', () => {
    // A single-thumb slider inherits the control's `aria-label`, but a range has two thumbs that
    // each need a DISTINCT name - copying one shared name onto both would mislead. Guard the gate
    // so a future refactor that naively forwards the label to every thumb is caught.
    render(<Slider defaultValue={[20, 80]} aria-label="Shared" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    for (const thumb of thumbs) {
      expect(thumb).not.toHaveAttribute('aria-label');
    }
  });

  it('applies aria-invalid and the danger ring to every thumb (range)', () => {
    render(<Slider aria-invalid defaultValue={[20, 80]} aria-label="Range" />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs).toHaveLength(2);
    for (const thumb of thumbs) {
      expect(thumb).toHaveAttribute('aria-invalid', 'true');
      expect(thumb).toHaveClass('aria-invalid:ring-2', 'aria-invalid:ring-danger');
    }
  });

  it('renders the track and filled range with their token classes', () => {
    const { container } = render(<Slider defaultValue={[50]} aria-label="Volume" />);
    // The track is bg-muted; the filled range is bg-primary.
    const track = container.querySelector('.bg-muted');
    const range = container.querySelector('.bg-primary');
    expect(track).toBeInTheDocument();
    expect(track).toHaveClass('rounded-full');
    expect(range).toBeInTheDocument();
  });

  it('includes the focus-visible ring on the thumb (a11y)', () => {
    render(<Slider defaultValue={[50]} aria-label="Volume" />);
    expect(screen.getByRole('slider')).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('merges a caller className over the defaults on the root (cn / tailwind-merge)', () => {
    const { container } = render(
      <Slider defaultValue={[50]} className="w-40" aria-label="Volume" />,
    );
    const root = container.firstChild;
    // tailwind-merge lets the caller win the width conflict.
    expect(root).toHaveClass('w-40');
    expect(root).not.toHaveClass('w-full');
  });

  it('spreads native props (id) onto the root control', () => {
    const { container } = render(<Slider id="zoom" defaultValue={[50]} aria-label="Zoom" />);
    expect(container.firstChild).toHaveAttribute('id', 'zoom');
  });

  it('honours orientation="vertical" (aria-orientation on the thumb)', () => {
    render(<Slider orientation="vertical" defaultValue={[50]} aria-label="Volume" />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('pairs with a label via htmlFor -> id (accessible name)', () => {
    render(
      <>
        <label id="vol-label">Volume</label>
        <Slider aria-labelledby="vol-label" defaultValue={[50]} />
      </>,
    );
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  it('forwards a ref to the underlying root', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Slider ref={ref} defaultValue={[50]} aria-label="Volume" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveAttribute('data-orientation');
  });
});
