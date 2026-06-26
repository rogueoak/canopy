import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders a status live region whose label is the sr-only text (single source)', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner.tagName).toBe('SPAN');
    // The label lives ONLY in the sr-only text node (no duplicate aria-label attribute), so a
    // polite live region announces it once on mount.
    expect(spinner).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
  });

  it('uses a custom label (via the aria-label prop) as the sr-only text', () => {
    render(<Spinner aria-label="Saving changes" />);
    const spinner = screen.getByRole('status');
    expect(spinner).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Saving changes')).toHaveClass('sr-only');
  });

  it('defaults to the md size (h-5 w-5) on the spinning SVG', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it.each([
    ['sm', ['h-4', 'w-4']],
    ['md', ['h-5', 'w-5']],
    ['lg', ['h-6', 'w-6']],
  ] as const)('maps the %s size to its box classes', (size, classes) => {
    const { container } = render(<Spinner size={size} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass(...classes);
  });

  it('spins the SVG and stills it under reduced motion', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-spin', 'motion-reduce:animate-none');
  });

  it('keeps the SVG out of the accessibility tree (announced once via the label)', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws with currentColor so it inherits the caller text colour', () => {
    const { container } = render(<Spinner className="text-primary" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-primary');
    // BOTH stroked shapes (track circle + arc path) must inherit currentColor — assert each so a
    // regression that drops it on just one is caught.
    const stroked = container.querySelectorAll('[stroke]');
    expect(stroked.length).toBeGreaterThanOrEqual(2);
    stroked.forEach((el) => expect(el).toHaveAttribute('stroke', 'currentColor'));
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Spinner className="inline-block" />);
    const spinner = screen.getByRole('status');
    // tailwind-merge drops the default inline-flex in favour of the caller's display utility
    expect(spinner).toHaveClass('inline-block');
    expect(spinner).not.toHaveClass('inline-flex');
  });

  it('forwards a ref to the underlying span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveAttribute('role', 'status');
  });
});
