# @rogueoak/canopy

Components for **[Canopy](https://github.com/rogueoak/canopy)**, the rogueoak design system -
React components built on [`@rogueoak/roots`](https://www.npmjs.com/package/@rogueoak/roots)
tokens, Tailwind v4, and Radix. Components are styled with **semantic-token utilities only**, so
light and dark theming comes from the Roots token layer, not per-component code.

## Install

```bash
pnpm add @rogueoak/canopy @rogueoak/roots
```

React 19 is a **peer dependency** - bring your own `react` and `react-dom`:

```bash
pnpm add react@^19 react-dom@^19
```

## Exports

Every component tier ships on its own subpath, so imports stay self-documenting and tree-shake per
layer. The layer boundary is one-way: twigs import seeds, branches import twigs and seeds, never the
reverse.

| Subpath                     | What it is                               |
| --------------------------- | ---------------------------------------- |
| `@rogueoak/canopy`          | the package root re-export               |
| `@rogueoak/canopy/seeds`    | **Seeds** (atoms) - 18 components        |
| `@rogueoak/canopy/twigs`    | **Twigs** (molecules) - 14 components    |
| `@rogueoak/canopy/branches` | **Branches** (organisms) - 27 components |

```tsx
import { Button } from '@rogueoak/canopy/seeds';
import { Card, CardHeader, CardTitle, CardContent } from '@rogueoak/canopy/twigs';

export function Example() {
  return <Button>Plant a seed</Button>;
}
```

## Catalogue

### Seeds (atoms)

The smallest components, each built on the shared recipe (`cn()`, cva variants over semantic tokens,
Radix `Slot` for `asChild`) and styled with semantic-token utilities only.

| Component    | What it is                                                    |
| ------------ | ------------------------------------------------------------- |
| `Avatar`     | User photo with a graceful initials fallback.                 |
| `Badge`      | Status/metadata pill mapping to the semantic status roles.    |
| `Button`     | The primary action control - variants, sizes, `asChild`.      |
| `Checkbox`   | Boolean field with checked / unchecked / indeterminate.       |
| `Input`      | Native text field, the base every form control builds on.     |
| `Keyboard`   | A `<kbd>` key-cap for help text, command menus, and tooltips. |
| `Label`      | Accessible form label with an optional required marker.       |
| `Progress`   | Determinate progress bar for bounded, measurable tasks.       |
| `RadioGroup` | Single-choice selection with a roving keyboard model.         |
| `Select`     | Single-choice dropdown, portalled on a raised surface.        |
| `Separator`  | Hairline divider with the decorative-vs-semantic ARIA split.  |
| `Skeleton`   | Pulsing placeholder that holds layout while content loads.    |
| `Slider`     | Single-value or range numeric input with keyboard support.    |
| `Spinner`    | Busy indicator with a single-source accessible name.          |
| `Switch`     | On/off toggle for instant settings.                           |
| `Textarea`   | Multi-line text field, mirroring Input for parity.            |
| `Toggle`     | Two-state pressed button with `aria-pressed`.                 |
| `Tooltip`    | Hover/focus hint on a raised surface.                         |

### Twigs (molecules)

Small compositions of Seeds, following the compound-component + context recipe. A Twig adds no new
token - it is themed by the Seeds it composes.

| Component     | What it is                                                                |
| ------------- | ------------------------------------------------------------------------- |
| `Alert`       | Static inline notice (info / success / warning / danger).                 |
| `Breadcrumb`  | Trail-of-ancestors navigation, a stateless a11y-first compound.           |
| `ButtonGroup` | Segmented cluster of joined buttons sharing one seam.                     |
| `Card`        | Bordered, raised surface compound (header / content / footer).            |
| `Collapsible` | Single expand/collapse disclosure, controlled or uncontrolled.            |
| `Empty`       | Zero-data placeholder with media, title, description, actions.            |
| `FieldSet`    | Grouped controls with fieldset/legend semantics and disabled cascade.     |
| `FormField`   | The canonical form molecule - id / describedby / invalid wiring via Slot. |
| `InputGroup`  | Text field with leading/trailing addons in one bordered box.              |
| `InputOTP`    | Segmented one-time-passcode field with paste and auto-advance.            |
| `Item`        | Horizontal row: media + content + trailing actions.                       |
| `Pagination`  | Numbered page navigator with previous/next and ellipsis.                  |
| `SearchBar`   | Search input composing Input + Button + Keyboard.                         |
| `ToggleGroup` | Segmented toggle bar (single/multiple) with roving tabindex.              |

### Branches (organisms)

Self-contained pieces of UI that own interaction state and (often) a portal. A Branch leans on a
behavioural primitive (Radix, cmdk, vaul, embla, recharts, TanStack Table) for the core and adds
composition + token styling.

| Component          | What it is                                                           |
| ------------------ | -------------------------------------------------------------------- |
| `Accordion`        | Multi-section inline disclosure (single/multiple expansion).         |
| `AlertDialog`      | Blocking confirmation modal for destructive actions.                 |
| `Calendar`         | Month grid with single/range/multiple selection and keyboard nav.    |
| `Carousel`         | Draggable, snapping item carousel with prev/next controls.           |
| `Chart`            | recharts wrapper with token-driven colours and styled tooltip.       |
| `Combobox`         | Filterable, type-to-filter multi-select (consumes Command).          |
| `Command`          | Filterable command palette on cmdk, inline or in a dialog.           |
| `ContextMenu`      | Right-click menu anchored at the pointer, with submenus.             |
| `DataTable`        | Headless `useDataTable` + styled grid (sorting, selection, filters). |
| `DatePicker`       | Popover date/range picker composing Calendar.                        |
| `Dialog`           | Focus-trapping, portalled centred modal.                             |
| `Drawer`           | Vaul-backed edge-anchored panel with drag-to-dismiss.                |
| `DropdownMenu`     | Button-triggered actions menu with typeahead and submenus.           |
| `HoverCard`        | Rich preview surface on hover/focus, non-modal.                      |
| `Menubar`          | Horizontal app menu bar with hover-to-open siblings.                 |
| `NavigationMenu`   | Mega-menu with a dropdown per item and indicator tracking.           |
| `Resizable`        | Draggable panel dividers with arrow-key resize.                      |
| `ResponsiveDialog` | Centred modal on desktop, bottom sheet on mobile (consumes Drawer).  |
| `ScrollArea`       | Themed cross-browser scrollbar.                                      |
| `Sheet`            | Radix Dialog-based edge panel with slide motion.                     |
| `SideNav`          | Collapsible, responsive side rail (mobile drawer consumes Drawer).   |
| `SubscribeForm`    | Transport-agnostic email-capture box you wire yourself.              |
| `Table`            | Semantic table parts styled with token borders and row hover.        |
| `Tabs`             | Tab switcher with roving focus and arrow navigation.                 |
| `Toast`            | Transient notifications with auto-dismiss and a `useToast` hook.     |
| `TopNav`           | Responsive top navigation bar (composes NavigationMenu).             |
| `Video`            | video.js player, token-skinned controls (needs two stylesheets).     |

## Wiring the styles (Tailwind v4)

Canopy ships **`className` strings** (Tailwind v4 utilities), not a prebuilt stylesheet - your
build generates and tree-shakes only the utilities you use. Import Tailwind and the Roots preset,
then add `@source` pointing at `@rogueoak/canopy` so Tailwind scans canopy's component source and
emits its utilities into _your_ build:

```css
@import 'tailwindcss';
@import '@rogueoak/roots/tokens.css';
@import '@rogueoak/roots/tailwind-preset.css';

/* Without this, canopy components render UNSTYLED - the utilities are never emitted.
   `@source` takes a PATH relative to this CSS file; adjust the `../` depth to resolve to
   canopy in your node_modules. */
@source '../node_modules/@rogueoak/canopy';
```

See [`@rogueoak/roots`](https://www.npmjs.com/package/@rogueoak/roots) for the token imports,
fonts, and the `dark` theming toggle.

### `Video` needs two extra stylesheets

The `Video` Branch wraps [video.js](https://videojs.com), whose control bar is styled by
structural `.vjs-*` classes that Tailwind's `@source` scan can never see. So - unlike every other
component - `Video` needs two stylesheets imported once, in this order (video.js's base skin first,
then the Canopy skin so it overrides):

```css
@import 'video.js/dist/video-js.css';
@import '@rogueoak/canopy/video.css';
```

The Canopy skin references only Canopy's semantic **role** tokens (`--color-primary`,
`--color-surface-raised`, ...), so the player themes light/dark automatically and **adopts your
brand override for free** - if you re-point those roles (via `@rogueoak/roots` `buildBrand()` or
your own `:root { --color-*: ... }`), the video controls re-colour with no further work.

```tsx
import { Video } from '@rogueoak/canopy/branches';

<Video src="https://example.com/clip.mp4" poster="/poster.jpg" />;
```

video.js is loaded lazily (a dynamic import on mount), so it stays out of your initial bundle and a
page that never renders `<Video>` ships none of it. Reach the raw player through `onReady={(player)
=> ...}` and pass any video.js option through `options={{ ... }}`.

## License

[MIT](https://github.com/rogueoak/canopy/blob/main/LICENSE) © rogueoak
