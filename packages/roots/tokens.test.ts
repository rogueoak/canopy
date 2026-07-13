import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// The WCAG math and the canonical role-pair list live in contrast.mjs (spec 0028) so the core
// tokens and every consumer brand are guarded by the EXACT same code and thresholds.
import { AA_PAIRS as PAIRS, contrast, parseDecls } from './contrast.mjs';

/**
 * These tests read the BUILT `dist/` outputs (the package must build before it is
 * tested - see `turbo.json` `test.dependsOn`). They guard the two-tier token system:
 * primitive ramps are emitted as literals, and semantic tokens survive as *references*
 * to their primitive CSS vars (not flattened to literals) across all three outputs -
 * the reference seam hardened in 0002 and relied on by the dark remap in 0004.
 */
const distUrl = (file: string) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));
const read = (file: string) => readFileSync(distUrl(file), 'utf8');

describe('Roots token outputs - primitives', () => {
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

describe('Roots token outputs - semantic reference seam', () => {
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

describe('Roots token outputs - Tailwind v4 namespaces', () => {
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
    // Expressive motion tokens (0033) reach the @theme inline block too.
    expect(preset).toContain('--duration-micro: var(--duration-micro)');
    expect(preset).toContain('--duration-slower: var(--duration-slower)');
    expect(preset).toContain('--ease-spring: var(--ease-spring)');
    expect(preset).toContain('--ease-spring-strong: var(--ease-spring-strong)');
    // Typography sub-namespaces (drive leading-*/tracking-*/font-* utilities).
    expect(preset).toContain('--leading-snug: var(--leading-snug)');
    expect(preset).toContain('--tracking-tight: var(--tracking-tight)');
    expect(preset).toContain('--font-weight-medium: var(--font-weight-medium)');
  });

  it('ships the Dialog overlay-motion (keyframes + token-composed animate utilities) in the preset', () => {
    // Motion ships from the preset, not `@source` (which can never emit keyframes / a `@theme
    // --animate-*` theme declaration). Grep the BUILT rule (per the literal-class learning) to
    // prove the partial was folded in and the consumer gets working `animate-dialog-*` utilities.
    const preset = read('tailwind-preset.css');
    expect(preset).toContain('@keyframes dialog-overlay-in');
    expect(preset).toContain('@keyframes dialog-content-in');
    expect(preset).toContain('--animate-dialog-overlay-in:');
    // The animate value COMPOSES the motion tokens (not hardcoded ms/easing) → token-driven.
    const overlayIn = /--animate-dialog-overlay-in:\s*([^;]+);/.exec(preset)?.[1] ?? '';
    expect(overlayIn).toContain('var(--duration-slow)');
    expect(overlayIn).toContain('var(--ease-decelerate)');

    // The same partial now also carries the off-canvas drawer slide (first consumed by SideNav
    // 0026) - assert its keyframes + token-composed animate value ship too.
    expect(preset).toContain('@keyframes drawer-in');
    expect(preset).toContain('--animate-drawer-in:');
    const drawerIn = /--animate-drawer-in:\s*([^;]+);/.exec(preset)?.[1] ?? '';
    expect(drawerIn).toContain('var(--duration-slow)');

    // The same partial now carries the generic expressive presets (0033) - pop/shake/fade.
    // Assert their keyframes ship and each animate value composes the motion tokens.
    expect(preset).toContain('@keyframes pop-in');
    expect(preset).toContain('@keyframes shake');
    expect(preset).toContain('@keyframes fade-in');
    expect(preset).toContain('--animate-pop-in:');
    const popIn = /--animate-pop-in:\s*([^;]+);/.exec(preset)?.[1] ?? '';
    expect(popIn).toContain('var(--duration-base)');
    expect(popIn).toContain('var(--ease-spring)');
    const shake = /--animate-shake:\s*([^;]+);/.exec(preset)?.[1] ?? '';
    expect(shake).toContain('var(--ease-standard)');
    expect(preset).toContain('--animate-fade-in:');
  });
});

describe('Roots motion outputs - expressive tokens (0033)', () => {
  it('tokens.css declares the new spring easings and micro/slower durations', () => {
    const css = read('tokens.css');
    expect(css).toContain('--duration-micro: 80ms');
    expect(css).toContain('--duration-slower: 480ms');
    expect(css).toContain('--ease-spring: cubic-bezier(0.34, 1.36, 0.64, 1)');
    expect(css).toContain('--ease-spring-strong: cubic-bezier(0.34, 3.85, 0.64, 1)');
  });

  it('typed TS export exposes the new motion tokens with their literal values', async () => {
    const { tokens } = await import('./dist/tokens.js');
    expect(tokens['duration-micro']).toBe('80ms');
    expect(tokens['duration-slower']).toBe('480ms');
    expect(tokens['ease-spring']).toBe('cubic-bezier(0.34, 1.36, 0.64, 1)');
    expect(tokens['ease-spring-strong']).toBe('cubic-bezier(0.34, 3.85, 0.64, 1)');
  });
});

describe('Roots token outputs - composite text roles', () => {
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
 * hex and compute the WCAG 2.1 contrast ratio - for the light `:root` AND the `.dark`
 * remap. A ramp/remap edit that drops a pair below threshold now fails the build.
 *
 * The light theme resolves via the typed export's `var(--…)` references. The dark theme
 * resolves from the built `tokens.css`: parse the `.dark { … }` block for each semantic
 * override (`--x: var(--primitive)`) and chase to the primitive's `:root` hex literal.
 * Primitives are theme-agnostic literals declared once in `:root`.
 *
 * `contrast`, `parseDecls`, and the `PAIRS` list (`AA_PAIRS`) are imported from contrast.mjs
 * so this core guard and the brand pipeline (spec 0028) share one definition.
 */

// Split tokens.css into the `:root { … }` block and the `.dark { … }` block.
const splitThemeBlocks = (css: string) => {
  const darkAt = css.indexOf('.dark {');
  if (darkAt === -1) throw new Error('tokens.css is missing a `.dark` block');
  const rootBody = css.slice(0, darkAt);
  const darkBody = css.slice(darkAt + '.dark {'.length, css.indexOf('}', darkAt));
  return { root: parseDecls(rootBody), dark: parseDecls(darkBody) };
};

describe('Roots semantic colours - WCAG AA contrast (computed from real hexes)', () => {
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
    // .dark would fall through to its light :root value - but the coverage guard below
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

describe('Roots theming - dark coverage guard', () => {
  // The set of themed semantic vars: `--color-*` vars in :root that REFERENCE a primitive
  // (`var(--…)`), i.e. roles - not the primitive ramp literals (shared, theme-agnostic)
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
    // copy-paste slip - the role would be visually identical across themes. The lone
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

describe('Roots interaction states - base/hover/active are distinct within each theme', () => {
  // The contrast guard proves each fill is legible; this proves the three states of a role
  // actually DIFFER inside a theme. The dark-coverage guard only compares dark-vs-light, so a
  // hover that collided with its OWN base in one theme (dark `danger-hover` == dark `danger`,
  // which made the destructive button's hover invisible in dark - feedback 0004) slipped
  // straight through. This closes that gap in both themes.
  const FAMILIES: [string, string[]][] = [
    ['primary', ['color-primary', 'color-primary-hover', 'color-primary-active']],
    ['secondary', ['color-secondary', 'color-secondary-hover', 'color-secondary-active']],
    ['danger', ['color-danger', 'color-danger-hover', 'color-danger-active']],
  ];

  const distinctFailures = (label: string, resolve: (n: string) => string) => {
    const fails: string[] = [];
    for (const [role, steps] of FAMILIES) {
      // Call with a single arg - `steps.map(resolve)` would pass the index as `resolve`'s
      // second param (its `seen` accumulator), breaking the cycle guard.
      const hexes = steps.map((step) => resolve(step));
      for (let i = 0; i < hexes.length; i++) {
        for (let j = i + 1; j < hexes.length; j++) {
          if (hexes[i] === hexes[j]) {
            fails.push(
              `${label}: ${role} - ${steps[i]} and ${steps[j]} both resolve to ${hexes[i]}`,
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
