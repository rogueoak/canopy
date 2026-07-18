import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { cn } from '../lib/cn';

/**
 * Accordion - the inline multi-section disclosure Branch (spec 0052), built on
 * `@radix-ui/react-accordion`. Where `Dialog` interrupts (modal) and `SideNav` navigates, the
 * Accordion is the **inline, multi-section** disclosure: a vertical stack of headed sections whose
 * bodies expand and collapse in place, in the normal document flow. It is the canonical pattern for
 * FAQs, settings groups, filter panels, and progressive-disclosure content.
 *
 * It composes the single-disclosure idea Collapsible (0046) owns into a managed *set*: Radix owns
 * `type` single / multiple, `collapsible`, controlled (`value` / `onValueChange`) and uncontrolled
 * (`defaultValue`) state, the header `button` with `aria-expanded` / `aria-controls`, the content
 * `region` wired by `id`, roving keyboard focus (Up/Down/Home/End across triggers, Enter/Space to
 * toggle), the per-item `data-state`, and the `--radix-accordion-content-height` CSS var that drives
 * the open/close height animation. It is a **portalless** primitive (content lives inline), so unlike
 * `Dialog` / `Combobox` there is no portal or overlay to wire. We add only canopy styling and the
 * barrel export.
 *
 * The family follows the 0005 recipe: each part is a small `forwardRef` wrapper that spreads native
 * props and merges `className` via `cn()` (caller wins), typed with `React.ComponentRef` /
 * `React.ComponentPropsWithoutRef`, styled with FULL LITERAL semantic-token utilities so Tailwind
 * v4's scanner emits each, and with NO `dark:` on the common path - light/dark flips through the
 * token layer (spec 0004).
 * - `Accordion` - the Radix `Accordion.Root`; forwards `type`, `collapsible`,
 *   `value` / `defaultValue` / `onValueChange`, and native props unchanged (discriminated so
 *   `type="single"` implies a `string` value and `type="multiple"` a `string[]`).
 * - `AccordionItem` - `Accordion.Item` with a bottom `border-border` divider (`border-b`); takes the
 *   required `value` and optional `disabled`.
 * - `AccordionTrigger` - `Accordion.Header` wrapping `Accordion.Trigger`: a full-width, left-aligned
 *   header `button` with a trailing chevron that rotates 180 degrees on open via Radix's
 *   `data-[state=open]` (no custom state prop).
 * - `AccordionContent` - `Accordion.Content`: the section body, `overflow-hidden` with the
 *   `data-state`-driven height slide (`animate-accordion-down` / `-up`, from the Roots motion preset)
 *   gated behind `motion-reduce:animate-none`; an inner `pb-4` wrapper keeps padding from fighting the
 *   height animation.
 */
export type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;

/**
 * Accordion - the disclosure root. Owns which sections are open: `type="single"` (one at a time,
 * with `collapsible` to allow closing the open one) or `type="multiple"` (any number open),
 * controlled (`value` / `onValueChange`) or uncontrolled (`defaultValue`), all passed straight
 * through to the Radix primitive. Presentational only; carries no styling of its own.
 */
export const Accordion = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Accordion.displayName = AccordionPrimitive.Root.displayName;

export type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

/**
 * AccordionItem - one section. Wraps `Accordion.Item` and adds a bottom `border-border` divider
 * (`border-b`) so stacked sections read as a list. Takes the required `value` (its open/close key)
 * and optional `disabled` (which makes the section's trigger inert), forwarded to Radix.
 */
export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border', className)}
    {...props}
  />
));
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

export type AccordionTriggerProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Trigger
>;

/**
 * AccordionTrigger - the section header. Renders inside `Accordion.Header` (correct heading
 * structure) wrapping a real `Accordion.Trigger` button: full-width, left-aligned label with a
 * trailing chevron (`flex items-center justify-between`, `text-label text-text`, `py-4`,
 * `hover:underline`, the shared focus-visible ring, and the toggle-disabled tokens
 * `disabled:pointer-events-none disabled:opacity-50`). The chevron carries
 * `transition-transform data-[state=open]:rotate-180 motion-reduce:transition-none`, so it rotates
 * 180 degrees on open via Radix's `data-state` - no custom state prop - and stays put for
 * reduced-motion users. Radix supplies `aria-expanded` / `aria-controls`.
 */
export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-between py-4 text-label text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-text-muted transition-transform motion-reduce:transition-none"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

export type AccordionContentProps = React.ComponentPropsWithoutRef<
  typeof AccordionPrimitive.Content
>;

/**
 * AccordionContent - the section body. `overflow-hidden` so the height animation clips its children,
 * `text-body text-text-muted` for the supporting copy, with the `data-state`-driven height slide
 * (`animate-accordion-down` when opening, `animate-accordion-up` when closing) from the Roots motion
 * preset, gated behind `motion-reduce:animate-none` for an instant show/hide under reduced motion.
 * Children render inside an inner `pb-4` wrapper so the padding does not fight the collapsing height.
 * Radix hides the region from the accessibility tree when closed.
 */
export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-body text-text-muted data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up motion-reduce:animate-none',
      className,
    )}
    {...props}
  >
    <div className="pb-4">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;
