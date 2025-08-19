import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/errors.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: ['@linear/sdk', 'effect'],
  minify: false,
});
