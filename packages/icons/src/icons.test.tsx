import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as api from './index';
import { iconNames, iconRegistry } from './registry';
import { Home, Github, X, Close } from './icons';

/**
 * The curated set is data-driven from `./icons`; these tests guard that the registry, the public
 * exports, and what actually renders can never silently drift (the catalog reads the same registry,
 * so a green suite means the rendered docs match the exports).
 */
describe('curated icon set', () => {
  it('exports a non-trivial set including the five social marks', () => {
    expect(iconNames.length).toBeGreaterThanOrEqual(40);
    for (const social of ['Github', 'Linkedin', 'X', 'Facebook', 'Instagram']) {
      expect(iconNames).toContain(social);
    }
  });

  it('resolves the X (brand) / Close (dismiss glyph) name split', () => {
    // Lucide's close glyph is `Close`; `X` is the brand mark - both exist, both distinct.
    expect(iconRegistry.X).toBeDefined();
    expect(iconRegistry.Close).toBeDefined();
    expect(iconRegistry.X).not.toBe(iconRegistry.Close);
    expect(X).toBe(iconRegistry.X);
    expect(Close).toBe(iconRegistry.Close);
  });

  it('every public icon name is also reachable as a named export from the package root', () => {
    for (const name of iconNames) {
      expect(api).toHaveProperty(name);
      expect((api as Record<string, unknown>)[name]).toBe(iconRegistry[name]);
    }
  });

  it('every registry entry renders an <svg> with currentColor', () => {
    for (const name of iconNames) {
      const Glyph = iconRegistry[name]!;
      const { container, unmount } = render(<Glyph data-testid={`icon-${name}`} />);
      const svg = container.querySelector('svg');
      expect(svg, `${name} should render an <svg>`).not.toBeNull();
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      unmount();
    }
  });

  it('a curated icon renders an <svg> (smoke)', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    render(<Github />);
  });
});
