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
  external: ['react', 'react-dom', '@rogueoak/roots', '@radix-ui/react-slot'],
});
