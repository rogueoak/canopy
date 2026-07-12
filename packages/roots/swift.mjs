/**
 * iOS / Swift token export (spec 0032).
 *
 * `buildSwift()` turns a brand (the SAME DTCG files `buildBrand()` consumes) plus Canopy's OWN core
 * non-colour tokens into a single SwiftUI-friendly `Tokens.swift`:
 *
 *   enum CanopyColor   - every semantic role as a `Color(light:dark:)` that adapts to the color scheme
 *   enum CanopySpacing - `space.*` as `CGFloat` points
 *   enum CanopyRadius  - `radius.*` as `CGFloat` points
 *   enum CanopyFont    - `text.*` sizes as `CGFloat` + `Font` helpers, `leading.*` as `CGFloat`
 *
 * The architecture already names this the seam that lets a native (Swift) target be added "as just
 * another Style Dictionary platform - no token rewrite." So this reuses the core build's transforms
 * (`cssTransforms`) rather than re-resolving tokens by hand:
 *
 *   - Colours: build TWO throwaway SD instances over [brand primitives + brand semantic] and
 *     [brand primitives + brand semantic.dark] with `outputReferences: false`, so every role resolves
 *     to a concrete hex. The two hex maps become one `Color(light:dark:)` per role.
 *   - Non-colours: one SD instance over Canopy's `space.json` / `radius.json` / `typography.json` /
 *     `typography-roles.json`, resolving each dimension to a literal.
 *
 * Decisions (also stamped into the generated header + the README):
 *   - rem -> pt at 16pt/rem. iOS points are the analogue of CSS px, and Canopy authors rem
 *     (1rem = 16px), so a rem value emits `rem * 16` as a CGFloat. A raw `px` value (radius.full's
 *     9999px pill) emits its number directly.
 *   - Namespace = caseless enums (`enum CanopyColor { ... }`): the idiomatic Swift "namespace with no
 *     instances" - it can't be constructed and does not pollute `Color.`/`Font.` completion the way a
 *     type extension would.
 *   - Colours adapt at runtime via a generated `Color(light:dark:)` initializer backed by a dynamic
 *     `UIColor { traits in ... }` provider (UIKit is imported on iOS/tvOS/Catalyst).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { cssTransforms } from './style-dictionary.config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const toAbs = (p) => resolve(process.cwd(), p);
const asArray = (v) => (Array.isArray(v) ? v : [v]);
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// The brand primitive ramps are named per brand, so the semantic ROLE set is "every color-* token
// that is not a ramp step". A ramp step ends in a numeric scale segment (`-600`) or is a bare
// primitive leaf (`color-base-white`, `color-canvas-light`); a role never does.
const isRampStep = (name) => /-(?:\d+|white|black|light|dark)$/.test(name);
const isColorRole = (name) => name.startsWith('color-') && !isRampStep(name);

/**
 * A flattened kebab token name -> a valid Swift member identifier, dropping a leading category
 * prefix (`space-`, `color-`, ...).
 *
 * - A numeric scale (`4`, `2xl`, `3xl`) starts with a digit, invalid as a Swift identifier, so it is
 *   prefixed with `x` -> `x4`, `x2xl`.
 * - A fractional step (`space.0.5` flattened to `space-0-5`) keeps its fraction readable by joining
 *   the all-numeric tail with an underscore -> `x0_5` (not the ambiguous `x05`).
 * - Otherwise the segments camelCase (`text-muted` -> `textMuted`).
 */
const camel = (name, prefix) => {
  const body = prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name;
  const parts = body.split('-').filter(Boolean);
  // A wholly-numeric scale step (every segment is digits): `0-5` -> `x0_5`, `4` -> `x4`.
  if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p))) {
    return `x${parts.join('_')}`;
  }
  return parts
    .map((p, i) => {
      if (i === 0 && /^\d/.test(p)) return `x${p}`; // `2xl` -> `x2xl`
      return i === 0 ? p : p[0].toUpperCase() + p.slice(1);
    })
    .join('');
};

// A `space.*` / `text.*` scale sorts naturally by numeric magnitude (so `x2` precedes `x10`), with
// the size-word scale (`xs`,`sm`,...) sorted by a fixed ramp order. Falls back to lexical.
const SIZE_ORDER = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
const scaleKey = (name, prefix) => {
  const body = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  const wordIdx = SIZE_ORDER.indexOf(body);
  if (wordIdx !== -1) return wordIdx;
  const n = parseFloat(body.replace(/-/g, '.'));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};
const byScale = (prefix) => (a, b) => scaleKey(a, prefix) - scaleKey(b, prefix) || (a < b ? -1 : 1);

/** Capitalize the first character (for composing camelCase members: `size` + `Xl`). */
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** `#rrggbb` -> `0xRRGGBB` (Swift hex literal). Throws on a non-6-digit hex so a bad value is loud. */
const hexLiteral = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error(`swift: expected a 6-digit hex, got ${JSON.stringify(hex)}`);
  return `0x${m[1].toUpperCase()}`;
};

