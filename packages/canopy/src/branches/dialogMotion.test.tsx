import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from './AlertDialog';
import { Dialog, DialogContent, DialogTitle } from './Dialog';

/**
 * A centred overlay must keep its position for the whole of its animation.
 *
 * This is the only test in the package that spans two components and a stylesheet, and it is one
 * test rather than three because the defect it exists for lived in the JOIN between them and in none
 * of the three: `DialogContent` centred itself with `-translate-x-1/2 -translate-y-1/2`, and roots'
 * `dialog-content-in` keyframes ALSO carried `transform: translate(-50%, -50%)`. Tailwind v4
 * compiles those utilities to the individual `translate` property, `translate` and `transform`
 * compose, and so every dialog in the system was offset by a full 100% of its own size until the
 * animation ended and snapped it into place. On a 390px viewport the content box sat at left -187
 * while animating and left 0 the moment it stopped. Each of the three files was defensible read on
 * its own, which is exactly why reading them on their own found nothing.
 *
 * So it asserts the pair, not either half:
 *
 * - the keyframe name is resolved THROUGH the `--animate-*` theme declaration the component's class
 *   actually names, so a component that animates with a utility roots does not define fails here
 *   rather than silently not animating;
 * - any overlay whose class list centres it with a `translate` utility may not name keyframes that
 *   write `transform`, because those are two properties for one job and the browser applies both.
 *
 * It reads the BUILT `dist/tailwind-preset.css` through the package's own `exports` map - the file a
 * consumer gets - rather than the `preset-motion.css` partial it is folded from, so a build step
 * that dropped the partial is a failure here too.
 */

const require_ = createRequire(import.meta.url);
const PRESET = readFileSync(require_.resolve('@rogueoak/roots/tailwind-preset.css'), 'utf8');

/** Radix drives dismissal on Pointer Events and locks scroll; jsdom implements neither. */
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

/**
 * The body of one `@keyframes` block, braces counted rather than matched with a regular expression.
 *
 * A keyframes block nests one level (`from { ... }`), so the lazy `\{[^}]*\}` that reads most CSS
 * rules would stop at the first inner brace and report a body with no declarations in it - which
 * every assertion below would pass.
 */
function keyframeBody(name: string): string {
  const opensAt = PRESET.indexOf(`@keyframes ${name} {`);
  expect(opensAt, `roots defines no @keyframes ${name}`).toBeGreaterThan(-1);

  let depth = 0;
  for (let at = PRESET.indexOf('{', opensAt); at < PRESET.length; at += 1) {
    if (PRESET[at] === '{') {
      depth += 1;
    } else if (PRESET[at] === '}') {
      depth -= 1;
      if (depth === 0) {
        return PRESET.slice(opensAt, at + 1);
      }
    }
  }
  throw new Error(`@keyframes ${name} is never closed`);
}

/**
 * The keyframes an `animate-x` utility runs, read from the `--animate-x` theme declaration.
 *
 * The utility name and the keyframes name are the same today, and hardcoding that would make this
 * test pass for a class roots has never heard of. The declaration is the only thing that actually
 * connects them.
 */
function keyframesNameFor(utility: string): string {
  const declared = new RegExp(`--animate-${utility}:\\s*([^\\s;]+)`).exec(PRESET);
  expect(declared, `roots declares no --animate-${utility}`).not.toBeNull();
  return declared![1];
}

/** Every `animate-*` utility on an element, with the `animate-none` reduced-motion gate dropped. */
function animationsOn(element: Element): string[] {
  const found = element.className.match(/animate-[a-z0-9-]+/g) ?? [];
  return [...new Set(found.map((one) => one.replace('animate-', '')))].filter(
    (one) => one !== 'none',
  );
}

/** Whether the element positions itself with a Tailwind `translate` utility. */
function centresWithTranslate(element: Element): boolean {
  return /(^|[:\s])-?translate-[xy]-/.test(element.className);
}

const CENTRED_OVERLAYS = [
  {
    name: 'Dialog',
    role: 'dialog',
    open: (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Centred</DialogTitle>
        </DialogContent>
      </Dialog>
    ),
  },
  {
    name: 'AlertDialog',
    role: 'alertdialog',
    open: (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Centred</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    ),
  },
];

describe('centred overlay motion', () => {
  it.each(CENTRED_OVERLAYS)(
    '$name centres with translate rather than transform',
    ({ open, role }) => {
      render(open);
      const content = screen.getByRole(role);

      // The premise of the rest of this test. If a redesign ever centres these another way - a grid
      // placement, `margin: auto`, an inset - the keyframes below are free to use `transform`
      // again, and this line is what says so out loud instead of leaving a rule nobody can date.
      expect(centresWithTranslate(content)).toBe(true);

      const animations = animationsOn(content);
      expect(animations.length).toBeGreaterThan(0);

      for (const utility of animations) {
        const body = keyframeBody(keyframesNameFor(utility));
        expect(body, `${utility} writes transform over a translate-centred overlay`).not.toMatch(
          /\btransform\s*:/,
        );
      }
    },
  );

  it('still scales the dialog in and out', () => {
    // The fix must not become "delete the animation". `scale` is an individual property, so it
    // composes with `translate` instead of replacing it - which is the whole reason it is the one
    // used here.
    for (const name of ['dialog-content-in', 'dialog-content-out']) {
      expect(keyframeBody(keyframesNameFor(name))).toMatch(/\bscale\s*:/);
    }
  });
});
