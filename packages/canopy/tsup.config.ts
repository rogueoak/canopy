import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'seeds/index': 'src/seeds/index.ts',
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
    '@radix-ui/react-slot',
    '@radix-ui/react-label',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-switch',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
  ],
});
