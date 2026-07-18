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
