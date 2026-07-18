import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'seeds/index': 'src/seeds/index.ts',
    'twigs/index': 'src/twigs/index.ts',
    'branches/index': 'src/branches/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  // Externalize EVERY runtime dependency (not just Slot): they are declared in
  // `dependencies`, so the consumer installs them once. Bundling clsx/tailwind-merge would
  // risk a second copy in the consumer's graph (e.g. a duplicate tailwind-merge). The rule
  // for the recipe: peers + deps are external, only first-party source is bundled.
  external: [
    'react',
    'react-dom',
    '@rogueoak/roots',
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-avatar',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-slider',
    '@radix-ui/react-slot',
    '@radix-ui/react-label',
    '@radix-ui/react-popover',
    '@radix-ui/react-progress',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toggle',
    '@radix-ui/react-toggle-group',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-tooltip',
    'class-variance-authority',
    'clsx',
    'cmdk',
    'input-otp',
    'tailwind-merge',
  ],
});
