/**
 * Brand theming pipeline (spec 0028).
 *
 * `buildBrand()` turns a consumer's DTCG brand token files - NEW primitive ramps plus light and
 * dark semantic mappings that reuse Canopy's role names - into a single `brand.css`:
 *
 *   <lightSelector> { <brand primitives, literal>  <light roles: var(--brand-primitive)> }
 *   <darkSelector>  { <dark roles: var(--brand-primitive)> }
 *
 * Imported AFTER `@rogueoak/roots/tokens.css`, these blocks win by cascade and re-point the
 * semantic roles the brand maps, so every Canopy component re-themes to the brand in light and dark
 * with no component change (components consume only semantic roles). A brand may map ANY SUBSET of
 * the roles: whatever it omits keeps Canopy's own default (also by cascade, since the default
 * `tokens.css` is imported first).
 *
 * It reuses the core build's custom formats/transforms (`css/variables-with-roles` for the light
 * block, the theme-overrides format for the dark block - the SAME one that HARD-ERRORS on a
 * flat-hex override) and the shared AA guard (`contrast.mjs`). The build THROWS if any role/state
 * pair breaks AA in either theme - and for an omitted role that means the EFFECTIVE pair (a brand
 * override combined with the Canopy default it inherits), so a partial brand can't ship an
 * illegible combination either - a broken brand can't ship green.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { cssTransforms, themeConfig } from './style-dictionary.config.mjs';
import { checkBrandCss, extractThemedRoles, resolveCanopyDefaults } from './contrast.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const toAbs = (p) => resolve(process.cwd(), p);
const asArray = (v) => (Array.isArray(v) ? v : [v]);
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Canopy's brand contract, read from its OWN shipped `dist/tokens.css`: the themed `--color-*`
 * roles (those referencing a primitive) plus each role's resolved default hex per theme. Deriving
 * both from what Canopy actually ships means the role list can't drift from a hand-maintained one,
 * and the defaults are exactly what a brand's omitted role inherits by cascade. A brand may map any
 * subset of the roles; whatever it omits is validated against these defaults.
 */
const canopyContract = () => {
  const tokensCss = resolve(here, 'dist/tokens.css');
  let css;
  try {
    css = readFileSync(tokensCss, 'utf8');
  } catch {
    throw new Error(
      `Cannot read Canopy's tokens at ${tokensCss}. Build @rogueoak/roots before building a brand.`,
    );
  }
  const roles = extractThemedRoles(css);
  if (roles.length === 0) throw new Error(`No semantic roles found in ${tokensCss}`);
  return { roles, defaults: resolveCanopyDefaults(css) };
};

/**
 * Build a brand override stylesheet.
 *
 * @param {object} options
 * @param {string} options.name - brand name (used for output naming + the scoped selector).
 * @param {string|string[]} options.primitives - path(s) to the brand's primitive-ramp DTCG file(s).
 * @param {string} options.semantic - path to the brand's LIGHT semantic mapping (Canopy role names).
 * @param {string} options.semanticDark - path to the brand's DARK semantic mapping.
 * @param {string} options.outFile - where to write `brand.css`.
 * @param {string|null} [options.scope] - null -> `:root` + `.dark` (whole document); a class name
 *   (e.g. `"sunset"`) -> `.sunset` + `.sunset.dark` (scope the brand to a subtree).
 * @returns {Promise<{outFile:string, css:string, roles:string[], selectors:{light:string,dark:string}}>}
 */
export async function buildBrand({
  name,
  primitives,
  semantic,
  semanticDark,
  outFile,
  scope = null,
}) {
  if (!name) throw new Error('buildBrand: `name` is required');
  if (!primitives) throw new Error('buildBrand: `primitives` is required');
  if (!semantic) throw new Error('buildBrand: `semantic` is required');
  if (!semanticDark) throw new Error('buildBrand: `semanticDark` is required');
  if (!outFile) throw new Error('buildBrand: `outFile` is required');

  const slug = slugify(name) || 'brand';
  const out = toAbs(outFile);
  const outDir = dirname(out);
  // `scope` carries the class NAME to scope the brand to (not just a flag): a string ->
  // `.<scope>` / `.<scope>.dark`; null/empty -> the whole document (`:root` / `.dark`).
  const scopeClass = scope ? slugify(scope) : null;
  const lightSelector = scopeClass ? `.${scopeClass}` : ':root';
  const darkSelector = scopeClass ? `.${scopeClass}.dark` : '.dark';
  mkdirSync(outDir, { recursive: true });

  const primitivePaths = asArray(primitives).map(toAbs);
  const lightSidecar = `.brand-${slug}.light.css`;
  const darkSidecar = `.brand-${slug}.dark.css`;
  const lightSidecarPath = resolve(outDir, lightSidecar);
  const darkSidecarPath = resolve(outDir, darkSidecar);

  try {
    // Light block: brand primitives (literal) + light roles (var(--brand-primitive)).
    const light = new StyleDictionary({
      log: { verbosity: 'silent' },
      source: [...primitivePaths, toAbs(semantic)],
      platforms: {
        css: {
          transforms: cssTransforms,
          buildPath: `${outDir}/`,
          files: [
            {
              destination: lightSidecar,
              format: 'css/variables-with-roles',
              options: { outputReferences: true, selector: lightSelector },
            },
          ],
        },
      },
    });
    await light.buildAllPlatforms();

    // Dark block: dark roles only, reusing the core theme-overrides format (primitives are
    // `include`d so `{color.<ramp>.<step>}` references resolve, then filtered out on emit).
    const dark = new StyleDictionary({
      log: { verbosity: 'silent' },
      ...themeConfig(`${slug}-dark`, toAbs(semanticDark), {
        include: primitivePaths,
        buildPath: `${outDir}/`,
        destination: darkSidecar,
        selector: darkSelector,
      }),
    });
    await dark.buildAllPlatforms();

    // Compose brand.css in memory (pure function of the two sidecars -> idempotent).
    const css = readFileSync(lightSidecarPath, 'utf8') + readFileSync(darkSidecarPath, 'utf8');

    // Validate BEFORE writing: AA in both themes (for the brand's overrides AND the effective
    // override/inherited-default combinations), and each dark override distinct from its light.
    // A brand may map any subset of roles - what it omits inherits the Canopy default, so an
    // omission is fine but a legibility break against that default is NOT. Writing only on success
    // means a failed build leaves no shippable file behind (the "a broken brand can't ship"
    // contract).
    const { roles, defaults } = canopyContract();
    const { failures, missingLight, missingDark, identicalDark } = checkBrandCss(css, {
      lightSelector,
      darkSelector,
      requiredRoles: roles,
      defaults,
    });
    const problems = [];
    if (identicalDark.length)
      problems.push(`dark override identical to light (copy-paste?): ${identicalDark.join(', ')}`);
    if (failures.length) problems.push(`AA failures:\n  ${failures.join('\n  ')}`);
    if (problems.length) {
      throw new Error(
        `Brand "${name}" is not shippable - each dark override must differ from its light value, ` +
          `and every role pair must meet WCAG AA in light AND dark (an omitted role is validated ` +
          `against the Canopy default it inherits):\n${problems.join('\n')}`,
      );
    }

    writeFileSync(out, css);
    return {
      outFile: out,
      css,
      roles,
      inherited: { light: missingLight, dark: missingDark },
      selectors: { light: lightSelector, dark: darkSelector },
    };
  } finally {
    // Always drop the sidecars, even on a thrown validation error.
    rmSync(lightSidecarPath, { force: true });
    rmSync(darkSidecarPath, { force: true });
  }
}
