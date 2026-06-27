# @rogueoak/canopy

Components for **[Canopy](https://github.com/rogueoak/canopy)**, the rogueoak design system —
React components built on [`@rogueoak/roots`](https://www.npmjs.com/package/@rogueoak/roots)
tokens, Tailwind v4, and Radix. Components are styled with **semantic-token utilities only**, so
light and dark theming comes from the Roots token layer, not per-component code.

## Install

```bash
pnpm add @rogueoak/canopy @rogueoak/roots
```

React 19 is a **peer dependency** — bring your own `react` and `react-dom`:

```bash
pnpm add react@^19 react-dom@^19
```

## Exports

| Subpath                  | What it is                                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@rogueoak/canopy`       | the package root re-export                                                                                                                                |
| `@rogueoak/canopy/seeds` | **Seeds** (atoms) — Button, Input, Label, Badge, Checkbox, Switch, Radio Group, Textarea, Select, Tooltip, Avatar, Separator, Spinner, Skeleton, Keyboard |
| `@rogueoak/canopy/twigs` | **Twigs** (molecules) — FormField, SearchBar, Card                                                                                                        |

```tsx
import { Button } from '@rogueoak/canopy/seeds';
import { Card, CardHeader, CardTitle, CardContent } from '@rogueoak/canopy/twigs';

export function Example() {
  return <Button>Plant a seed</Button>;
}
```

## Wiring the styles (Tailwind v4)

Canopy ships **`className` strings** (Tailwind v4 utilities), not a prebuilt stylesheet — your
build generates and tree-shakes only the utilities you use. Import Tailwind and the Roots preset,
then add `@source` pointing at `@rogueoak/canopy` so Tailwind scans canopy's component source and
emits its utilities into _your_ build:

```css
@import 'tailwindcss';
@import '@rogueoak/roots/tokens.css';
@import '@rogueoak/roots/tailwind-preset.css';

/* Without this, canopy components render UNSTYLED — the utilities are never emitted.
   `@source` takes a PATH relative to this CSS file; adjust the `../` depth to resolve to
   canopy in your node_modules. */
@source '../node_modules/@rogueoak/canopy';
```

See [`@rogueoak/roots`](https://www.npmjs.com/package/@rogueoak/roots) for the token imports,
fonts, and the `dark` theming toggle.

## License

[MIT](https://github.com/rogueoak/canopy/blob/main/LICENSE) © rogueoak
