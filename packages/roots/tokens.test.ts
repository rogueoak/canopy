import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * These tests read the BUILT `dist/` outputs (the package must build before it is
 * tested — see `turbo.json` `test.dependsOn`). They assert all three Style Dictionary
 * outputs AND the reference seam: a referencing token (`color-sample-ref`) must survive
 * as a `var(--color-sample)` reference in every output, not be flattened to a literal.
 */
const distUrl = (file: string) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

describe('Roots token outputs', () => {
  it('tokens.css declares the primitive and preserves the reference', () => {
    const css = read('tokens.css');
    expect(css).toContain('--color-sample: #4a7c59');
    expect(css).toContain('--color-sample-ref: var(--color-sample)');
  });

  it('tailwind-preset.css uses @theme inline and references the runtime vars', () => {
    const preset = read('tailwind-preset.css');
    expect(preset).toContain('@theme inline');
    expect(preset).toContain('--color-sample');
    expect(preset).toContain('--color-sample-ref: var(--color-sample-ref)');
  });

  it('typed TS export keeps the literal primitive and a var() reference', async () => {
    const { tokens } = await import('./dist/tokens.js');
    expect(tokens['color-sample']).toBe('#4a7c59');
    expect(tokens['color-sample-ref']).toBe('var(--color-sample)');
  });
});
