import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Progress } from './Progress';

describe('Progress', () => {
  it('renders with the progressbar role', () => {
    render(<Progress value={40} aria-label="Upload" />);
    expect(screen.getByRole('progressbar', { name: 'Upload' })).toBeInTheDocument();
  });

  it('sets aria-valuenow / aria-valuemin / aria-valuemax for a determinate value', () => {
    render(<Progress value={43} aria-label="Upload" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '43');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('omits aria-valuenow when indeterminate (no value)', () => {
    render(<Progress aria-label="Working" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    // min / max are still fixed at 0-100 in the indeterminate state.
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('translates the indicator proportionally to the value (fill math)', () => {
    render(<Progress value={43} aria-label="Upload" />);
    // The indicator is the inner div; the Root carries role="progressbar".
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(indicator).toHaveStyle({ transform: 'translateX(-57%)' });
  });

  it('translates the indicator fully off-track at the value=0 boundary', () => {
    render(<Progress value={0} aria-label="Upload" />);
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(indicator).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('translates the indicator to a full fill at value=100', () => {
    render(<Progress value={100} aria-label="Upload" />);
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('clamps out-of-range values so the fill and ARIA stay in agreement', () => {
    render(<Progress value={150} aria-label="Upload" />);
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    // Radix nullifies >100, but the clamped fill still reads as full.
    expect(indicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('gates the indeterminate pulse for reduced motion (mirrors Spinner)', () => {
    render(<Progress aria-label="Working" />);
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(indicator).toHaveClass('animate-pulse', 'motion-reduce:animate-none');
    // Indeterminate is a partial-width bar so it does not read as a completed 100% fill.
    expect(indicator).toHaveClass('w-2/5');
    expect(indicator).not.toHaveClass('w-full');
  });

  it('does not pulse when a determinate value is present', () => {
    render(<Progress value={43} aria-label="Upload" />);
    const indicator = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(indicator).not.toHaveClass('animate-pulse');
    expect(indicator).toHaveClass('w-full');
  });

  it('renders the sm track height token class', () => {
    render(<Progress size="sm" value={20} aria-label="Upload" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-1.5', 'bg-muted', 'rounded-full');
  });

  it('renders the md track height token class (default)', () => {
    render(<Progress value={20} aria-label="Upload" />);
    expect(screen.getByRole('progressbar')).toHaveClass('h-2.5', 'bg-muted', 'rounded-full');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge, caller wins)', () => {
    render(<Progress value={20} aria-label="Upload" className="bg-secondary" />);
    const bar = screen.getByRole('progressbar');
    // tailwind-merge lets the caller win the background conflict.
    expect(bar).toHaveClass('bg-secondary');
    expect(bar).not.toHaveClass('bg-muted');
  });

  it('spreads native props (id) onto the Root', () => {
    render(<Progress id="quota" value={20} aria-label="Storage" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('id', 'quota');
  });

  it('forwards a ref to the underlying Root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Progress ref={ref} value={20} aria-label="Upload" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('role', 'progressbar');
  });
});
