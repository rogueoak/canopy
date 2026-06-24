import StyleDictionary from 'style-dictionary';
import { getReferences, usesReferences } from 'style-dictionary/utils';

/**
 * Custom transform: drop a trailing `-default` segment from the kebab name.
 *
 * Used for the DEFAULT convention. A functional colour family (`success`,
 * `warning`, …) is BOTH a primitive ramp (`color.success.50…950`) and a single
 * semantic role. Style Dictionary cannot put a `$value` on the `color.success`
 * group node (it has children), so the semantic role lives at `color.success.DEFAULT`
 * — a sibling leaf. This transform renames `color-success-default` → `color-success`
 * so the role still emits `--color-success` (→ `bg-success`) while the ramp keeps
 * `--color-success-600` etc. (Mirrors Tailwind's own DEFAULT handling.)
 */
StyleDictionary.registerTransform({
  name: 'name/kebab-no-default',
  type: 'name',
  // Robust: only strip the suffix when the token's own *path tail* is DEFAULT
  // (the convention marker), not for any name that merely ends in `-default`.
  // An unrelated future `*-default` token (a real last path segment) is left alone.
  transform: (token) => {
    const tail = token.path[token.path.length - 1];
    return tail === 'DEFAULT' || tail === 'default'
      ? token.name.replace(/-default$/, '')
      : token.name;
  },
});

/**
 * Composite text roles (FIX, feedback 0002).
 *
 * Semantic typography roles (`display`, `h1…h4`, `body`, `caption`, `code`, …) are
 * authored as DTCG `typography` composites whose sub-values *reference* the type
 * primitives (`{text.3xl}`, `{leading.tight}`, …). They are emitted as Tailwind v4
 * `--text-<role>` font-size utilities WITH companion vars
 * (`--text-<role>--line-height` / `--font-weight` / `--letter-spacing`, plus
 * `--font-family` for `code`) so a single `text-h2` utility applies the whole role:
 * Tailwind expands `.text-h2 { font-size; line-height; font-weight; letter-spacing }`.
 *
 * The companion uses a DOUBLE-dash (`--text-h2--line-height`) that our single-dash
 * kebab pipeline never produces, so it needs this custom emission. It stays
 * reference-aware: each companion is `var(--<primitive>)`, never a flattened literal
 * (the seam hardened in feedback 0001).
 */
const isTypographyRole = (token) => (token.$type ?? token.type) === 'typography';

// Map a DTCG typography sub-key to its Tailwind `--text-<role>--<suffix>` companion.
// `fontSize` is the base var (no suffix); the rest are companions Tailwind reads.
const TYPO_COMPANION = {
  fontSize: null,
  lineHeight: 'line-height',
  fontWeight: 'font-weight',
  letterSpacing: 'letter-spacing',
  fontFamily: 'font-family',
};

/**
 * Expand a typography-composite token into reference-aware `--text-<role>` lines.
 * `mapVar(name)` turns a referenced primitive's CSS-var name into the value to emit
 * — `var(--name)` for both runtime (tokens.css) and the `@theme inline` preset.
 */
const expandTypographyRole = (token, tokens) => {
  // `text-role-h2` → `text-h2` so the utility/var is `text-h2` (the `text-role`
  // authoring path only namespaces the source file away from the `text.*` scale).
  const role = token.name.replace(/^text-role-/, 'text-');
  const original = token.original.$value ?? token.original.value;
  const lines = [];
  for (const [key, suffix] of Object.entries(TYPO_COMPANION)) {
    const sub = original[key];
    if (sub == null) continue;
    let value = String(sub);
    if (usesReferences(sub)) {
      for (const ref of getReferences(sub, tokens)) {
        const refPath = ref.path ?? ref.ref;
        value = value.replaceAll(`{${refPath.join('.')}}`, `var(--${ref.name})`);
      }
    }
    const varName = suffix ? `--${role}--${suffix}` : `--${role}`;
    lines.push([varName, value]);
  }
  return lines;
};

/**
 * The stock `css` transformGroup plus our `-default` strip appended after the
 * built-in `name/kebab` so the rename wins.
 */
