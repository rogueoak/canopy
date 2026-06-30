# @rogueoak/icons

The curated icon set for [Canopy](https://github.com/rogueoak/canopy), the rogueoak design
system. A small, consistent, tree-shakeable set of React icons re-exported from
[`react-icons`](https://react-icons.github.io/react-icons/) under Canopy-semantic names -
standard UI glyphs from [Lucide](https://lucide.dev) plus the popular social/brand marks.

## Install

```bash
pnpm add @rogueoak/icons react
```

`react` (`>=19`) is a peer dependency; `react-icons` is bundled in as a dependency, so you do
not install it yourself.

## Usage

Every icon is an individual, tree-shakeable named export - import only what you use:

```tsx
import { Home, Search, Github } from '@rogueoak/icons';

export function Example() {
  return (
    <nav>
      <Home />
      <Search />
      <a href="https://github.com/rogueoak">
        <Github />
      </a>
    </nav>
  );
}
```

Icons render in `currentColor` and at `1em` by default, so they inherit the colour and scale of
the surrounding text - no theming wiring required. Size and colour them however you style the
rest of your app; with Tailwind (the Canopy default) that is utilities:

```tsx
<Home className="size-5 text-muted-foreground" />
```

…or the `size` / `color` props that every icon accepts (from `react-icons`):

```tsx
<Home size={20} color="rebeccapurple" />
```

## The `Icon` wrapper and `IconProvider`

`Icon` is a thin wrapper for a single glyph that applies the default size, `currentColor`, and -
importantly - the right accessibility semantics:

```tsx
import { Icon, Home } from '@rogueoak/icons';

// Decorative (the default): hidden from screen readers (aria-hidden).
<Icon icon={Home} className="size-5" />

// Meaningful: pass a title - the icon becomes role="img" with that accessible name.
<Icon icon={Home} title="Home" />
```

`IconProvider` sets defaults (size, color, className) for every icon in a subtree:

```tsx
import { IconProvider, Home, Search } from '@rogueoak/icons';

<IconProvider value={{ size: '1.25rem', className: 'text-muted-foreground' }}>
  <Home />
  <Search />
</IconProvider>;
```

## Accessibility

A bare icon (`<Home />`) is **not** hidden from assistive tech on its own. For a purely decorative
glyph, either render it through `<Icon icon={Home} />` (hidden by default) or add `aria-hidden`
yourself. For a meaningful icon, give it a `title` (via `Icon`, which also sets `role="img"`) or
label the control that contains it.

## The set

Standard glyphs come from **Lucide** (`react-icons/lu`); the social marks come from **Font Awesome
6 brands** (`react-icons/fa6`) - Simple Icons no longer ships LinkedIn, so all five social marks
come from one family for a consistent look.

Note the two families differ in weight by design: Lucide glyphs are **stroke** (outline) icons,
while the brand marks are **filled** logos (their canonical form). At the same `1em` a filled brand
mark therefore reads heavier than a stroke glyph - expected when mixing a UI icon and a logo, but
worth knowing if you place them side by side (the Storybook catalog groups them separately for
this reason).

- **Social:** `Github`, `Linkedin`, `X`, `Facebook`, `Instagram`.
- **Standard:** navigation and chevrons/arrows, actions (`Plus`, `Minus`, `Trash`, `Edit`, `Copy`,
  `Download`, `Upload`), status (`Info`, `AlertTriangle`, `AlertCircle`, `CheckCircle`, `Loader`),
  and common UI glyphs (`Home`, `Search`, `Settings`, `User`, `Menu`, `Bell`, `Calendar`, `Mail`,
  `Eye`/`EyeOff`, `Sun`/`Moon`, `Lock`/`Unlock`, `Star`, `Heart`, `Filter`, `MoreHorizontal`,
  `MoreVertical`, `LogOut`, …).

> **Name note:** the dismiss/close glyph is exported as **`Close`** so that **`X`** is free for the
> X (formerly Twitter) brand mark.

The full set with every name is browsable in the Canopy Storybook under **Icons / Catalog**. The
complete, authoritative list lives in [`src/icons.ts`](./src/icons.ts), and `iconNames` /
`iconRegistry` (exported) give you the set as data:

```tsx
import { iconRegistry, iconNames } from '@rogueoak/icons';
// iconNames: string[]            -> ['AlertCircle', 'AlertTriangle', ...]
// iconRegistry: Record<name, Icon> -> render dynamically. (Imports every icon - not tree-shaken.)
```

## License

MIT - see the [Canopy repository](https://github.com/rogueoak/canopy).
