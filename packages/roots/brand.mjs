/**
 * Brand theming pipeline (spec 0028).
 *
 * `buildBrand()` turns a consumer's DTCG brand token files - NEW primitive ramps plus light and
 * dark semantic mappings that reuse Canopy's role names - into a single `brand.css`:
 *
 *   <lightSelector> { <brand primitives, literal>  <light roles: var(--brand-primitive)> }
 *   <darkSelector>  { <dark roles: var(--brand-primitive)> }
 *
 * Imported AFTER `@rogueoak/roots/tokens.css`, these blocks win by cascade and re-point every
 * semantic role, so every Canopy component re-themes to the brand in light and dark with no
 * component change (components consume only semantic roles).
 *
 * It reuses the core build's custom formats/transforms (`css/variables-with-roles` for the light
 * block, the theme-overrides format for the dark block - the SAME one that HARD-ERRORS on a
 * flat-hex override) and the shared AA guard (`contrast.mjs`). The build THROWS if any role/state
 * pair breaks AA in either theme, or if the brand leaves any Canopy semantic role unmapped - a
 * broken brand can't ship green.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { cssTransforms, themeConfig } from './style-dictionary.config.mjs';
import { checkBrandCss, extractThemedRoles } from './contrast.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const toAbs = (p) => resolve(process.cwd(), p);
const asArray = (v) => (Array.isArray(v) ? v : [v]);
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * The semantic roles a brand MUST map, read from Canopy's OWN shipped `dist/tokens.css` (the
 * themed `--color-*` roles that reference a primitive). Deriving the contract from what Canopy
 * actually ships means it can never drift from a hand-maintained list.
 */
const requiredRoles = () => {
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
  return roles;
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
  const lightSelector = scope ? `.${slug}` : ':root';
  const darkSelector = scope ? `.${slug}.dark` : '.dark';
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

    // Compose brand.css in ONE write (pure function of the two sidecars -> idempotent).
    const css = readFileSync(lightSidecarPath, 'utf8') + readFileSync(darkSidecarPath, 'utf8');
    writeFileSync(out, css);

    // Validate: AA in both themes + every Canopy role mapped. Throw on any failure.
    const roles = requiredRoles();
    const { failures, missingLight, missingDark } = checkBrandCss(css, {
      lightSelector,
      darkSelector,
      requiredRoles: roles,
    });
    const problems = [];
    if (missingLight.length) problems.push(`unmapped in light: ${missingLight.join(', ')}`);
    if (missingDark.length) problems.push(`unmapped in dark: ${missingDark.join(', ')}`);
    if (failures.length) problems.push(`AA failures:\n  ${failures.join('\n  ')}`);
    if (problems.length) {
      throw new Error(
        `Brand "${name}" is not shippable - it must map every Canopy semantic role and meet ` +
          `WCAG AA in light AND dark:\n${problems.join('\n')}`,
      );
    }

    return { outFile: out, css, roles, selectors: { light: lightSelector, dark: darkSelector } };
  } finally {
    // Always drop the sidecars, even on a thrown validation error.
    rmSync(lightSidecarPath, { force: true });
    rmSync(darkSidecarPath, { force: true });
  }
}