const cssTransforms = [
  'attribute/cti',
  'name/kebab',
  'name/kebab-no-default',
  'time/seconds',
  'html/icon',
  'size/rem',
  'color/css',
  'asset/url',
  'fontFamily/css',
  'cubicBezier/css',
  'strokeStyle/css/shorthand',
  'border/css/shorthand',
  'transition/css/shorthand',
  'shadow/css/shorthand',
];

/**
 * Custom format: Tailwind v4 preset.
 *
 * Tailwind v4 is CSS-first — design tokens are declared inside an `@theme` block.
 * We use `@theme inline`, mapping each token name to a *reference* to its runtime
 * CSS variable (`--color-primary: var(--color-primary)`) rather than redeclaring the
 * value. This keeps `tokens.css` (`:root`) the single owner of the runtime vars
 * (no double declaration), and means a `.dark` remap in `tokens.css` cascades
 * straight through to the generated utilities (`bg-primary`, `text-primary`).
 * Consumers import this file from their app/global CSS to wire Canopy tokens into
 * Tailwind.
 */
StyleDictionary.registerFormat({
  name: 'tailwind/preset-v4',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.flatMap((token) => {
      if (isTypographyRole(token)) {
        // `@theme inline` references the runtime companion vars (owned by tokens.css)
        // 1:1, so Tailwind expands `text-<role>` into font-size + companions and a
        // future `.dark`/responsive remap in tokens.css cascades through.
        return expandTypographyRole(token, dictionary.tokens).map(
          ([varName]) => `  ${varName}: var(${varName});`,
        );
      }
      return [`  --${token.name}: var(--${token.name});`];
    });
    // Spacing special-case: Tailwind v4 derives every p-*/m-*/gap-*/size-* utility
    // from a single `--spacing` base (utilities are computed as `calc(base * n)`),
    // NOT from individual `--space-*` vars. Emit the 4px base here so `p-4` = 1rem.
    // The `--space-*` vars still live in tokens.css for direct `var()` use.
    // This is a literal (not a `var()` self-reference) because it's a build-time
    // base Tailwind reads to generate utilities, with no runtime override.
    lines.unshift('  --spacing: 0.25rem;');
    return `/* Generated by Style Dictionary — Canopy Roots Tailwind v4 preset. Do not edit. */\n@theme inline {\n${lines.join('\n')}\n}\n`;
  },
});

/**
 * Custom format: typed TypeScript token export.
 *
 * Emits a `const` object plus a `Tokens` type so consumers get autocomplete and
 * type-safety when reading token values programmatically.
 *
 * Reference-aware: a token whose original `$value` references another token emits a
 * `var(--<ref-name>)` string (so the runtime CSS var — owned by `tokens.css` — is the
 * single source of the resolved value, and theming flows through). A non-referencing
 * primitive emits its literal value.
 *
 * Naming convention: the object key is the flattened, kebab-cased Style Dictionary
 * path (`color.moss.600` → `color-moss-600`; `color.primary` → `color-primary`),
 * intentionally aligned with the CSS-var / Tailwind `--color-*` namespace so a TS key,
 * a CSS var, and a utility all share one name. Primitives are ramp paths; semantics are
 * role paths that reference them.
 */
