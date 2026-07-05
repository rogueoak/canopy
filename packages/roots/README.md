# @rogueoak/roots

Design tokens for **[Canopy](https://github.com/rogueoak/canopy)**, the rogueoak design
system — a [Style Dictionary](https://styledictionary.com) pipeline that compiles DTCG token
sources into CSS custom properties, a typed TypeScript export, and a Tailwind v4 preset. It is
the foundation the [`@rogueoak/canopy`](https://www.npmjs.com/package/@rogueoak/canopy)
components style against; components consume **only** semantic tokens, so light and dark theming
is a property of this layer.

## Install

```bash
pnpm add @rogueoak/roots
```

## Exports

| Subpath                               | What it is                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@rogueoak/roots`                     | the typed token export — `import { tokens } from '@rogueoak/roots'`                             |
| `@rogueoak/roots/tokens.css`          | runtime CSS custom properties: `:root { … }` (light) + a `.dark { … }` block                    |
| `@rogueoak/roots/tailwind-preset.css` | a Tailwind v4 `@theme inline` preset so utilities (`bg-primary`, `text-h2`) map onto the tokens |
| `@rogueoak/roots/brand`               | the `buildBrand()` brand pipeline (build-time) - see [Brand theming](#brand-theming)            |

## Tailwind v4 setup

Roots is built for **Tailwind v4** (CSS-first). Import the runtime token vars and the preset in
your global stylesheet:

```css
@import 'tailwindcss';
@import '@rogueoak/roots/tokens.css';
@import '@rogueoak/roots/tailwind-preset.css';
```

`tokens.css` declares the light theme on `:root` and a `.dark { … }` block that re-points only
the **semantic** vars; toggle the `dark` class on a root element to re-theme the whole UI with no
per-component code:

```ts
document.documentElement.classList.toggle('dark');
```

For the rare explicit `dark:` utility, add the variant once:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

## Brand theming

Canopy is themeable across light and dark out of the box. A downstream app can also define its OWN
brand - custom primitive ramps plus the same semantic role names - and re-theme every Canopy
component in light AND dark, without forking roots.

### Build-time pipeline (AA-guarded)

Author a brand as DTCG token files: new primitive ramps (any names you like) and semantic mappings
that reuse Canopy's role names (`color.primary`, `color.bg`, ...) and reference your ramps. Then
generate a `brand.css` with `buildBrand()` or the `roots-brand` CLI:

```js
import { buildBrand } from '@rogueoak/roots/brand';

await buildBrand({
  name: 'sunset',
  primitives: 'brand/primitive.json', // your ramps, e.g. { color: { ember: { 600: { $value: '#...' } } } }
  semantic: 'brand/semantic.json', // Canopy role names -> { color.ember.600 } (light)
  semanticDark: 'brand/semantic.dark.json', // Canopy role names -> dark ramp steps
  outFile: 'dist/sunset.css',
});
```

```bash
# or from a brand.config.json (same fields), via the bundled CLI:
npx roots-brand brand.config.json
```

`brand.css` holds a `:root { ... }` block (your primitives + light roles) and a `.dark { ... }`
block (dark roles). Import it AFTER `tokens.css`, and every component re-themes by cascade - no
component change, because components consume only semantic roles:

```css
@import '@rogueoak/roots/tokens.css';
@import './sunset.css'; /* your brand overrides Canopy's roles */
```

Pass `scope: 'sunset'` to emit `.sunset { ... }` + `.sunset.dark { ... }` instead, so you can scope
a brand to a subtree (`<div class="sunset">`) rather than the whole document.

The pipeline reuses Canopy's OWN Style Dictionary formats and its WCAG AA guard. `buildBrand()`
THROWS - failing your build - if any role/state pair breaks AA in either theme, if a dark override
resolves to the SAME value as its light value (a copy-paste guard), or if a dark override is a flat
hex instead of a primitive reference. So a brand can't ship an illegible or accidentally
light-in-dark theme.

**Partial brands.** You do NOT have to map every role. Map only the roles you want to change (a
brand that re-points just `primary` and the neutrals is common); every role you omit keeps Canopy's
own default by cascade, because `tokens.css` is imported first. The result of the build reports
which roles were inherited (`inherited: { light, dark }`).

The AA guard still holds for a partial brand: an omitted role is resolved to the Canopy default it
inherits, and the **effective** pair is checked. So if you paint `primary` a pale step but omit
`primary-foreground`, the build fails on the near-white default foreground landing on your pale
fill - a partial brand can't ship an illegible combination any more than a full one can.

A new Canopy release that adds a semantic role does NOT break your brand build - the new role simply
inherits its Canopy default until you choose to map it. (Its default pairs are already AA-verified
by Canopy's own build.)

A runnable example brand lives in [`examples/sunset/`](./examples/sunset) - copy it as a starting
point. `style-dictionary` is an OPTIONAL peer dependency, needed only if you run the brand pipeline;
the token exports do not require it.

### Runtime path (quick cases)

For a quick override that does not need the AA guard, an app can redefine the semantic `--color-*`
vars in its own CSS after importing `tokens.css` - Canopy reads them at runtime:

```css
@import '@rogueoak/roots/tokens.css';

:root {
  --color-primary: #b5473a; /* your brand primary */
  --color-primary-foreground: #ffffff;
}
.dark {
  --color-primary: #e08b80;
  --color-primary-foreground: #2a0f0b;
}
```

Prefer the build-time pipeline when you want the AA guarantee - including for a partial brand, whose
overrides are still checked against the Canopy defaults they inherit.

## Fonts

Roots ships the family _names_ only (no CDN). Install the open-licensed
[`@fontsource`](https://fontsource.org) packages and import them once:

```bash
pnpm add @fontsource-variable/figtree @fontsource-variable/geist-mono
```

```css
@import '@fontsource-variable/figtree';
@import '@fontsource-variable/geist-mono';
```

## License

[MIT](https://github.com/rogueoak/canopy/blob/main/LICENSE) © rogueoak
