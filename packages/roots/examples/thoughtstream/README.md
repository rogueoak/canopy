# thoughtstream - River Mist brand

A real Canopy brand for the `@rogueoak/roots` brand pipeline (spec 0028) and the iOS/Swift export
(spec 0032). River Mist is a calm, muted slate-teal water palette - cool blue-grey neutrals with a
hint of teal, a slate-teal primary, and a brighter aqua accent. It powers the Thought Stream native
app.

It defines its OWN primitive ramps (`slate` primary, `current` secondary, `tide` accent, `mist`
neutral, plus status ramps `positive`/`caution`/`critical`/`informative` tuned cool) and maps
Canopy's semantic roles onto them for light (`semantic.json`) and dark (`semantic.dark.json`).

## Build the CSS brand

```bash
# from this folder, with @rogueoak/roots installed
npx roots-brand brand.config.json
# -> writes thoughtstream.css: a :root { } block (brand primitives + light roles) + a .dark { } block
```

Or from code:

```js
import { buildBrand } from '@rogueoak/roots/brand';

await buildBrand({
  name: 'thoughtstream',
  primitives: 'primitive.json',
  semantic: 'semantic.json',
  semanticDark: 'semantic.dark.json',
  outFile: 'thoughtstream.css',
});
```

Import `thoughtstream.css` AFTER Canopy's tokens - it overrides the semantic vars by cascade:

```css
@import '@rogueoak/roots/tokens.css';
@import './thoughtstream.css';
```

## Build the Swift tokens (iOS/SwiftUI)

The same brand feeds a native SwiftUI target (spec 0032):

```bash
npx roots-swift brand.config.json
# -> writes ../../dist/thoughtstream/Tokens.swift
```

`Tokens.swift` holds every semantic colour resolved to a light + dark hex (adapting to the color
scheme), plus Canopy's spacing / radius / type sizes as `CGFloat` and `Font` helpers. See the roots
README "iOS / Swift export" section for the API shape.

## River Mist ramps (anchors)

- **slate** (primary slate-teal): `slate-600 #42666f` (light primary), `slate-300 #8fb6bb` (dark
  primary).
- **mist** (neutral): `mist-50 #f3f6f6` (bg light), `mist-900 #1e3238` (text light), `mist-950
#0e1618` (bg dark), `mist-100 #e6eded` (text dark).
- **current** (secondary teal): `current-600 #356c73` .. `current-300 #72b6b8`.
- **tide** (accent aqua): `tide-400 #33a89f` (accent fill).

The build FAILS if any role/state pair breaks WCAG AA in either theme, if a dark override equals its
light value, or if a dark override is a flat hex instead of a primitive reference - so every step
above is AA-verified.
