import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@forge/core': path.resolve(__dirname, '../../packages/core/src'), // Src for TS paths in tests
    },
  },
});
