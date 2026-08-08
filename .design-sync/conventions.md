## Building with Canopy

Canopy is a Tailwind v4 design system built on semantic design tokens (the `@rogueoak/roots`
layer) with Radix-based interactive primitives. Style with Canopy's **utility classes** — do NOT
write raw hex colors, arbitrary pixel values, or hand-rolled component CSS. Every color utility is
token-backed and re-themes automatically.

### Setup & theming

- The stylesheet is already loaded. Components read CSS variables off `:root` — no theme provider
  or wrapper is needed for the default (light) theme.
- **Dark mode**: add the class `dark` to any ancestor element (e.g. `<body class="dark">`). Every
  semantic token flips automatically — do not add `dark:` variants for color; the tokens handle it.
- **Interactive Radix components need their context provider/parts**, composed as siblings:
  - Tooltips: wrap in `TooltipProvider`, then `Tooltip` > `TooltipTrigger` + `TooltipContent`.
  - Toasts: render `ToastProvider` + `ToastViewport` (or the `Toaster` + `useToast()` convenience).
  - Menus/dialogs (`DropdownMenu`, `Dialog`, `Select`, `Popover`, …) compose a `*Trigger` +
    `*Content` pair; open state is interaction-driven. See each component's `.prompt.md`.

### The styling idiom — semantic utility classes

Use these token-backed families (light/dark flip built in). Prefer semantic role names over raw
scales:

| Purpose | Utilities |
|---|---|
| Page / surfaces | `bg-bg`, `bg-muted`, `bg-muted-raised` |
| Text | `text-text` (default), `text-muted`, `text-text-muted`, `text-text-subtle` |
| Brand / action roles | `bg-primary` (`-hover`/`-active`/`-foreground`), `bg-secondary`, `bg-accent` |
| Status roles | `bg-success`, `bg-warning`, `bg-danger`, `bg-info` (+ `-foreground` for text on them) |
| Borders / focus | `border-border`, `border-border-strong`, `ring` (focus rings via the `ring` token) |
| Type scale | `text-h1`…`text-h4`, `text-body`, `text-caption`, `text-code`, plus `font-sans`/`font-mono` |
| Radius | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full` |

Layout/spacing use standard Tailwind utilities (`flex`, `gap-4`, `p-4`, `grid`, …). Raw scales
(`text-sm`, `text-lg`) exist but reach for the semantic type/role names first.

### Where the truth lives

- Read `_ds/<folder>/styles.css` and its imports for the full token + utility set before styling.
- Each component ships a `.prompt.md` (usage, variants, examples) and a `.d.ts` (exact prop API).
  Read the component's `.prompt.md` before composing it — it shows the real part structure.

### Idiomatic example

```jsx
// A card built from library components + Canopy utilities for the layout glue.
<Card className="max-w-sm">
  <CardHeader>
    <CardTitle>Deploy complete</CardTitle>
    <CardDescription className="text-muted">Your changes are live.</CardDescription>
  </CardHeader>
  <CardContent className="flex items-center gap-3">
    <Badge variant="success">Production</Badge>
    <span className="text-caption text-text-subtle">2 minutes ago</span>
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="ghost">Details</Button>
    <Button variant="primary">Open app</Button>
  </CardFooter>
</Card>
```
