import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children inside a span', () => {
    render(<Badge>Stable</Badge>);
    const badge = screen.getByText('Stable');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies the default variant classes (neutral) + the pill shape', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    // neutral fill + on-role foreground (default variant)
    expect(badge).toHaveClass('bg-muted', 'text-muted-foreground');
    // shared pill shape
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full', 'text-xs');
  });

  it.each([
    ['neutral', ['bg-muted', 'text-muted-foreground']],
    ['primary', ['bg-primary', 'text-primary-foreground']],
    ['success', ['bg-success', 'text-success-foreground']],
    ['warning', ['bg-warning', 'text-warning-foreground']],
    ['danger', ['bg-danger', 'text-danger-foreground']],
    ['info', ['bg-info', 'text-info-foreground']],
  ] as const)('maps the %s variant to its token classes', (variant, classes) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    const badge = screen.getByText(variant);
    expect(badge).toHaveClass(...classes);
  });

  it('a non-default variant does not carry the neutral fill', () => {
    render(<Badge variant="success">Done</Badge>);
    const badge = screen.getByText('Done');
    expect(badge).toHaveClass('bg-success');
    expect(badge).not.toHaveClass('bg-muted');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Badge className="px-4">Wide</Badge>);
    const badge = screen.getByText('Wide');
    // tailwind-merge drops the default px-2.5 in favour of the caller's px-4
    expect(badge).toHaveClass('px-4');
    expect(badge).not.toHaveClass('px-2.5');
  });

  it('renders the child element with the badge classes when asChild (no extra span)', () => {
    const { container } = render(
      <Badge asChild variant="info">
        <a href="/seeds">Docs</a>
      </Badge>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/seeds');
    expect(link).toHaveClass('bg-info', 'text-info-foreground', 'rounded-full');
    // The badge does not wrap the child in its own span.
    expect(container.querySelector('span')).toBeNull();
  });

  it('forwards a ref to the underlying span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