StyleDictionary.registerFormat({
  name: 'typescript/typed-export',
  format: ({ dictionary }) => {
    const entries = dictionary.allTokens
      .flatMap((token) => {
        // Typography roles emit one flat key per emitted CSS var, mirroring the
        // `--text-<role>` + `--text-<role>--<prop>` namespace 1:1 (TS key === CSS var
        // without the leading `--`), so a role is read coherently and reference-aware:
        // `tokens['text-h2'] === 'var(--text-3xl)'`,
        // `tokens['text-h2--font-weight'] === 'var(--font-weight-semibold)'`.
        if (isTypographyRole(token)) {
          return expandTypographyRole(token, dictionary.tokens).map(
            ([varName, value]) =>
              `  ${JSON.stringify(varName.replace(/^--/, ''))}: ${JSON.stringify(value)},`,
          );
        }
        const original = token.original.$value ?? token.original.value;
        let value = token.$value ?? token.value;
        if (usesReferences(original)) {
          // Replace each `{a.b}` reference in the original value with a reference to
          // the corresponding runtime CSS var (`var(--<transformed-kebab-name>)`).
          value = String(original);
          for (const ref of getReferences(original, dictionary.tokens)) {
            // SD returns the referenced token's path on `.path`; for some refs it
            // arrives on `.ref`. Use whichever is present. `replaceAll` so a value
            // referencing the same token twice fully resolves.
            const refPath = ref.path ?? ref.ref;
            value = value.replaceAll(`{${refPath.join('.')}}`, `var(--${ref.name})`);
          }
        }
        // JSON.stringify the value so embedded quotes (e.g. the `'Geist Mono'`
        // produced by the fontFamily/css transform) and other specials are escaped.
        return [`  ${JSON.stringify(token.name)}: ${JSON.stringify(String(value))},`];
      })
      .join('\n');
    return [
      '/* Generated by Style Dictionary — Canopy Roots typed token export. Do not edit. */',
      'export const tokens = {',
      entries,
      '} as const;',
      '',
      'export type Tokens = typeof tokens;',
      'export type TokenName = keyof Tokens;',
      '',
    ].join('\n');
  },
});

/**
 * Custom format: runtime CSS variables, composite-aware.
 *
 * Delegates to the built-in `css/variables` for primitives + scalar semantics
 * (keeping `outputReferences` so `--color-primary: var(--color-moss-600)` survives),
 * but expands typography-composite roles into their `--text-<role>` + companion vars
 * instead of letting the built-in collapse them into a single CSS shorthand. These
 * are the runtime vars the `@theme inline` preset references; defining them in
 * `:root` keeps tokens.css the single owner so a future `.dark` remap cascades.
 */
const cssVariablesBuiltIn = (StyleDictionary.hooks?.formats ?? StyleDictionary.formats)[
  'css/variables'
];
StyleDictionary.registerFormat({
  name: 'css/variables-with-roles',
  format: async (args) => {
    const { dictionary } = args;
    const roles = dictionary.allTokens.filter(isTypographyRole);
    const scalar = dictionary.allTokens.filter((t) => !isTypographyRole(t));
    // Run the built-in over the scalar tokens only (so composites don't render as a
    // bogus shorthand), preserving its `:root { … }` block + outputReferences.
    const base = await cssVariablesBuiltIn({
      ...args,
      dictionary: { ...dictionary, allTokens: scalar },
    });
    if (roles.length === 0) return base;
    const roleLines = roles
      .flatMap((token) => expandTypographyRole(token, dictionary.tokens))
      .map(([varName, value]) => `  ${varName}: ${value};`)
      .join('\n');
    // Inject the role vars just before the closing brace of the built-in `:root`.
    const close = base.lastIndexOf('}');
    return `${base.slice(0, close)}\n  /* Composite text roles (text-<role> + companions) */\n${roleLines}\n${base.slice(close)}`;
  },
});

/**
 * Custom format: a `.<theme>` semantic override block (spec 0004; generalized 0003-fix).
 *
 * A non-default theme is a remap of the SEMANTIC layer only — primitives (the shared,
 * theme-agnostic ramps) are NOT repeated. This format runs over a dictionary built from a
 * theme's semantic source (e.g. `semantic.dark.json`) WITH the primitives included as
 * `include` (so references resolve), then emits ONLY the semantic tokens — each as a
 * `var(--<primitive>)` reference (reference-aware, never flattened — the seam from
 * feedback 0001) — wrapped in a `.<theme> { … }` selector. Folded after `:root` in
 * `tokens.css`, it overrides the runtime semantic vars so every utility (`bg-primary`)
 * and dependent var re-resolves under the theme class with zero per-component code.
 *
 * `include` tokens (the primitives) carry `isSource: false`, so filtering on
 * `token.isSource` keeps only the theme's semantic overrides — primitives are not re-emitted.
 *
 * The format name is parameterized per theme (`css/theme-overrides-<name>`) so the
 * selector class is baked in, letting `themeConfig` stay a pure data factory.
 *
 * A theme token MUST reference a primitive (`usesReferences`): a flat hex in a theme
 * override would silently fork the primitive layer and defeat the single-owner cascade,
 * so the non-reference branch HARD-ERRORS rather than emitting a literal.
 */