/**
 * A DTCG dimension -> CGFloat points. `rem` converts at 16pt/rem (1rem = 16px = 16pt); a raw `px`
 * emits its number (radius.full's 9999px pill); a unitless `number` (leading) passes through.
 * Returns a trimmed numeric string (no trailing `.0`) so the emitted Swift is clean.
 */
const REM_TO_PT = 16;
const toPoints = (value) => {
  const raw = String(value).trim();
  let n;
  if (raw.endsWith('rem')) n = parseFloat(raw) * REM_TO_PT;
  else if (raw.endsWith('px')) n = parseFloat(raw);
  else n = parseFloat(raw); // unitless number (leading.*)
  if (!Number.isFinite(n))
    throw new Error(`swift: cannot convert dimension ${JSON.stringify(value)}`);
  // Trim to a tidy literal: 16, 1.5, 0.125 - never 16.0 or 0.12500001.
  return String(Number(n.toFixed(4)));
};

/** Build one SD instance over `sources` and return `{ name -> {type, value} }` for every token. */
const resolveTokens = async (sources, outDir) => {
  const captured = {};
  const formatName = `swift-capture-${Math.random().toString(36).slice(2)}`;
  StyleDictionary.registerFormat({
    name: formatName,
    format: ({ dictionary }) => {
      for (const t of dictionary.allTokens) {
        captured[t.name] = { type: t.$type ?? t.type, value: t.$value ?? t.value };
      }
      return '';
    },
  });
  const sd = new StyleDictionary({
    log: { verbosity: 'silent' },
    source: sources,
    platforms: {
      capture: {
        transforms: cssTransforms,
        buildPath: `${outDir}/`,
        // outputReferences:false so every reference is flattened to a concrete literal.
        files: [
          {
            destination: `.swift-capture-${formatName}`,
            format: formatName,
            options: { outputReferences: false },
          },
        ],
      },
    },
  });
  await sd.buildAllPlatforms();
  return captured;
};

const HEADER = (name) =>
  [
    '// Do not edit - generated by Style Dictionary (Canopy Roots, @rogueoak/roots).',
    `// Brand: ${name}. Regenerate with: npx roots-swift <brand.config.json>`,
    '//',
    '// Colors: each semantic role resolves to a light + dark hex and adapts to the color scheme.',
    '// Dimensions: rem is converted to points at 16pt/rem (1rem = 16px = 16pt); a raw px value',
    '// (radius.full) is emitted as-is. Spacing/radius/type sizes come from Canopy core tokens,',
    '// not the brand.',
  ].join('\n');

const COLOR_HELPER = [
  '#if canImport(UIKit)',
  'import UIKit',
  '#endif',
  'import SwiftUI',
  '',
  'public extension Color {',
  '    /// A color that resolves to `light` in light mode and `dark` in dark mode.',
  '    /// Hexes are 0xRRGGBB. On platforms with UIKit this uses a dynamic UIColor provider so it',
  '    /// updates live when the color scheme changes; elsewhere it falls back to the light value.',
  '    init(light: UInt, dark: UInt) {',
  '        #if canImport(UIKit)',
  '        self = Color(UIColor { traits in',
  '            traits.userInterfaceStyle == .dark ? UIColor(rgb: dark) : UIColor(rgb: light)',
  '        })',
  '        #else',
  '        self = Color(rgb: light)',
  '        #endif',
  '    }',
  '',
  '    init(rgb: UInt) {',
  '        self.init(',
  '            .sRGB,',
  '            red: Double((rgb >> 16) & 0xFF) / 255.0,',
  '            green: Double((rgb >> 8) & 0xFF) / 255.0,',
  '            blue: Double(rgb & 0xFF) / 255.0,',
  '            opacity: 1.0',
  '        )',
  '    }',
  '}',
  '',
  '#if canImport(UIKit)',
  'private extension UIColor {',
  '    convenience init(rgb: UInt) {',
  '        self.init(',
  '            red: CGFloat((rgb >> 16) & 0xFF) / 255.0,',
  '            green: CGFloat((rgb >> 8) & 0xFF) / 255.0,',
  '            blue: CGFloat(rgb & 0xFF) / 255.0,',
  '            alpha: 1.0',
  '        )',
  '    }',
  '}',
  '#endif',
].join('\n');

/**
 * Assemble the whole `Tokens.swift` string from the resolved token maps. Pure (no I/O) so it is
 * directly unit-testable.
 *
 * @param {string} name - brand name (header + doc).
 * @param {Record<string,string>} lightColors - role name -> light hex.
 * @param {Record<string,string>} darkColors - role name -> dark hex.
 * @param {Record<string,{type:string,value:string}>} core - non-colour tokens (space/radius/typography).
 */
