# @rogueoak/roots

Design tokens for **[Canopy](https://github.com/rogueoak/canopy)**, the rogueoak design
system - a [Style Dictionary](https://styledictionary.com) pipeline that compiles DTCG token
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
| `@rogueoak/roots`                     | the typed token export - `import { tokens } from '@rogueoak/roots'`                             |
| `@rogueoak/roots/tokens.css`          | runtime CSS custom properties: `:root { … }` (light) + a `.dark { … }` block                    |
| `@rogueoak/roots/tailwind-preset.css` | a Tailwind v4 `@theme inline` preset so utilities (`bg-primary`, `text-h2`) map onto the tokens |

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
