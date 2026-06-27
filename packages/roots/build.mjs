/**
 * Roots token build (spec 0004 — light + dark; generalized 0003-fix).
 *
 * Style Dictionary 4 resolves `source`/`include` per CONFIG (instance), not per
 * platform, so the light `:root` build and each theme remap run as separate SD
 * instances:
 *
 *   1. Light: all tokens except the per-theme `*.<theme>.json` sources → `tokens.css`
 *      (`:root`), the Tailwind preset, and the typed TS export.
 *   2. Each theme (currently just `dark`): a theme semantic source with the primitives
 *      `include`d (so references resolve) → a `.<theme> { … }` sidecar
 *      (`tokens.<theme>.css`) of semantic-only `var(--primitive)` overrides.
 *
 * `tokens.css` is then composed in a SINGLE write: read the freshly-built light
 * `tokens.css`, read each theme sidecar, and `writeFileSync` the concatenation. This is
 * a pure function of its inputs — re-running the whole build (or just this fold) is
 * IDEMPOTENT and never double-appends (feedback 0003; the old append-in-place could
 * double-theme on a watch/standalone run). The theme passes + fold run inside a
 * `try/finally` that removes every sidecar even on error, so a throw can't leave a stale
 * sidecar or a half-themed `tokens.css` behind.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import lightConfig, { themeConfig, themes } from './style-dictionary.config.mjs';

const dist = (file) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));

// Light build owns the `:root` block of tokens.css plus the preset + typed export.
const light = new StyleDictionary(lightConfig);
await light.buildAllPlatforms();

// Fold the overlay-motion partial onto the freshly-built preset in a SINGLE write. The
// `@keyframes` + `@theme --animate-*` declarations are theme declarations, not utilities, so
// Tailwind's `@source` scanner can never emit them — they must ship from the preset every
// consumer imports (the same reason tokens.css owns the runtime vars). Reading the just-built
// preset (not the previous on-disk file) + the hand-authored partial makes this fold a pure
// function of its inputs → re-running it is IDEMPOTENT and never double-appends (mirrors the
// tokens.css fold below). It's independent of the theme sidecars, so it sits before that block.
const presetFile = dist('tailwind-preset.css');
const motionPartial = fileURLToPath(new URL('./preset-motion.css', import.meta.url));
writeFileSync(presetFile, readFileSync(presetFile, 'utf8') + readFileSync(motionPartial, 'utf8'));

const sidecars = themes.map(({ name }) => dist(`tokens.${name}.css`));
try {
  // Build each theme's `.<name>` sidecar.
  for (const { name, glob } of themes) {
    const theme = new StyleDictionary(themeConfig(name, glob));
    await theme.buildAllPlatforms();
  }
  // Compose tokens.css in ONE write: the light `:root` base + each theme block, in
  // declared order. Reading the freshly-built light file (not the previous on-disk
  // tokens.css) makes the fold a pure function of this build's outputs → idempotent.
  const base = readFileSync(dist('tokens.css'), 'utf8');
  const themeBlocks = sidecars.map((file) => readFileSync(file, 'utf8'));
  writeFileSync(dist('tokens.css'), base + themeBlocks.join(''));
} finally {
  // Always drop the sidecars — even if a build/fold above threw — so they never linger.
  for (const file of sidecars) rmSync(file, { force: true });
}
