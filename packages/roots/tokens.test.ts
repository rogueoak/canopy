import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * These tests read the BUILT `dist/` outputs (the package must build before it is
 * tested — see `turbo.json` `test.dependsOn`). They guard the two-tier token system:
 * primitive ramps are emitted as literals, and semantic tokens survive as *references*
 * to their primitive CSS vars (not flattened to literals) across all three outputs —
 * the reference seam hardened in 0002 and relied on by the dark remap in 0004.
 */
const distUrl = (file: string) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

describe('Roots token outputs — primitives', () => {
  it('tokens.css declares the approved primitive ramp hexes', () => {
    const css = read('tokens.css');
    expect(css).toContain('--color-moss-600: #5a6638');
    expect(css).toContain('--color-stone-50: #f7f5f1');
    expect(css).toContain('--color-amber-500: #c2873b');
    // Functional ramp steps survive (the DEFAULT seam must not drop them).
    expect(css).toContain('--color-success-600: #3f7340');
  });

  it('emits a --color-<role> for every functional ramp via the DEFAULT convention', async () => {
    const { tokens } = await import('./dist/tokens.js');
    for (const role of ['success', 'warning', 'danger', 'info'] as const) {
      // Role exists at --color-<role> (DEFAULT stripped) → references its 600 step.
      expect(tokens[`color-${role}`]).toBe(`var(--color-${role}-600)`);
    }
    // Negative guard: the raw `.DEFAULT` name must NOT leak through (the transform
    // strips the convention marker; a `color-<role>-default` key would mean it didn't).
    expect(tokens['color-success-default']).toBeUndefined();
  });
});

describe('Roots token outputs — semantic reference seam', () => {
  it('tokens.css keeps semantic tokens as references to primitives', () => {
    const css = read('tokens.css');
    expect(css).toContain('--color-primary: var(--color-moss-600)');
    expect(css).toContain('--color-bg: var(--color-stone-50)');
    // Functional role uses the DEFAULT convention → --color-success → ramp step.
    expect(css).toContain('--color-success: var(--color-success-600)');
  });

  it('typed TS export keeps literal primitives and var() references', async () => {
    const { tokens } = await import('./dist/tokens.js');
    expect(tokens['color-moss-600']).toBe('#5a6638');
    expect(tokens['color-primary']).toBe('var(--color-moss-600)');
    expect(tokens['color-success']).toBe('var(--color-success-600)');
  });
});

describe('Roots token outputs — Tailwind v4 namespaces', () => {
  it('tailwind-preset.css uses @theme inline and emits the --spacing base', () => {
    const preset = read('tailwind-preset.css');
    expect(preset).toContain('@theme inline');
    // Spacing special-case: p-*/gap-* derive from this single base.
    expect(preset).toContain('--spacing: 0.25rem');
  });

  it('tailwind-preset.css maps each category onto a Tailwind v4 namespace var', () => {
    const preset = read('tailwind-preset.css');
    expect(preset).toContain('--color-primary: var(--color-primary)');
    expect(preset).toContain('--radius-md: var(--radius-md)');
    expect(preset).toContain('--text-lg: var(--text-lg)');
    expect(preset).toContain('--shadow-md: var(--shadow-md)');
    expect(preset).toContain('--font-sans: var(--font-sans)');
    expect(preset).toContain('--ease-standard: var(--ease-standard)');
    // Typography sub-namespaces (drive leading-*/tracking-*/font-* utilities).
    expect(preset).toContain('--leading-snug: var(--leading-snug)');
    expect(preset).toContain('--tracking-tight: var(--tracking-tight)');
    expect(preset).toContain('--font-weight-medium: var(--font-weight-medium)');
  });
});

