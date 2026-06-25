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
    // moss is the greener (less-yellow) ramp refined in 0004; light/dark primary anchors.
    expect(css).toContain('--color-moss-600: #4c6634');
    expect(css).toContain('--color-moss-400: #80a85c');
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
    expect(tokens['color-moss-600']).toBe('#4c6634');
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
 * Executable AA guard (feedback 0002), extended in 0004 to BOTH themes. Instead of
 * trusting a hand-typed story table, resolve each semantic role to its real primitive
 * hex and compute the WCAG 2.1 contrast ratio — for the light `:root` AND the `.dark`
 * remap. A ramp/remap edit that drops a pair below threshold now fails the build.
 *
 * The light theme resolves via the typed export's `var(--…)` references. The dark theme
 * resolves from the built `tokens.css`: parse the `.dark { … }` block for each semantic
 * override (`--x: var(--primitive)`) and chase to the primitive's `:root` hex literal.
 * Primitives are theme-agnostic literals declared once in `:root`.
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

// Parse `--name: value;` declarations out of one CSS rule body.
const parseDecls = (body: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
};

// Split tokens.css into the `:root { … }` block and the `.dark { … }` block.
const splitThemeBlocks = (css: string) => {
  const darkAt = css.indexOf('.dark {');
  if (darkAt === -1) throw new Error('tokens.css is missing a `.dark` block');
  const rootBody = css.slice(0, darkAt);
  const darkBody = css.slice(darkAt + '.dark {'.length, css.indexOf('}', darkAt));
  return { root: parseDecls(rootBody), dark: parseDecls(darkBody) };
};

// [foreground role, background role, min ratio]. 4.5 = AA normal; 3.0 = AA large
// (text-subtle is the documented large-text-only tertiary role; ring is non-text).
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
  // Interaction-state surfaces (feedback 0003): a component renders its role foreground
  // on the hover/active fill too, so those pairs must also reach AA — in BOTH themes.
  // Guarded here so a bad hover/active ramp step (e.g. one too dark for a near-black
  // foreground) fails the build instead of shipping an illegible pressed state.
  ['color-primary-foreground', 'color-primary-hover', 4.5],
  ['color-primary-foreground', 'color-primary-active', 4.5],
  ['color-secondary-foreground', 'color-secondary-hover', 4.5],
  ['color-secondary-foreground', 'color-secondary-active', 4.5],
  ['color-danger-foreground', 'color-danger-hover', 4.5],
  ['color-danger-foreground', 'color-danger-active', 4.5],
  ['color-accent-foreground', 'color-accent-hover', 4.5],
  // `disabled` / `disabled-foreground` are DELIBERATELY excluded: WCAG 2.1 exempts
  // disabled controls (1.4.3) from the contrast minimum, and the role is intentionally
  // low-contrast. Its absence here is by design, not an oversight.
];

