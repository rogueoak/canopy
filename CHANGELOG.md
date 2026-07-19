# Changelog

All notable changes to Canopy are recorded here. Releases are tag-driven (a bare-SemVer tag is the
release), and the three packages - `@rogueoak/roots`, `@rogueoak/canopy`, `@rogueoak/icons` -
publish in lockstep at the tag version.

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
