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
/** The social/brand marks the set promises by name. */
const EXPECTED_SOCIAL = ['Github', 'Linkedin', 'X', 'Facebook', 'Instagram', 'Threads', 'Medium'];

/**
 * A representative slice of the standard set the README/spec promise by name. Not exhaustive -
 * its job is to fail loudly if a promised, documented name is renamed or dropped.
 */
const EXPECTED_STANDARD = [
  'Home',
  'Search',
  'Settings',
  'User',
  'Menu',
  'Close',
  'Check',
  'ChevronDown',
  'ArrowRight',
  'Plus',
  'Minus',
  'Trash',
  'Edit',
  'Copy',
  'Download',
  'Upload',
  'ExternalLink',
  'Info',
  'AlertTriangle',
  'AlertCircle',
  'CheckCircle',
  'Bell',
  'Calendar',
  'Mail',
  'Eye',
  'EyeOff',
  'Sun',
  'Moon',
  'Loader',
  'MoreHorizontal',
  'MoreVertical',
  'Filter',
  'Star',
  'Heart',
  'Lock',
  'Unlock',
  'LogOut',
  'File',
  'FileText',
  'Newspaper',
  'Briefcase',
  'Tag',
  'Clock',
  'MapPin',
  'Globe',
  'Code',
  'Link',
  'Rss',
  'MessageSquare',
];

describe('curated icon set', () => {
  it('exports a non-trivial set including every promised social and standard name', () => {
    expect(iconNames.length).toBeGreaterThanOrEqual(40);
    for (const name of [...EXPECTED_SOCIAL, ...EXPECTED_STANDARD]) {
      expect(iconNames, `promised icon "${name}" should be exported`).toContain(name);
    }
  });

  it('never leaks a raw react-icons family prefix as a public name', () => {
    // The headline promise: the public surface is Canopy-semantic, so a `Lu*`/`Fa*`/`Si*` name
    // (a forgotten `as` alias on a re-export) must never appear. Guards against a silent leak the
    // count-based check above would miss.
    const leaks = iconNames.filter((n) =>
      /^(Lu|Fa|Si|Md|Hi|Io|Bs|Bi|Ai|Ri|Tb|Pi|Gi)[A-Z0-9]/.test(n),
    );
    expect(leaks, `react-icons prefixes leaked: ${leaks.join(', ')}`).toEqual([]);
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

  it('every registry entry renders an <svg> that paints in currentColor', () => {
    for (const name of iconNames) {
      const Glyph = iconRegistry[name]!;
      const { container, unmount } = render(<Glyph data-testid={`icon-${name}`} />);
      const svg = container.querySelector('svg');
      expect(svg, `${name} should render an <svg>`).not.toBeNull();
      // Lucide stroke icons paint via stroke; the filled brand marks paint via fill - either way
      // the colour is `currentColor`, which is what lets an icon theme through inherited text colour.
      const paintsInCurrentColor =
        svg!.getAttribute('stroke') === 'currentColor' ||
        svg!.getAttribute('fill') === 'currentColor';
      expect(paintsInCurrentColor, `${name} should paint in currentColor`).toBe(true);
      unmount();
    }
  });

  it('a curated icon renders an <svg> (smoke)', () => {
    const { container } = render(<Home />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    render(<Github />);
  });
});
