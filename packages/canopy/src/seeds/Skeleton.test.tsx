import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a div with the base token classes', () => {
    const { container } = render(<Skeleton data-testid="sk" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted');
  });

  it('stills the pulse for reduced-motion readers', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass('motion-reduce:animate-none');
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('lets a caller override aria-hidden', () => {
    const { container } = render(<Skeleton aria-hidden={false} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'false');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    const { container } = render(<Skeleton className="h-10 w-10 rounded-full" />);
    const el = container.firstElementChild as HTMLElement;
    // shape/size arrive via className; tailwind-merge drops the default rounded-md for rounded-full
    expect(el).toHaveClass('h-10', 'w-10', 'rounded-full');
    expect(el).not.toHaveClass('rounded-md');
    // the animation base survives the merge
    expect(el).toHaveClass('animate-pulse', 'bg-muted');
  });

  it('spreads native div props', () => {
    const { container } = render(<Skeleton id="avatar-sk" role="presentation" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('id', 'avatar-sk');
    expect(el).toHaveAttribute('role', 'presentation');
  });

  it('forwards a ref to the underlying div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
