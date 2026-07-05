import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * avatarVariants - the cva recipe that maps the Avatar `size` onto canopy semantic-token
 * Tailwind utilities (spec 0015). Class strings are FULL LITERALS so Tailwind v4's source
 * scanner emits each utility - never build a class name dynamically. There is no `dark:` here:
 * the `bg-muted` surface flips light/dark automatically through the token layer (spec 0004).
 *
 * The root is always a circle (`rounded-full`); shapes other than circle are out of scope for
 * this Seed (spec 0015 - square/rounded deferred). Size drives a fixed square box so the image
 * and initials fallback both fill it; the size also sets the font-size so the `AvatarFallback`
 * initials scale WITH the circle (they inherit it): sm `h-8 w-8`/`text-xs`, md `h-10 w-10`/
 * `text-sm`, lg `h-12 w-12`/`text-base`.
 */
export const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

/**
 * Avatar - the canopy identity Seed (spec 0015), built on `@radix-ui/react-avatar` and the
 * 0005 component recipe: semantic-token utilities, `cn()` class merge, and `forwardRef` with a
 * full native prop spread. The root sizes the circle and provides the `bg-muted` surface that
 * shows through while the image loads or if it is absent. Compose with `AvatarImage` and
 * `AvatarFallback`.
 */
export const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn(avatarVariants({ size }), className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

/**
 * AvatarImage - the user photo (`AvatarPrimitive.Image`). Radix only reveals it once the image
 * has actually loaded, so the `AvatarFallback` shows through until then (and stays if the image
 * is missing or errors). `aspect-square` + `h-full w-full` + `object-cover` make it fill the
 * circle without distortion. Always pass a meaningful `alt`.
 */
export const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

/**
 * AvatarFallback - the graceful fallback (`AvatarPrimitive.Fallback`) shown while the image is
 * loading, or whenever it is absent or fails to load. Typically holds the user's initials; it
 * centres them on the `bg-muted` surface with `text-muted-foreground`. The font-size is INHERITED
 * from the Avatar root's `size` (so the initials scale with the circle); set `text-*` here only
 * to override. Pass `delayMs` to avoid a flash of the fallback when the image resolves quickly.
 */
export const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
