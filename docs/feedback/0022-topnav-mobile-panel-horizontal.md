# 0022 - TopNav mobile panel rendered links horizontally

## Symptom

On a mobile viewport, opening the TopNav hamburger showed the nav links in a horizontal row (spilling
off the edge) instead of a stacked vertical sheet. The closed state (the hamburger button) and the
`md+` inline row were fine; only the open mobile disclosure panel was wrong. Shipped in 1.0.0/1.1.0
(the NavigationMenu refactor, #89).

## Root cause

`TopNavLinks` rendered its links list as `NavigationMenuList className="contents md:contents"`,
relying on `display:contents` to flatten the list + items so the `TopNavLink`s became direct flex
children of the flex-column panel and stacked. But `NavigationMenu` composes Radix
`NavigationMenu.Root`, which - even when rendered `asChild` onto the panel `<div>` - injects an
unstyled BLOCK `<div>` wrapper between the panel and the `<ul>`. That wrapper is not
`display:contents`, so the flatten broke: the panel's only flex child was the block wrapper, and the
`TopNavLink`s (which are `display:inline`) flowed as inline content inside it - horizontally.

## Fix

Make the list itself the flex container instead of relying on the flatten:
`NavigationMenuList className="flex w-full flex-none flex-col items-start gap-1 md:w-auto md:flex-row md:items-center md:gap-1"`.
A real flex column blockifies the inline link flex-items so they stack on mobile and sit in a row at
`md+`, independent of the injected wrapper. `flex-none` + `md:w-auto` cancel the `NavigationMenuList`
base's `flex-1`, so its base `justify-center` has no extra room and the desktop links stay
left-packed; `items-start` left-aligns the mobile sheet, `md:items-center` restores the desktop row's
vertical centering. Verified in a real browser at 390px (stacked) and 1024px (row). The panel `<div>`
classes are unchanged.

## Learning

Do NOT depend on `display:contents` flattening through a Radix primitive: a primitive may inject
wrapper elements (positioning/viewport containers) that are not `display:contents`, silently breaking
the flatten. Make the styled list the flex container directly. And because flex layout cannot be
asserted in jsdom, guard the responsive intent at the class level (the list carries `flex`/`flex-col`/
`md:flex-row`, never `contents`) so the regression is caught in the unit suite.
