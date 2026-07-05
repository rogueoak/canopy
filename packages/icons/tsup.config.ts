import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  // Externalize every runtime dependency (the canopy recipe: peers + deps are external,
  // only first-party source is bundled). react-icons is the icon source; bundling it would
  // pull a copy into our dist and defeat the consumer-shared install + tree-shaking.
  external: ['react', 'react-dom', 'react-icons'],
});