describe('Roots semantic colours — WCAG AA contrast (computed from real hexes)', () => {
  it('meets the documented AA thresholds for every role pair on its surface (light)', async () => {
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

    // Sanity: the resolver reaches the approved (refined) primitive hex.
    expect(resolve('color-stone-900')).toBe('#322e28');
    expect(resolve('color-primary')).toBe('#4c6634');

    const failures: string[] = [];
    for (const [fg, bg, min] of PAIRS) {
      const ratio = contrast(resolve(fg), resolve(bg));
      if (ratio < min) failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('meets the documented AA thresholds for every role pair on its surface (dark)', () => {
    const { root, dark } = splitThemeBlocks(read('tokens.css'));

    // Resolve a semantic role under .dark: the dark override re-points it at a primitive
    // var; chase that primitive to its `:root` hex literal. A role NOT overridden in
    // .dark would fall through to its light :root value — but the coverage guard below
    // forbids that for themed roles, so any pair here is genuinely a dark value.
    const resolveVar = (name: string, seen = new Set<string>()): string => {
      if (seen.has(name)) throw new Error(`reference cycle at ${name}`);
      seen.add(name);
      const raw = root[name];
      if (raw == null) throw new Error(`unknown :root var: ${name}`);
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw);
      return ref ? resolveVar(ref[1], seen) : raw;
    };
    const resolveDark = (name: string): string => {
      const raw = dark[name] ?? root[name];
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw);
      return ref ? resolveVar(ref[1]) : raw;
    };

    // Sanity: dark primary is the lighter moss step (shares the moss hue with light).
    expect(resolveDark('color-primary')).toBe('#80a85c');

    const failures: string[] = [];
    for (const [fg, bg, min] of PAIRS) {
      const ratio = contrast(resolveDark(fg), resolveDark(bg));
      if (ratio < min) failures.push(`${fg} on ${bg}: ${ratio.toFixed(2)} < ${min}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});

describe('Roots theming — dark coverage guard', () => {
  // The set of themed semantic vars: `--color-*` vars in :root that REFERENCE a primitive
  // (`var(--…)`), i.e. roles — not the primitive ramp literals (shared, theme-agnostic)
  // and not composite text roles.
  const themedRoles = (root: Record<string, string>) =>
    Object.keys(root).filter(
      (name) => name.startsWith('color-') && /^var\(--[a-z0-9-]+\)$/i.test(root[name]),
    );

  it('overrides every themed semantic colour var in the .dark block, and adds no dark-only role', () => {
    const { root, dark } = splitThemeBlocks(read('tokens.css'));

    // Forward: every themed light role MUST have a `.dark` override; otherwise it would
    // silently keep its light value under `.dark`.
    const themed = themedRoles(root);
    expect(themed.length).toBeGreaterThan(20); // sanity: the role set is present
    const missing = themed.filter((name) => dark[name] == null);
    expect(missing, `missing .dark override for: ${missing.join(', ')}`).toEqual([]);

    // Reverse: no `.dark` role may exist without a `:root`/light base (a dark-only role
    // would have nothing to override and reads as a typo/orphan).
    const orphans = Object.keys(dark).filter((name) => root[name] == null);
    expect(orphans, `.dark role with no :root/light base: ${orphans.join(', ')}`).toEqual([]);
  });

  it('makes every dark override differ from its light value (catches copy-paste)', () => {
    const { root, dark } = splitThemeBlocks(read('tokens.css'));
    // A dark override re-pointing at the SAME primitive var as light is usually a
    // copy-paste slip — the role would be visually identical across themes. The lone
    // legitimate exception is a DELIBERATELY theme-invariant foreground: `accent` is a
    // fill role with a near-black foreground (amber.950) that reads on the amber fill in
    // BOTH themes (light fill amber.500, dark fill amber.400), so accent-foreground is
    // intentionally the same primitive in both. Allowlisted explicitly so any *new*
    // identical pair still fails.
    const THEME_INVARIANT = new Set(['color-accent-foreground']);
    const identical = Object.keys(dark).filter(
      (name) => dark[name] === root[name] && !THEME_INVARIANT.has(name),
    );
    expect(
      identical,
      `dark override identical to light (copy-paste?): ${identical.join(', ')}`,
    ).toEqual([]);
  });

  it('points every dark override at a PRIMITIVE ramp path (never another semantic)', () => {
    const { dark } = splitThemeBlocks(read('tokens.css'));
    // Each dark value is `var(--<name>)`; the referenced name must be a primitive ramp
    // step (`color-<ramp>-<step>`), not another semantic role var. Referencing a semantic
    // would chain the cascade through a second role and is never intended.
    const RAMP_REF =
      /^var\(--color-(moss|bark|stone|amber|base|success|warning|danger|info)-[a-z0-9]+\)$/i;
    const bad = Object.entries(dark)
      .filter(([name]) => name.startsWith('color-'))
      .filter(([, value]) => !RAMP_REF.test(value))
      .map(([name, value]) => `${name}: ${value}`);
    expect(bad, `dark override not pointing at a primitive ramp: ${bad.join(', ')}`).toEqual([]);
  });

  it('emits exactly one `.dark {` block in tokens.css (so splitThemeBlocks cannot mis-split)', () => {
    const css = read('tokens.css');
    const count = css.match(/\.dark \{/g)?.length ?? 0;
    expect(count, `expected exactly one .dark block, found ${count}`).toBe(1);
  });
});

describe('Roots interaction states — base/hover/active are distinct within each theme', () => {
  // The contrast guard proves each fill is legible; this proves the three states of a role
  // actually DIFFER inside a theme. The dark-coverage guard only compares dark-vs-light, so a
  // hover that collided with its OWN base in one theme (dark `danger-hover` == dark `danger`,
  // which made the destructive button's hover invisible in dark — feedback 0004) slipped
  // straight through. This closes that gap in both themes.
  const FAMILIES: [string, string[]][] = [
    ['primary', ['color-primary', 'color-primary-hover', 'color-primary-active']],
    ['secondary', ['color-secondary', 'color-secondary-hover', 'color-secondary-active']],
    ['danger', ['color-danger', 'color-danger-hover', 'color-danger-active']],
  ];

  const distinctFailures = (label: string, resolve: (n: string) => string) => {
    const fails: string[] = [];
    for (const [role, steps] of FAMILIES) {
      // Call with a single arg — `steps.map(resolve)` would pass the index as `resolve`'s
      // second param (its `seen` accumulator), breaking the cycle guard.
      const hexes = steps.map((step) => resolve(step));
      for (let i = 0; i < hexes.length; i++) {
        for (let j = i + 1; j < hexes.length; j++) {
          if (hexes[i] === hexes[j]) {
            fails.push(
              `${label}: ${role} — ${steps[i]} and ${steps[j]} both resolve to ${hexes[i]}`,
            );
          }
        }
      }
    }
    return fails;
  };

  it('light: each role base/hover/active resolves to a different hex', async () => {
    const { tokens } = await import('./dist/tokens.js');
    const t = tokens as Record<string, string>;
    const resolve = (name: string, seen = new Set<string>()): string => {
      if (seen.has(name)) throw new Error(`reference cycle at ${name}`);
      seen.add(name);
      const raw = t[name];
      if (raw == null) throw new Error(`unknown token: ${name}`);
      const ref = /^var\(--([^)]+)\)$/.exec(raw.trim());
      return ref ? resolve(ref[1], seen) : raw;
    };
    const fails = distinctFailures('light', resolve);
    expect(fails, fails.join('\n')).toEqual([]);
  });

  it('dark: each role base/hover/active resolves to a different hex', () => {
    const { root, dark } = splitThemeBlocks(read('tokens.css'));
    const resolveVar = (name: string, seen = new Set<string>()): string => {
      if (seen.has(name)) throw new Error(`reference cycle at ${name}`);
      seen.add(name);
      const raw = root[name];
      if (raw == null) throw new Error(`unknown :root var: ${name}`);
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw);
      return ref ? resolveVar(ref[1], seen) : raw;
    };
    const resolveDark = (name: string): string => {
      const raw = dark[name] ?? root[name];
      const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw);
      return ref ? resolveVar(ref[1]) : raw;
    };
    const fails = distinctFailures('dark', resolveDark);
    expect(fails, fails.join('\n')).toEqual([]);
  });
});
