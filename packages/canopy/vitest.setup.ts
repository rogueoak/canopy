import '@testing-library/jest-dom/vitest';

// jsdom ships no ResizeObserver, but some primitives observe their own size on mount (e.g. the
// `input-otp` engine InputOTP 0045 builds on). Provide a minimal no-op shim so those components
// mount under test; nothing here relies on real observed dimensions.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

// jsdom also omits `document.elementFromPoint`, which the `input-otp` password-manager badge
// detector polls on a timer. Provide a no-op returning null so that background poll is inert under
// test (it plays no part in the OTP behaviour we assert).
if (typeof document !== 'undefined' && typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
}

// `vaul` (the Drawer 0067 primitive, also used by SideNav's mobile rail and ResponsiveDialog's mobile
// sheet) drives its drag gesture on the Pointer Capture API and measures the panel's computed
// `transform`, and locks the body via `matchMedia('(display-mode: standalone)')` on open - none of
// which jsdom implements. Without these shims vaul throws uncaught errors on the pointer events that
// `userEvent.click` synthesises inside an open drawer (failing the run even when the observable
// assertions pass). Shim them as inert no-ops; the drawer's drag physics are not (and cannot be)
// asserted in jsdom - only its observable outcomes (opens, role/aria, close, direction classes).
if (typeof Element !== 'undefined') {
  if (typeof Element.prototype.setPointerCapture !== 'function') {
    Element.prototype.setPointerCapture = () => {};
  }
  if (typeof Element.prototype.releasePointerCapture !== 'function') {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (typeof Element.prototype.hasPointerCapture !== 'function') {
    Element.prototype.hasPointerCapture = () => false;
  }
}
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
// jsdom's computed `transform` is `undefined`; vaul calls `.match()` on it. Guarantee a string so the
// (no-op in jsdom) drag-offset math is inert.
if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
  const realGetComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = ((element: Element, pseudoElt?: string | null) => {
    const style = realGetComputedStyle(element, pseudoElt ?? undefined);
    if (!style.transform) {
      try {
        Object.defineProperty(style, 'transform', { value: 'none', configurable: true });
      } catch {
        /* frozen declaration in some environments; ignore */
      }
    }
    return style;
  }) as typeof window.getComputedStyle;
}
