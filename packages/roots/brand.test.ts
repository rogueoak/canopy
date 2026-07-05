import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildBrand } from './brand.mjs';
import {
  AA_PAIRS,
  checkBrandCss,
  contrast,
  extractBlock,
  extractThemedRoles,
} from './contrast.mjs';

/**
 * Exercises the brand pipeline (spec 0028) end to end: build the shipped `sunset` example brand
 * and prove it overrides every Canopy semantic role in light AND dark, AA-verified, reference-aware
 * - then prove a broken brand FAILS the build. Reads the BUILT `dist/tokens.css` (the package
 * builds before it is tested - turbo `test.dependsOn`) to derive the required-role contract, so the
 * brand is held to whatever roles Canopy actually ships.
 */
const here = dirname(fileURLToPath(import.meta.url));
const sunset = (f: string) => resolve(here, 'examples/sunset', f);
const requiredRoles = extractThemedRoles(readFileSync(resolve(here, 'dist/tokens.css'), 'utf8'));

let outDir: string;
let css: string;

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'canopy-brand-'));
  const res = await buildBrand({
    name: 'sunset',
    primitives: sunset('primitive.json'),
    semantic: sunset('semantic.json'),
    semanticDark: sunset('semantic.dark.json'),
    outFile: join(outDir, 'sunset.css'),
  });
  css = res.css;
});

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('Brand pipeline - sunset example output', () => {
  it('emits a :root block (brand primitives + light roles) and a .dark block', () => {
    const root = extractBlock(css, ':root');
    const dark = extractBlock(css, '.dark');
    expect(root).not.toBeNull();
    expect(dark).not.toBeNull();
    // Brand primitives are declared as literals under the brand's OWN ramp names.
    expect(root!['color-ember-600']).toMatch(/^#[0-9a-f]{6}$/i);
    expect(root!['color-dune-50']).toMatch(/^#[0-9a-f]{6}$/i);
    // Exactly one .dark block, so a consumer's own .dark toggle can't mis-split it.
    expect(css.match(/\.dark\s*\{/g)?.length).toBe(1);
  });

  it('re-maps every Canopy semantic role in BOTH themes, reference-aware', () => {
    const root = extractBlock(css, ':root')!;
    const dark = extractBlock(css, '.dark')!;
    expect(requiredRoles.length).toBeGreaterThan(30); // sanity: the role set is present
    for (const role of requiredRoles) {
      // Light: the role references a brand primitive (never flattened to a literal).
      expect(root[role], `light ${role}`).toMatch(/^var\(--color-[a-z0-9-]+\)$/i);
      // Dark: overridden, and also a primitive reference.
      expect(dark[role], `dark ${role}`).toMatch(/^var\(--color-[a-z0-9-]+\)$/i);
    }
  });

  it('points roles at the BRAND ramps, not Canopy primitives', () => {
    const root = extractBlock(css, ':root')!;
    expect(root['color-primary']).toBe('var(--color-ember-600)');
    expect(root['color-secondary']).toBe('var(--color-orchid-600)');
    // Canopy's moss/bark/stone ramps are NOT present - the brand fully replaces the palette.
    expect(css).not.toContain('--color-moss-');
    expect(css).not.toContain('--color-stone-');
  });

  it('meets WCAG AA for every role pair in light AND dark', () => {
    const { failures, missingLight, missingDark } = checkBrandCss(css, { requiredRoles });
    expect(missingLight, missingLight.join(', ')).toEqual([]);
    expect(missingDark, missingDark.join(', ')).toEqual([]);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('resolves a known pair to a concrete AA-passing ratio (sanity on the resolver)', () => {
    const root = extractBlock(css, ':root')!;
    const chase = (name: string): string => {
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(root[name]);
      return ref ? chase(ref[1]) : root[name];
    };
    // primary-foreground on primary must clear AA-normal in light.
    expect(
      contrast(chase('color-primary-foreground'), chase('color-primary')),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Brand pipeline - scoped brand', () => {
  it('scopes to .<brand> / .<brand>.dark when a scope is given', async () => {
    const res = await buildBrand({
      name: 'sunset',
      primitives: sunset('primitive.json'),
      semantic: sunset('semantic.json'),
      semanticDark: sunset('semantic.dark.json'),
      outFile: join(outDir, 'sunset-scoped.css'),
      scope: 'sunset',
    });
    expect(res.selectors).toEqual({ light: '.sunset', dark: '.sunset.dark' });
    expect(res.css).toMatch(/\.sunset\s*\{/);
    expect(res.css).toMatch(/\.sunset\.dark\s*\{/);
    // The scoped check must not confuse `.sunset.dark` for a bare `.dark`.
    const { failures } = checkBrandCss(res.css, {
      lightSelector: '.sunset',
      darkSelector: '.sunset.dark',
      requiredRoles,
    });
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

describe('Brand pipeline - a broken brand fails the build', () => {
  let brokenDir: string;
  beforeAll(() => {
    brokenDir = mkdtempSync(join(tmpdir(), 'canopy-brand-broken-'));
  });
  afterAll(() => rmSync(brokenDir, { recursive: true, force: true }));

  type Dtcg = { color: Record<string, { $value: string; $type: string }> };
  const withDark = (mutate: (json: Dtcg) => void, file: string) => {
    const json: Dtcg = JSON.parse(readFileSync(sunset('semantic.dark.json'), 'utf8'));
    mutate(json);
    const p = join(brokenDir, file);
    writeFileSync(p, JSON.stringify(json));
    return p;
  };

  it('rejects a dark override that breaks AA in dark', async () => {
    // text -> a mid ramp step is illegible on the dark bg (dune.950).
    const badDark = withDark((j) => (j.color.text.$value = '{color.dune.600}'), 'aa.json');
    await expect(
      buildBrand({
        name: 'sunset',
        primitives: sunset('primitive.json'),
        semantic: sunset('semantic.json'),
        semanticDark: badDark,
        outFile: join(brokenDir, 'aa.css'),
      }),
    ).rejects.toThrow(/WCAG AA/);
  });

  it('rejects a flat-hex dark override (must reference a primitive)', async () => {
    const badDark = withDark((j) => (j.color.primary.$value = '#123456'), 'flat.json');
    await expect(
      buildBrand({
        name: 'sunset',
        primitives: sunset('primitive.json'),
        semantic: sunset('semantic.json'),
        semanticDark: badDark,
        outFile: join(brokenDir, 'flat.css'),
      }),
    ).rejects.toThrow(/must reference a primitive/);
  });

  it('rejects a brand that leaves a semantic role unmapped', async () => {
    const badLight: { color: Record<string, unknown> } = JSON.parse(
      readFileSync(sunset('semantic.json'), 'utf8'),
    );
    delete badLight.color['primary-hover'];
    const p = join(brokenDir, 'missing.json');
    writeFileSync(p, JSON.stringify(badLight));
    await expect(
      buildBrand({
        name: 'sunset',
        primitives: sunset('primitive.json'),
        semantic: p,
        semanticDark: sunset('semantic.dark.json'),
        outFile: join(brokenDir, 'missing.css'),
      }),
    ).rejects.toThrow(/unmapped in light/);
  });
});

describe('AA guard is shared with the core tokens', () => {
  it('exposes the same pair list the core build uses', () => {
    // A cheap guard that the extracted list is non-trivial and includes the interaction-state
    // surfaces (the ones feedback 0003 added), so a brand is held to the full role surface.
    expect(AA_PAIRS.length).toBeGreaterThan(20);
    const flat = AA_PAIRS.map(([fg, bg]) => `${fg}|${bg}`);
    expect(flat).toContain('color-primary-foreground|color-primary-hover');
  });
});