describe('Roots token outputs — composite text roles', () => {
  it('emits each text-<role> as font-size + companion vars (reference-aware)', () => {
    const css = read('tokens.css');
    // text-h2 composes references to the primitives, not flattened literals.
    expect(css).toContain('--text-h2: var(--text-3xl)');
    expect(css).toContain('--text-h2--line-height: var(--leading-tight)');
    expect(css).toContain('--text-h2--font-weight: var(--font-weight-semibold)');
    expect(css).toContain('--text-h2--letter-spacing: var(--tracking-tight)');
    // code role pulls in the mono family.
    expect(css).toContain('--text-code--font-family: var(--font-mono)');
  });

  it('the @theme inline preset references each role companion var 1:1', () => {
    const preset = read('tailwind-preset.css');
    expect(preset).toContain('--text-h2: var(--text-h2)');
    expect(preset).toContain('--text-h2--line-height: var(--text-h2--line-height)');
    expect(preset).toContain('--text-h2--font-weight: var(--text-h2--font-weight)');
  });

  it('exposes roles in the typed export, reference-preserved', async () => {
    const { tokens } = await import('./dist/tokens.js');
    expect(tokens['text-h2']).toBe('var(--text-3xl)');
    expect(tokens['text-h2--font-weight']).toBe('var(--font-weight-semibold)');
    expect(tokens['text-code--font-family']).toBe('var(--font-mono)');
    expect(tokens['text-display--letter-spacing']).toBe('var(--tracking-tighter)');
  });
});

/* --------------------------------------------------------------- WCAG AA contrast */

/**
 * Executable AA guard (feedback 0002). Instead of trusting the hand-typed story table,
 * resolve each semantic role to its real primitive hex (via the typed export's
 * `var(--…)` references) and compute the WCAG 2.1 contrast ratio. A ramp edit (exactly
 * what 0004's dark remap does) that drops a pair below threshold now fails the build.
 */
const srgbToLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex: ${hex}`);
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

const contrast = (hex1: string, hex2: string) => {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

describe('Roots semantic colours — WCAG AA contrast (computed from real hexes)', () => {
  it('meets the documented AA thresholds for every role pair on its surface', async () => {
    const { tokens } = await import('./dist/tokens.js');
    const t = tokens as Record<string, string>;

    // Follow `var(--name)` references through the typed export until a hex literal.
    const resolve = (name: string, seen = new Set<string>()): string => {
      if (seen.has(name)) throw new Error(`reference cycle at ${name}`);
      seen.add(name);
      const raw = t[name];
      if (raw == null) throw new Error(`unknown token: ${name}`);
      const ref = /^var\(--([^)]+)\)$/.exec(raw.trim());
      return ref ? resolve(ref[1], seen) : raw;
    };

    // Sanity: the resolver reaches the approved primitive hex.
    expect(resolve('color-stone-900')).toBe('#322e28');
    expect(resolve('color-primary')).toBe('#5a6638');

    // [foreground role, background role, min ratio]. 4.5 = AA normal; 3.0 = AA large
    // (text-subtle is the documented large-text-only tertiary role).
    const PAIRS: [string, string, number][] = [
      ['color-text', 'color-bg', 4.5],
      ['color-text', 'color-surface', 4.5],
      ['color-text-muted', 'color-bg', 4.5],
      ['color-text-muted', 'color-surface', 4.5],
      ['color-text-subtle', 'color-bg', 3.0],
      ['color-text-subtle', 'color-surface', 3.0],
      ['color-primary-foreground', 'color-primary', 4.5],
      ['color-secondary-foreground', 'color-secondary', 4.5],
      ['color-accent-foreground', 'color-accent', 4.5],
      ['color-accent-strong', 'color-bg', 4.5],
      ['color-muted-foreground', 'color-muted', 4.5],
      ['color-success-foreground', 'color-success', 4.5],
      ['color-warning-foreground', 'color-warning', 4.5],
      ['color-danger-foreground', 'color-danger', 4.5],
      ['color-info-foreground', 'color-info', 4.5],
      ['color-ring', 'color-bg', 3.0],
    ];

    const failures: string[] = [];
    for (const [fg, bg, min] of PAIRS) {
      const ratio = contrast(resolve(fg), resolve(bg));
      if (ratio < min) failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
