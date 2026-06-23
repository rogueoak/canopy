import { defineConfig } from 'tsup';

// Compiles the Style-Dictionary-generated dist/tokens.ts (typed token export)
// into a published ESM module + .d.ts, in place under dist/.
export default defineConfig({
  entry: ['dist/tokens.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: false,
  sourcemap: false,
});
