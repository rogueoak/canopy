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
  });
});
