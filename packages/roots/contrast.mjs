/**
 * Shared WCAG AA contrast guard (spec 0028; extracted from tokens.test.ts 0004).
 *
 * The relative-luminance + contrast math and the canonical role-pair list live here so ONE
 * definition guards both the core Canopy tokens (`tokens.test.ts` imports these) and every
 * consumer brand (`buildBrand` runs `checkBrandCss` over the generated `brand.css`). A single
 * source means a brand is held to the exact same AA bar as Canopy, and the bar can never drift
 * between the two.
 */

/** sRGB channel (0..255) -> linear light. WCAG 2.1. */
export const srgbToLinear = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance of a 6-digit hex. */
export const luminance = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex: ${hex}`);
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
};

/** WCAG 2.1 contrast ratio between two hexes (order-independent). */
export const contrast = (hex1, hex2) => {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * [foreground role, background role, min ratio]. 4.5 = AA normal; 3.0 = AA large
 * (text-subtle is the documented large-text-only tertiary role; ring is non-text).
 *
 * `disabled` / `disabled-foreground` are DELIBERATELY excluded: WCAG 2.1 exempts disabled
 * controls (1.4.3) from the contrast minimum, and the role is intentionally low-contrast.
 */
export const AA_PAIRS = [
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
  ['color-text', 'color-muted-raised', 4.5],
  ['color-success-foreground', 'color-success', 4.5],
  ['color-warning-foreground', 'color-warning', 4.5],
  ['color-danger-foreground', 'color-danger', 4.5],
  ['color-info-foreground', 'color-info', 4.5],
  ['color-ring', 'color-bg', 3.0],
  ['color-primary-foreground', 'color-primary-hover', 4.5],
  ['color-primary-foreground', 'color-primary-active', 4.5],
  ['color-secondary-foreground', 'color-secondary-hover', 4.5],
  ['color-secondary-foreground', 'color-secondary-active', 4.5],
  ['color-danger-foreground', 'color-danger-hover', 4.5],
  ['color-danger-foreground', 'color-danger-active', 4.5],
  ['color-accent-foreground', 'color-accent-hover', 4.5],
];

/** Parse `--name: value;` declarations out of one CSS rule body into a name->value map. */
export const parseDecls = (body) => {
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)) {
    out[m[1].trim()] = m[2].trim();
  }
  return out;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Extract the declaration map of the rule whose selector is EXACTLY `selector`
 * (`:root`, `.dark`, `.sunset`, `.sunset.dark`, ...). The selector is anchored so a compound
 * like `.sunset.dark` is never mistaken for a bare `.dark` (which is a substring of it).
 * Returns `null` when the block is absent.
 */
export const extractBlock = (css, selector) => {
  const re = new RegExp(`(?:^|[\\s}])${escapeRe(selector)}\\s*\\{`, 'm');
  const m = re.exec(css);
  if (!m) return null;
  const open = css.indexOf('{', m.index);
  const close = css.indexOf('}', open);
  if (open === -1 || close === -1) return null;
  return parseDecls(css.slice(open + 1, close));
};

/**
 * The themed semantic roles of a `:root` block: `--color-*` vars whose value REFERENCES a
 * primitive (`var(--...)`), i.e. roles - not the primitive ramp literals and not composite
 * text roles. This is what a brand must fully re-map.
 */
export const extractThemedRoles = (css) => {
  const root = extractBlock(css, ':root') ?? {};
  return Object.keys(root).filter(
    (name) => name.startsWith('color-') && /^var\(--[a-z0-9-]+\)$/i.test(root[name]),
  );
};

/**
 * Validate a generated brand stylesheet against the AA guard and role coverage.
 *
 * - `lightSelector` block holds brand primitives (hex literals) + light roles (`var(--primitive)`).
 * - `darkSelector` block holds dark roles (`var(--primitive)`); primitives resolve from the light
 *   block, which is where the brand declares them.
 * - `requiredRoles` is the set of semantic roles the brand MUST map (derived from Canopy's own
 *   shipped tokens, so the contract can't drift).
 *
 * Returns `{ failures, missingLight, missingDark, identicalDark }`. Empty arrays == the brand is
 * AA-safe and complete. Resolution chases `var(--x)` references to a hex literal within the
 * relevant block.
 */
// The one role deliberately theme-invariant: a near-black accent foreground that reads on the
// accent fill in BOTH themes, so its dark override legitimately equals its light value. Mirrors
// the core tokens.test.ts allowlist so a brand's copy-paste guard matches Canopy's.
const THEME_INVARIANT_ROLES = new Set(['color-accent-foreground']);

export const checkBrandCss = (
  css,
  { lightSelector = ':root', darkSelector = '.dark', requiredRoles },
) => {
  const light = extractBlock(css, lightSelector);
  const dark = extractBlock(css, darkSelector);
  if (light == null) throw new Error(`brand.css is missing a \`${lightSelector}\` block`);
  if (dark == null) throw new Error(`brand.css is missing a \`${darkSelector}\` block`);

  const chase = (block, name, seen = new Set()) => {
    if (seen.has(name)) throw new Error(`reference cycle at ${name}`);
    seen.add(name);
    const raw = block[name];
    if (raw == null) throw new Error(`unknown var: ${name}`);
    const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw);
    return ref ? chase(block, ref[1], seen) : raw;
  };
  const resolveLight = (name) => chase(light, name);
  // A dark role points at a brand primitive; primitives live in the light block.
  const resolveDark = (name) => {
    const raw = dark[name] ?? light[name];
    const ref = /^var\(--([a-z0-9-]+)\)$/i.exec(raw ?? '');
    return ref ? chase(light, ref[1]) : raw;
  };

  const missingLight = requiredRoles.filter((r) => light[r] == null);
  const missingDark = requiredRoles.filter((r) => dark[r] == null);

  // A dark override that resolves to the SAME hex as light is usually a copy-paste slip - the role
  // would look identical across themes (a light palette rendered in dark mode). Guarded here the way
  // the core guards it, minus the one deliberately theme-invariant role.
  const identicalDark = requiredRoles.filter(
    (r) =>
      light[r] != null &&
      dark[r] != null &&
      !THEME_INVARIANT_ROLES.has(r) &&
      resolveLight(r) === resolveDark(r),
  );

  const failures = [];
  for (const [fg, bg, min] of AA_PAIRS) {
    // Skip pairs whose roles the coverage check already flagged as missing (avoids a noisy
    // "unknown var" throw masking the clearer missing-role message).
    if (missingLight.includes(fg) || missingLight.includes(bg)) continue;
    const light1 = contrast(resolveLight(fg), resolveLight(bg));
    if (light1 < min) failures.push(`light: ${fg} on ${bg}: ${light1.toFixed(2)} < ${min}`);
    if (missingDark.includes(fg) || missingDark.includes(bg)) continue;
    const dark1 = contrast(resolveDark(fg), resolveDark(bg));
    if (dark1 < min) failures.push(`dark: ${fg} on ${bg}: ${dark1.toFixed(2)} < ${min}`);
  }
  return { failures, missingLight, missingDark, identicalDark };
};
