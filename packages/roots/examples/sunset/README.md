# sunset - example Canopy brand

A neutral demo brand for the `@rogueoak/roots` brand pipeline (spec 0028). It is NOT a rogueoak
brand - it exists to prove the pipeline and to copy from.

It defines its OWN primitive ramps (`ember`, `orchid`, `blossom`, `dune`, plus status ramps
`positive`/`caution`/`critical`/`informative`) and maps Canopy's semantic roles onto them for
light (`semantic.json`) and dark (`semantic.dark.json`).

## Build it

```bash
# from this folder, with @rogueoak/roots installed
npx roots-brand brand.config.json
# -> writes sunset.css: a :root { } block (brand primitives + light roles) + a .dark { } block
```

Or from code:

```js
import { buildBrand } from '@rogueoak/roots/brand';

await buildBrand({
  name: 'sunset',
  primitives: 'primitive.json',
  semantic: 'semantic.json',
  semanticDark: 'semantic.dark.json',
  outFile: 'sunset.css',
});
```

## Use it

Import `sunset.css` AFTER Canopy's tokens - it overrides the semantic vars by cascade:

```css
@import '@rogueoak/roots/tokens.css';
@import './sunset.css';
```

Every Canopy component now wears the sunset brand in light and dark, with no component change.

The build FAILS if any role/state pair breaks WCAG AA in either theme, if a role is left unmapped,
or if a dark override is a flat hex instead of a primitive reference.
