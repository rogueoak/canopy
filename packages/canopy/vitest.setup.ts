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
