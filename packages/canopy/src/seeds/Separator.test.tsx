import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Separator } from './Separator';

describe('Separator', () => {
  it('is decorative by default — no separator role, exposed as role="none"', () => {
    render(<Separator data-testid="sep" />);
    // Radix decorative separators carry role="none" and are hidden from the a11y tree.
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.getByTestId('sep')).toHaveAttribute('role', 'none');
  });

  it('exposes role="separator" when decorative={false}', () => {
    render(<Separator decorative={false} />);
    const sep = screen.getByRole('separator');
    expect(sep).toBeInTheDocument();
    // Default orientation is horizontal; Radix omits aria-orientation for the default.
    expect(sep).not.toHaveAttribute('aria-orientation');
  });

  it('reflects vertical orientation via aria-orientation (semantic)', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep).toHaveAttribute('data-orientation', 'vertical');
  });

  it('applies the bg-border token and horizontal orientation classes by default', () => {
    render(<Separator data-testid="sep" />);
    const sep = screen.getByTestId('sep');
    expect(sep).toHaveAttribute('data-orientation', 'horizontal');
    expect(sep).toHaveClass(
      'shrink-0',
      'bg-border',
      'data-[orientation=horizontal]:h-px',
      'data-[orientation=horizontal]:w-full',
      'data-[orientation=vertical]:h-full',
      'data-[orientation=vertical]:w-px',
    );
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Separator data-testid="sep" className="bg-primary" />);
    const sep = screen.getByTestId('sep');
    // tailwind-merge lets the caller win the background conflict.
    expect(sep).toHaveClass('bg-primary');
    expect(sep).not.toHaveClass('bg-border');
  });

  it('spreads native props (id) onto the underlying element', () => {
    render(<Separator data-testid="sep" id="divider" />);
    expect(screen.getByTestId('sep')).toHaveAttribute('id', 'divider');
  });

  it('forwards a ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} decorative={false} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('role', 'separator');
  });
});