const registerThemeFormat = (name) => {
  StyleDictionary.registerFormat({
    name: `css/theme-overrides-${name}`,
    format: ({ dictionary }) => {
      const lines = dictionary.allTokens
        .filter((token) => token.isSource)
        .map((token) => {
          const original = token.original.$value ?? token.original.value;
          if (!usesReferences(original)) {
            throw new Error(
              `Theme "${name}" token "${token.name}" must reference a primitive ramp ` +
                `(e.g. {color.moss.400}); got a non-reference value: ${JSON.stringify(original)}. ` +
                `Theme overrides re-point semantic vars at shared primitives — a flat value is never expected.`,
            );
          }
          let value = String(original);
          for (const ref of getReferences(original, dictionary.tokens)) {
            const refPath = ref.path ?? ref.ref;
            value = value.replaceAll(`{${refPath.join('.')}}`, `var(--${ref.name})`);
          }
          return `  --${token.name}: ${value};`;
        });
      return `\n/* ${name} theme — semantic remap (spec 0004). Overrides the :root semantic vars;\n   primitives (shared ramps) are NOT repeated. Toggle by adding the \`${name}\` class to a\n   root element. */\n.${name} {\n${lines.join('\n')}\n}\n`;
    },
  });
};

/**
 * Light build (the default config). The theme semantic sources (`*.dark.json`, and any
 * future `*.<theme>.json`) are EXCLUDED from `source` so they never pollute the light
 * `:root` build — they are consumed only by the per-theme configs below. The three
 * outputs (runtime CSS vars, Tailwind preset, typed TS) reference the runtime vars, which
 * a theme block overrides, so a theme flip cascades to every utility automatically.
 */
const lightConfig = {
  source: ['tokens/**/*.json', '!tokens/**/*.*.json'],
  platforms: {
    css: {
      transforms: cssTransforms,
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables-with-roles',
          options: { outputReferences: true },
        },
      ],
    },
    tailwind: {
      transforms: cssTransforms,
      buildPath: 'dist/',
      files: [
        {
          destination: 'tailwind-preset.css',
          format: 'tailwind/preset-v4',
        },
      ],
    },
    ts: {
      transforms: cssTransforms,
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'typescript/typed-export',
        },
      ],
    },
  },
};

/**
 * Theme-config factory (spec 0004; generalized 0003-fix).
 *
 * A non-default theme is, by construction, ONE semantic-override token file plus a
 * `.<name>` selector block of `var(--primitive)` remaps. `themeConfig(name, glob)`
 * produces the whole Style Dictionary instance for that: the dark theme's `include`d
 * primitives (so `{color.moss.400}` references resolve), its `source` glob, and a `dark`
 * platform whose registered `css/theme-overrides-<name>` format emits the `.<name>` block
 * to a sidecar (`tokens.<name>.css`). It also registers the per-theme format as a side
 * effect, so a caller just supplies `{ name, glob }`.
 *
 * Adding a future theme is therefore: drop a `tokens/color/semantic.<name>.json` file and
 * add one `{ name, glob }` entry to the `themes` list below — no new hand-written config,
 * format, or build line. `build.mjs` iterates `themes` and folds each sidecar into
 * `tokens.css`.
 *
 * `outputReferences` is intentionally NOT set: the custom format does its own reference →
 * `var(--…)` replacement, so the built-in `outputReferences` would be dead config.
 */
export const themeConfig = (name, glob) => {
  registerThemeFormat(name);
  return {
    include: ['tokens/color/primitive.json'],
    source: [glob],
    platforms: {
      theme: {
        transforms: cssTransforms,
        buildPath: 'dist/',
        files: [
          {
            destination: `tokens.${name}.css`,
            format: `css/theme-overrides-${name}`,
          },
        ],
      },
    },
  };
};

/**
 * The non-default themes. Each entry = one `{ name, glob }`; `build.mjs` builds each and
 * folds its `.<name>` block into `tokens.css`. To add a theme: add a `semantic.<name>.json`
 * source and one entry here.
 */
export const themes = [{ name: 'dark', glob: 'tokens/color/semantic.dark.json' }];

export default lightConfig;
