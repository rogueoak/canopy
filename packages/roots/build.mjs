/**
 * Roots token build (spec 0004 — light + dark).
 *
 * Style Dictionary 4 resolves `source`/`include` per CONFIG (instance), not per
 * platform, so the light `:root` build and the dark `.dark` remap run as two separate
 * SD instances:
 *
 *   1. Light: all tokens except `*.dark.json` → `tokens.css` (`:root`), the Tailwind
 *      preset, and the typed TS export (unchanged from 0003).
 *   2. Dark: the dark semantic source with the primitives `include`d (so references
 *      resolve) → a `.dark { … }` sidecar (`tokens.dark.css`) of semantic-only
 *      `var(--primitive)` overrides.
 *
 * We then APPEND the dark block to `tokens.css` so the single file owns `:root` (light)
 * + `.dark` (dark). Primitives live once (in `:root`); `.dark` only re-points the
 * semantic vars, which cascades to every utility and dependent var.
 */
import { appendFileSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import lightConfig, { darkConfig } from './style-dictionary.config.mjs';

const dist = (file) => fileURLToPath(new URL(`./dist/${file}`, import.meta.url));

const light = new StyleDictionary(lightConfig);
await light.buildAllPlatforms();

const dark = new StyleDictionary(darkConfig);
await dark.buildAllPlatforms();

// Fold the `.dark` block into tokens.css, then drop the sidecar.
const darkBlock = readFileSync(dist('tokens.dark.css'), 'utf8');
appendFileSync(dist('tokens.css'), darkBlock);
rmSync(dist('tokens.dark.css'));
