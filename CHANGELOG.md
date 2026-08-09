# Changelog

All notable changes to Canopy are recorded here. Releases are tag-driven (a bare-SemVer tag is the
release), and the three packages - `@rogueoak/roots`, `@rogueoak/canopy`, `@rogueoak/icons` -
publish in lockstep at the tag version.

## 1.5.0 - 2026-08-09

### Added

- **Audio** - a new Branch: a basic audio player with play/pause, skip back, skip forward, and a
  scrubbable progress bar, stacked with the bar over the elapsed / total time and the transport
  controls below. It wraps [howler.js](https://howlerjs.com) for playback and is built from Canopy's
  own `Button` and `Slider` Seeds, so - unlike `Video` - it needs **no stylesheet and no extra
  wiring**: if Canopy is set up, `Audio` works, themes light/dark, and adopts a brand override like
  every other component. The two skip intervals are independent props (`skipBackSeconds`,
  `skipForwardSeconds`, both defaulting to 10), so the podcast convention of back-15 / forward-30
  needs no new component. `startAtSeconds` begins at a position, for resuming an episode or
  deep-linking a timestamp. Keyboard operable throughout, and the scrub bar announces its position
  as a time (`2:22`) rather than a raw second count. While media is in flight the play button holds
  a spinner and the player sets `aria-busy`; if it fails to load, the player says so and stays inert
  rather than looking merely slow, with `loadingLabel` / `errorLabel` as props and `onLoadError` for
  the callback. To drive playback yourself, `onReady` hands you an `AudioHandle` - `play`, `pause`,
  `stop`, `seek`, `getPosition`, `getDuration`, `setVolume`, `isPlaying`. That handle is
  **Canopy's own interface, not the playback library's**: there is deliberately no raw-options
  passthrough and no access to the engine, so which library plays the audio stays an implementation
  detail we can change without breaking you. For the same reason the props name intent rather than
  mechanism - `stream` for "do not download the whole file first" - and load failures arrive as an
  `AudioLoadError` with a `reason` of `media` or `engine`. Note two things about the media itself:
  long files want `stream` (by default the whole clip is buffered before playback starts), and the
  default path needs CORS on a cross-origin source - `stream` fixes both. (spec 0071)
- **Video** - the media-player Branch, a [video.js](https://videojs.com) player with its control bar
  fully skinned to the Canopy tokens, shipped as `@rogueoak/canopy/video.css`. Lean props for the
  common case plus an `options` passthrough and `onReady(player)`; fluid and responsive by default;
  video.js is loaded lazily so it stays out of your initial bundle. The skin references only
  semantic role tokens, so the controls theme light/dark and re-colour under a brand override with
  no component change. Wiring is two stylesheet imports, documented in the package README. (spec
  0070 - shipped earlier but missed in the release notes at the time, recorded here)

### Changed

- **Slider** - `aria-valuetext` now forwards to the thumb on a single-value slider, alongside the
  `aria-label` / `aria-labelledby` that already did. Radix puts a raw `aria-valuenow` on the thumb,
  which is the wrong announcement whenever the value maps to something else - a media position, a
  rating, a named step - so a caller that knows the human form of its value can now supply it.
  Additive and backwards compatible; range sliders are unchanged, since their two thumbs hold two
  values and one shared text would misreport one of them.

## 1.4.0 - 2026-08-09

### Removed

- **SubscribeForm honeypot (breaking)** - `SubscribeForm` no longer renders the hidden `company`
  honeypot input, and `SubscribeValues` drops its `company` field: the payload handed to
  `onSubscribe` is now `{ email, name }`. The hidden field was a false-negative risk - browser and
  password-manager autofill can populate a hidden `company`/organization input the reader never
  sees, which tripped each app's server-side drop and silently lost a real subscriber. Anti-abuse
  now rests on the layers that do not depend on a field staying empty (per-IP rate limiting,
  body-size caps, double-opt-in). Migration: a consumer whose `onSubscribe` destructured `company`
  should remove it and delete its server-side honeypot check; no other change is needed. (feedback 0024)

## 1.3.0 - 2026-08-08

### Changed

- **Brand pipeline** - a dark value that equals its light value no longer fails the build. It is
  reported instead, as `warnings.identicalDark` on the `buildBrand()` result and as a note printed
  by the `roots-brand` CLI. WCAG AA remains the only shippability bar (alongside the flat-hex dark
  check), so a brand can now deliberately keep a role reading the same in both themes - a deep
  status fill that stays deep in dark, say - as long as it is legible there. Previously such a
  brand had to shift to a colour step it did not want purely to make the two values unequal.
  Canopy's own core tokens keep the strict rule, where a theme-invariant role really would be a
  copy-paste slip. Backwards compatible: every brand that built before still builds. (feedback 0023)

## 1.2.0 - 2026-07-19

### Added

- **Carousel** - a new `CarouselDots` part: a slide indicator / pager that renders one dot per snap
  point (the selected one elongated and filled with `bg-primary`), clicking a dot scrolls to that
  slide. It reads the snap list and selected index off the embla api and re-derives on embla's
  `select` / `reInit` events - no extra wiring beyond dropping it inside a `Carousel`. Renders
  nothing for a single-snap carousel. Each dot carries a 44px hit target and the shared
  focus-visible ring, and the pip is token-driven so it flips light/dark automatically. Exported
  from `@rogueoak/canopy/branches` alongside the existing Carousel parts.

## 1.1.1 - 2026-07-19

### Fixed

- **TopNav** - the mobile disclosure panel now stacks its links vertically again. A regression from
  the NavigationMenu refactor let the links render in a horizontal row on small screens: the panel
  relied on `display:contents` flattening, which Radix's injected wrapper element defeats. The links
  list is now a real flex column (a row at `md+`), independent of the wrapper. (feedback 0022)

## 1.0.0 - 2026-07-18

The first stable release. The component library is feature-complete: every tier is live and
published to npm under the `@rogueoak` scope.

### Components

The full library ships across four tiers (58 components in all), each built on the shared recipe -
semantic-token utilities only, `cn()`, cva variants, `forwardRef` + native spread, light and dark
from the token layer:

- **Roots** - the two-tier design-token foundation: primitive ramps + semantic tokens (light and
  dark, with interaction states), typography roles, spacing, radii, elevation, and motion, compiled
  by Style Dictionary into CSS vars, a typed TS export, and a Tailwind v4 preset. A build-time WCAG
  AA guard, a consumer brand-theming pipeline, and a Swift/iOS token target ship too.
- **Seeds** - 18 atoms: Avatar, Badge, Button, Checkbox, Input, Keyboard, Label, Progress,
  RadioGroup, Select, Separator, Skeleton, Slider, Spinner, Switch, Textarea, Toggle, Tooltip.
- **Twigs** - 14 molecules: Alert, Breadcrumb, ButtonGroup, Card, Collapsible, Empty, FieldSet,
  FormField, InputGroup, InputOTP, Item, Pagination, SearchBar, ToggleGroup.
- **Branches** - 26 organisms: Accordion, AlertDialog, Calendar, Carousel, Chart, Combobox, Command,
  ContextMenu, DataTable, DatePicker, Dialog, Drawer, DropdownMenu, HoverCard, Menubar,
  NavigationMenu, Resizable, ResponsiveDialog, ScrollArea, Sheet, SideNav, SubscribeForm, Table,
  Tabs, Toast, TopNav.
- **Icons** - `@rogueoak/icons`, a curated, tree-shakeable set (Lucide glyphs + social marks)
  re-exported from react-icons.

### Dependencies

The build-out that closed the shadcn coverage gap added these runtime dependencies to
`@rogueoak/canopy` (each resolved at the consumer's install, never bundled):

- Radix primitives: `@radix-ui/react-progress`, `-slider`, `-toggle`, `-toggle-group`,
  `-collapsible`, `-scroll-area`, `-tabs`, `-accordion`, `-alert-dialog`, `-dropdown-menu`,
  `-context-menu`, `-menubar`, `-hover-card`, `-toast`, `-navigation-menu`.
- Behavioural libraries for what Radix has no primitive for: `input-otp`, `vaul`,
  `@tanstack/react-table`, `react-day-picker` + `date-fns`, `embla-carousel-react`, `recharts`.

### Notes

- Command is the shared cmdk surface Combobox now consumes; the vaul-backed Drawer backs SideNav's
  mobile rail and ResponsiveDialog's mobile sheet; TopNav composes NavigationMenu. These are
  API-preserving refactors - imports and props are unchanged.
- The accordion and drawer motion keyframes joined the dialog and bottom-sheet keyframes in the
  Roots Tailwind preset, so a component's keyframed motion works out of the box.
- Storybook (on GitHub Pages) showcases every component in light and dark, alongside the Foundations
  living spec.
