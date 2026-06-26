import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders a status region with the default accessible name', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status', { name: 'Loading' });
    expect(spinner.tagName).toBe('SPAN');
  });

  it('echoes the default label into a visually-hidden (sr-only) copy', () => {
    render(<Spinner />);
    const srText = screen.getByText('Loading');
    expect(srText).toHaveClass('sr-only');
  });

  it('uses a custom aria-label as the accessible name and the sr-only text', () => {
    render(<Spinner aria-label="Saving changes" />);
    expect(screen.getByRole('status', { name: 'Saving changes' })).toBeInTheDocument();
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
    const circle = container.querySelector('circle');
    expect(circle).toHaveAttribute('stroke', 'currentColor');
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
