import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildBrand } from './brand.mjs';
import { checkBrandCss, contrast, extractBlock, extractThemedRoles } from './contrast.mjs';

/**
 * The thoughtstream (River Mist) brand (spec 0032) must build AA-clean through the SAME pipeline the
 * sunset example proves - a real brand, not a demo, so a break here fails a shipping app. Reads the
 * BUILT `dist/tokens.css` (the package builds before it is tested, turbo `test.dependsOn`) for the
 * required-role contract, so the brand is held to whatever roles Canopy actually ships.
 */
const here = dirname(fileURLToPath(import.meta.url));
const brand = (f: string) => resolve(here, 'examples/thoughtstream', f);
const requiredRoles = extractThemedRoles(readFileSync(resolve(here, 'dist/tokens.css'), 'utf8'));

let outDir: string;
let css: string;

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'canopy-thoughtstream-'));
  const res = await buildBrand({
    name: 'thoughtstream',
    primitives: brand('primitive.json'),
    semantic: brand('semantic.json'),
    semanticDark: brand('semantic.dark.json'),
    outFile: join(outDir, 'thoughtstream.css'),
  });
  css = res.css;
});

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('thoughtstream brand (River Mist)', () => {
  it('maps every Canopy semantic role in BOTH themes, reference-aware', () => {
    const root = extractBlock(css, ':root')!;
    const dark = extractBlock(css, '.dark')!;
    expect(requiredRoles.length).toBeGreaterThan(30);
    for (const role of requiredRoles) {
      expect(root[role], `light ${role}`).toMatch(/^var\(--color-[a-z0-9-]+\)$/i);
      expect(dark[role], `dark ${role}`).toMatch(/^var\(--color-[a-z0-9-]+\)$/i);
    }
  });

  it('points primary at the River Mist slate ramp (light + dark anchors)', () => {
    const root = extractBlock(css, ':root')!;
    const dark = extractBlock(css, '.dark')!;
    // The documented anchors: slate.600 light, slate.300 dark.
    expect(root['color-primary']).toBe('var(--color-slate-600)');
    expect(dark['color-primary']).toBe('var(--color-slate-300)');
    expect(root['color-slate-600']).toBe('#42666f');
    expect(root['color-slate-300']).toBe('#8fb6bb');
    // The palette fully replaces Canopy's - no moss/stone ramps leak through.
    expect(css).not.toContain('--color-moss-');
    expect(css).not.toContain('--color-stone-');
  });

  it('meets WCAG AA for every role pair in light AND dark', () => {
    const { failures, missingLight, missingDark, identicalDark } = checkBrandCss(css, {
      requiredRoles,
    });
    expect(missingLight, missingLight.join(', ')).toEqual([]);
    expect(missingDark, missingDark.join(', ')).toEqual([]);
    expect(identicalDark, identicalDark.join(', ')).toEqual([]);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('resolves primary-foreground on primary to an AA-passing ratio (light)', () => {
    const root = extractBlock(css, ':root')!;
    const chase = (name: string): string => {
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(root[name]);
      return ref ? chase(ref[1]) : root[name];
    };
    expect(
      contrast(chase('color-primary-foreground'), chase('color-primary')),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