export const renderSwift = (name, lightColors, darkColors, core) => {
  const roles = Object.keys(lightColors).sort();
  const colorLines = roles.map((role) => {
    const member = camel(role, 'color-');
    const light = hexLiteral(lightColors[role]);
    const dark = hexLiteral(darkColors[role] ?? lightColors[role]);
    return `    public static let ${member} = Color(light: ${light}, dark: ${dark})`;
  });

  const spacing = Object.keys(core)
    .filter((n) => n.startsWith('space-'))
    .sort(byScale('space-'))
    .map(
      (n) => `    public static let ${camel(n, 'space-')}: CGFloat = ${toPoints(core[n].value)}`,
    );

  const radius = Object.keys(core)
    .filter((n) => n.startsWith('radius-'))
    .sort()
    .map(
      (n) => `    public static let ${camel(n, 'radius-')}: CGFloat = ${toPoints(core[n].value)}`,
    );

  // Type sizes (`text-*` dimensions) as point CGFloats + a `Font` helper, and `leading-*` as
  // unitless CGFloat multipliers. Only `text-*` DIMENSION tokens (the scale) - not the composite
  // `text-role-*` typography tokens, which are not plain dimensions.
  const textSizes = Object.keys(core)
    .filter((n) => n.startsWith('text-') && core[n].type === 'dimension')
    .sort(byScale('text-'));
  const fontSizeLines = textSizes.map(
    (n) =>
      `    public static let size${cap(camel(n, 'text-'))}: CGFloat = ${toPoints(core[n].value)}`,
  );
  const fontHelperLines = textSizes.map((n) => {
    const m = camel(n, 'text-');
    return `    public static func size${cap(m)}Font() -> Font { .system(size: size${cap(m)}) }`;
  });
  // Line-height multipliers, member-prefixed `leading` so a size and a leading never collide and the
  // call site reads clearly (`CanopyFont.leadingTight`).
  const leadingLines = Object.keys(core)
    .filter((n) => n.startsWith('leading-'))
    .sort()
    .map(
      (n) =>
        `    public static let leading${cap(camel(n, 'leading-'))}: CGFloat = ${toPoints(core[n].value)}`,
    );

  return [
    HEADER(name),
    '',
    COLOR_HELPER,
    '',
    '/// Canopy semantic colors. Each adapts to the current color scheme.',
    'public enum CanopyColor {',
    colorLines.join('\n'),
    '}',
    '',
    '/// Canopy spacing scale, in points (rem * 16).',
    'public enum CanopySpacing {',
    spacing.join('\n'),
    '}',
    '',
    '/// Canopy corner radii, in points.',
    'public enum CanopyRadius {',
    radius.join('\n'),
    '}',
    '',
    '/// Canopy type scale: sizes in points, matching line-height multipliers, and Font helpers.',
    'public enum CanopyFont {',
    fontSizeLines.join('\n'),
    '',
    leadingLines.join('\n'),
    '',
    fontHelperLines.join('\n'),
    '}',
    '',
  ].join('\n');
};

/**
 * Generate a brand's `Tokens.swift` and write it to `outFile`.
 *
 * @param {object} options
 * @param {string} options.name - brand name.
 * @param {string|string[]} options.primitives - brand primitive-ramp DTCG file(s).
 * @param {string} options.semantic - brand LIGHT semantic mapping.
 * @param {string} options.semanticDark - brand DARK semantic mapping.
 * @param {string} options.outFile - where to write `Tokens.swift`.
 * @returns {Promise<{outFile:string, swift:string, roles:string[]}>}
 */
export async function buildSwift({ name, primitives, semantic, semanticDark, outFile }) {
  if (!name) throw new Error('buildSwift: `name` is required');
  if (!primitives) throw new Error('buildSwift: `primitives` is required');
  if (!semantic) throw new Error('buildSwift: `semantic` is required');
  if (!semanticDark) throw new Error('buildSwift: `semanticDark` is required');
  if (!outFile) throw new Error('buildSwift: `outFile` is required');

  const out = toAbs(outFile);
  const outDir = dirname(out);
  mkdirSync(outDir, { recursive: true });
  const primitivePaths = asArray(primitives).map(toAbs);

  const lightAll = await resolveTokens([...primitivePaths, toAbs(semantic)], outDir);
  const darkAll = await resolveTokens([...primitivePaths, toAbs(semanticDark)], outDir);

  const pick = (all) =>
    Object.fromEntries(
      Object.keys(all)
        .filter(isColorRole)
        .map((n) => [n, all[n].value]),
    );
  const lightColors = pick(lightAll);
  // The dark semantic file may map only a SUBSET; a role it omits keeps its light hex (mirrors the
  // brand pipeline's light-is-the-dark-fallback rule), so the color adapts only where a dark value
  // was authored.
  const darkPicked = pick(darkAll);
  const darkColors = Object.fromEntries(
    Object.keys(lightColors).map((n) => [n, darkPicked[n] ?? lightColors[n]]),
  );

  // Core non-colour tokens come from Canopy's OWN sources (not the brand), so every brand shares one
  // spacing/radius/type scale.
  const core = await resolveTokens(
    [
      resolve(here, 'tokens/space.json'),
      resolve(here, 'tokens/radius.json'),
      resolve(here, 'tokens/typography.json'),
      resolve(here, 'tokens/typography-roles.json'),
    ],
    outDir,
  );

  const swift = renderSwift(name, lightColors, darkColors, core);
  writeFileSync(out, swift);
  return { outFile: out, swift, roles: Object.keys(lightColors).sort() };
}

export { slugify };
