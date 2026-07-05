import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon, IconProvider } from './Icon';
import { Home } from './icons';

describe('Icon wrapper', () => {
  it('renders the given icon as an <svg> at the default 1em size', () => {
    const { container } = render(<Icon icon={Home} data-testid="icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('height', '1em');
    expect(svg).toHaveAttribute('width', '1em');
  });

  it('is decorative (aria-hidden) by default', () => {
    const { container } = render(<Icon icon={Home} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role', 'img');
  });

  it('becomes a labelled graphic (role="img" + accessible name) when given a title', () => {
    render(<Icon icon={Home} title="Home" />);
    const img = screen.getByRole('img', { name: 'Home' });
    expect(img).toBeInTheDocument();
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('merges an incoming className onto the icon (caller can size/recolour)', () => {
    const { container } = render(<Icon icon={Home} className="size-5 text-primary" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveClass('size-5', 'text-primary');
  });

  it('lets an explicit size override the default', () => {
    const { container } = render(<Icon icon={Home} size={32} />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('height', '32');
    expect(svg).toHaveAttribute('width', '32');
  });

  it('IconProvider sets defaults for icons in its subtree', () => {
    const { container } = render(
      <IconProvider value={{ size: '2rem', className: 'provided' }}>
        <Home />
      </IconProvider>,
    );
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('height', '2rem');
    expect(svg).toHaveClass('provided');
  });
});
